import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  AGRICULTURAL_ZONES,
  COMMUNITY_POLYGONS,
  GROUND_MOVEMENT_STATIONS,
  INFRASTRUCTURE_ASSETS,
  INITIAL_ACTIVITY_FEED,
  INITIAL_FACILITIES,
  INITIAL_SATELLITE_OBSERVATIONS,
  INITIAL_STREETLIGHTS,
  STUDY_AREAS,
} from './server/data/durbanData.ts';
import { assessCurrentHazards, getOverallRiskLevel, RISK_DEFINITIONS } from './server/services/hazardEngine.ts';
import { runDigitalTwinScenario } from './server/services/simulationEngine.ts';
import {
  filterObservations,
  queryLiveNasaCmrCatalog,
  SATELLITE_ADAPTERS,
} from './server/services/satelliteAdapters.ts';
import type {
  ActivityFeedItem,
  Facility,
  RiskLevel,
  ScenarioPreset,
  Streetlight,
  StreetlightCommandLog,
  TimeOffsetHours,
} from './src/types/sarwatch.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

// In-memory prototype store (clearly labelled simulated data)
let facilities: Facility[] = [...INITIAL_FACILITIES];
let streetlights: Streetlight[] = [...INITIAL_STREETLIGHTS];
let activityFeed: ActivityFeedItem[] = [...INITIAL_ACTIVITY_FEED];
let streetlightCommandLogs: StreetlightCommandLog[] = [
  {
    id: 'CMD-INIT-01',
    timestamp: '2026-11-14T06:45:00Z',
    streetlightId: 'SL-QRW-102',
    community: 'Quarry Road West',
    command: 'SET_PATTERN("HIGH RISK ALERT PATTERN")',
    targetRiskLevel: 'ORANGE',
    reason: 'Initial simulated riparian moisture advisory near Palmiet confluence',
    isSimulated: true,
  },
  {
    id: 'CMD-INIT-02',
    timestamp: '2026-11-14T06:44:00Z',
    streetlightId: 'SL-QRW-101',
    community: 'Quarry Road West',
    command: 'SET_PATTERN("ADVISORY CAUTION AMBER")',
    targetRiskLevel: 'YELLOW',
    reason: 'Elevated simulated GPM rainfall accumulation in corridor',
    isSimulated: true,
  },
];

function statusFromRisk(risk: RiskLevel): Streetlight['simulatedStatus'] {
  switch (risk) {
    case 'RED':
      return 'Critical Hazard Beacon';
    case 'ORANGE':
      return 'High Risk Alert Pattern';
    case 'YELLOW':
      return 'Advisory Caution Amber';
    default:
      return 'Operational - Normal';
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Orbit ZA Command Centre API',
      timestamp: new Date().toISOString(),
      mode: 'prototype-demonstration',
    });
  });

  // Overview summary endpoint
  app.get('/api/overview', (req, res) => {
    const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : 'kzn-durban-metro';
    const studyArea = STUDY_AREAS.find((a) => a.id === areaId) ?? STUDY_AREAS[0];
    const hazards = assessCurrentHazards(facilities);

    const areaFacilities =
      areaId === 'all' ? facilities : facilities.filter((f) => f.studyAreaId === studyArea.id);
    const areaInfra =
      areaId === 'all'
        ? INFRASTRUCTURE_ASSETS
        : INFRASTRUCTURE_ASSETS.filter((i) => i.studyAreaId === studyArea.id);
    const areaAg =
      areaId === 'all'
        ? AGRICULTURAL_ZONES
        : AGRICULTURAL_ZONES.filter((a) => a.studyAreaId === studyArea.id);
    const areaLights =
      areaId === 'all' ? streetlights : streetlights.filter((s) => s.studyAreaId === studyArea.id);

    const exposedFacilities = facilities.filter((f) => f.riskLevel !== 'GREEN');
    const overallStatus = getOverallRiskLevel(hazards.map((h) => h.severity));
    const defaultScenario = runDigitalTwinScenario('elevated', 1, facilities, INFRASTRUCTURE_ASSETS, streetlights);

    res.json({
      studyAreas: STUDY_AREAS,
      selectedStudyArea: studyArea,
      communityPolygons: COMMUNITY_POLYGONS,
      overallStatus,
      riskDefinitions: RISK_DEFINITIONS,
      metrics: {
        totalFacilities: facilities.length,
        areaFacilitiesCount: areaFacilities.length,
        potentiallyExposedFacilities: exposedFacilities.length,
        waterInfrastructureCount: INFRASTRUCTURE_ASSETS.length,
        areaWaterInfrastructureCount: areaInfra.length,
        agriculturalAreasCount: AGRICULTURAL_ZONES.length,
        areaAgriculturalCount: areaAg.length,
        streetlightTotal: streetlights.length,
        areaStreetlightsCount: areaLights.length,
        streetlightActiveAlerts: streetlights.filter((s) => s.riskLevel !== 'GREEN').length,
      },
      rainfallSummary: {
        peakRateMmHr: 18.4,
        accumulation24hMm: 64.2,
        source: 'Simulated NASA GPM IMERG Early Run',
        isSimulated: true,
      },
      hazards,
      facilities,
      infrastructure: INFRASTRUCTURE_ASSETS,
      groundMovement: GROUND_MOVEMENT_STATIONS,
      agriculturalZones: AGRICULTURAL_ZONES,
      streetlights,
      observations: INITIAL_SATELLITE_OBSERVATIONS,
      activityFeed,
      digitalTwinSummary: defaultScenario,
      isSimulated: true,
    });
  });

  // Community Facilities CRUD
  app.get('/api/facilities', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const riskLevel = typeof req.query.riskLevel === 'string' ? req.query.riskLevel : undefined;
    const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';

    const filtered = facilities.filter((f) => {
      if (category && category !== 'ALL' && f.category !== category) return false;
      if (riskLevel && riskLevel !== 'ALL' && f.riskLevel !== riskLevel) return false;
      if (areaId && areaId !== 'ALL' && f.studyAreaId !== areaId) return false;
      if (
        search &&
        !`${f.id} ${f.name} ${f.community} ${f.category} ${f.exposureReason}`.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });

    res.json({
      facilities: filtered,
      total: facilities.length,
      isSimulated: true,
    });
  });

  app.post('/api/facilities', (req, res) => {
    const body = req.body as Partial<Facility>;
    if (!body.name || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      res.status(400).json({ error: 'Facility name, latitude, and longitude are required.' });
      return;
    }

    const category = body.category ?? 'Public Facility';
    // Enforce rule: never assume churches or schools are evacuation centres unless verified
    let verifiedStatus = body.verifiedStatus ?? 'Not Designated as Shelter';
    if ((category === 'School' || category === 'Church') && verifiedStatus !== 'Verified Evacuation Shelter') {
      verifiedStatus = 'Unverified for Evacuation';
    }

    const created: Facility = {
      id: `FAC-KZN-${String(facilities.length + 1).padStart(3, '0')}`,
      name: body.name.trim(),
      category,
      latitude: body.latitude,
      longitude: body.longitude,
      community: (body.community || 'Durban Metro').trim(),
      studyAreaId: body.studyAreaId || 'kzn-durban-metro',
      riskLevel: body.riskLevel || 'GREEN',
      verifiedStatus,
      lastAssessed: new Date().toISOString(),
      dataSource: body.dataSource || 'User Demonstration Entry',
      exposureReason: body.exposureReason || 'Added to demonstration community registry for spatial screening.',
      isSimulated: true,
    };

    facilities = [created, ...facilities];
    activityFeed = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'Facility',
        message: `Demonstration facility added: ${created.name} (${created.category}, ${created.verifiedStatus}).`,
        severity: created.riskLevel,
        isSimulated: true,
      },
      ...activityFeed.slice(0, 19),
    ];

    res.status(201).json(created);
  });

  app.put('/api/facilities/:id', (req, res) => {
    const { id } = req.params;
    const idx = facilities.findIndex((f) => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: `Facility ${id} not found.` });
      return;
    }

    const existing = facilities[idx];
    const patch = req.body as Partial<Facility>;
    const nextCategory = patch.category ?? existing.category;
    let nextVerified = patch.verifiedStatus ?? existing.verifiedStatus;
    if ((nextCategory === 'School' || nextCategory === 'Church') && !patch.verifiedStatus) {
      if (existing.verifiedStatus !== 'Verified Evacuation Shelter') {
        nextVerified = 'Unverified for Evacuation';
      }
    }

    const updated: Facility = {
      ...existing,
      ...patch,
      id: existing.id,
      category: nextCategory,
      verifiedStatus: nextVerified,
      lastAssessed: new Date().toISOString(),
      isSimulated: true,
    };

    facilities[idx] = updated;
    activityFeed = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'Facility',
        message: `Facility record updated: ${updated.name} (${updated.riskLevel} · ${updated.verifiedStatus}).`,
        severity: updated.riskLevel,
        isSimulated: true,
      },
      ...activityFeed.slice(0, 19),
    ];

    res.json(updated);
  });

  // Water Infrastructure & Ground Movement
  app.get('/api/infrastructure', (_req, res) => {
    res.json({
      assets: INFRASTRUCTURE_ASSETS,
      groundMovementStations: GROUND_MOVEMENT_STATIONS,
      disclaimer:
        'Radar backscatter, coherence, and interferometric displacement products are screening indicators only. SAR observations alone never confirm a pipeline leak, broken infrastructure, or structural failure.',
      isSimulated: true,
    });
  });

  // Agricultural Intelligence
  app.get('/api/agriculture', (_req, res) => {
    res.json({
      zones: AGRICULTURAL_ZONES,
      isSimulated: true,
    });
  });

  // Smart Streetlights & Simulated Warning Control
  app.get('/api/streetlights', (_req, res) => {
    res.json({
      streetlights,
      commandLogs: streetlightCommandLogs,
      disclaimer:
        'Satellite nighttime-light observations (NASA VIIRS Black Marble) are not direct measurements of individual streetlight functionality. Actual streetlight control requires authorised municipal IoT infrastructure. All node states and commands shown here are simulated.',
      isSimulated: true,
    });
  });

  app.post('/api/streetlights/simulate', (req, res) => {
    const body = req.body as {
      preset?: ScenarioPreset;
      targetCommunity?: string;
      manualRisk?: RiskLevel;
    };
    const preset = body.preset ?? 'elevated';
    const scenario = runDigitalTwinScenario(preset, preset === 'severe' ? 3 : preset === 'elevated' ? 1 : 0, facilities, INFRASTRUCTURE_ASSETS, streetlights);
    const now = new Date().toISOString();

    const newLogs: StreetlightCommandLog[] = [];
    streetlights = streetlights.map((sl) => {
      if (body.targetCommunity && body.targetCommunity !== 'ALL' && sl.community !== body.targetCommunity) {
        return sl;
      }

      const simUpdate = scenario.streetlightUpdates.find((u) => u.id === sl.id);
      const nextRisk: RiskLevel = body.manualRisk ?? simUpdate?.riskLevel ?? 'GREEN';
      const nextStatus = statusFromRisk(nextRisk);

      newLogs.push({
        id: `CMD-${Date.now()}-${sl.id}`,
        timestamp: now,
        streetlightId: sl.id,
        community: sl.community,
        command: `SIM_DISPATCH_PATTERN("${nextStatus.toUpperCase()}")`,
        targetRiskLevel: nextRisk,
        reason: body.manualRisk
          ? `Operator simulated ${body.manualRisk} advisory test`
          : `Digital Twin ${preset} hazard trigger`,
        isSimulated: true,
      });

      return {
        ...sl,
        riskLevel: nextRisk,
        simulatedStatus: nextStatus,
        lastCommunication: now,
        powerDrawWatts: nextRisk === 'RED' ? 120 : nextRisk === 'ORANGE' ? 110 : nextRisk === 'YELLOW' ? 85 : 75,
      };
    });

    streetlightCommandLogs = [...newLogs, ...streetlightCommandLogs].slice(0, 40);
    activityFeed = [
      {
        id: `ACT-${Date.now()}`,
        timestamp: now,
        category: 'Streetlights',
        message: `Simulated streetlight warning update dispatched to ${newLogs.length} municipal demonstration nodes.`,
        severity: body.manualRisk ?? scenario.severity,
        isSimulated: true,
      },
      ...activityFeed.slice(0, 19),
    ];

    res.json({
      streetlights,
      commandLogs: streetlightCommandLogs,
      updatedCount: newLogs.length,
      isSimulated: true,
    });
  });

  // Digital Twin Simulation Endpoint
  app.get('/api/digital-twin', (req, res) => {
    const presetRaw = typeof req.query.scenario === 'string' ? req.query.scenario : 'elevated';
    const preset: ScenarioPreset =
      presetRaw === 'normal' || presetRaw === 'elevated' || presetRaw === 'severe' ? presetRaw : 'elevated';

    const offsetNum = Number(req.query.offset ?? 0);
    const offset: TimeOffsetHours =
      offsetNum === 0 || offsetNum === 1 || offsetNum === 2 || offsetNum === 3 || offsetNum === 6 ? offsetNum : 0;

    const scenario = runDigitalTwinScenario(preset, offset, facilities, INFRASTRUCTURE_ASSETS, streetlights);
    res.json({
      scenario,
      facilities,
      infrastructure: INFRASTRUCTURE_ASSETS,
      agriculturalZones: AGRICULTURAL_ZONES,
      communityPolygons: COMMUNITY_POLYGONS,
      streetlights,
      studyAreas: STUDY_AREAS,
    });
  });

  // Hazards Endpoint
  app.get('/api/hazards', (_req, res) => {
    const hazards = assessCurrentHazards(facilities);
    res.json({
      hazards,
      riskDefinitions: RISK_DEFINITIONS,
      overallStatus: getOverallRiskLevel(hazards.map((h) => h.severity)),
      disclaimer:
        'Orbit ZA never manufactures official government weather or evacuation warnings. All records shown here are labelled simulated or modelled screening assessments.',
    });
  });

  // Satellite Data Explorer & Real NASA CMR Metadata Adapter
  app.get('/api/satellite-observations', (req, res) => {
    const mission = typeof req.query.mission === 'string' ? req.query.mission : 'ALL';
    const studyAreaId = typeof req.query.areaId === 'string' ? req.query.areaId : 'ALL';
    res.json({
      observations: filterObservations(INITIAL_SATELLITE_OBSERVATIONS, mission, studyAreaId),
      adapters: SATELLITE_ADAPTERS,
    });
  });

  app.get('/api/satellite-adapters/live-catalog', async (req, res) => {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword : 'NISAR';
    const result = await queryLiveNasaCmrCatalog(keyword);
    res.json(result);
  });

  // Reports & Analytics
  app.get('/api/reports/summary', (req, res) => {
    const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : 'kzn-durban-metro';
    const studyArea = STUDY_AREAS.find((a) => a.id === areaId) ?? STUDY_AREAS[0];
    const hazards = assessCurrentHazards(facilities);
    const areaComparison = STUDY_AREAS.map((area) => {
      const fList = facilities.filter((f) => f.studyAreaId === area.id);
      const exposed = fList.filter((f) => f.riskLevel !== 'GREEN').length;
      const infraCount = INFRASTRUCTURE_ASSETS.filter((i) => i.studyAreaId === area.id).length;
      const agCount = AGRICULTURAL_ZONES.filter((z) => z.studyAreaId === area.id).length;
      return {
        studyAreaId: area.id,
        name: area.name,
        totalFacilities: fList.length,
        exposedFacilities: exposed,
        infrastructureCount: infraCount,
        agriculturalZones: agCount,
      };
    });

    const scenarioComparison = ([0, 1, 2, 3, 6] as TimeOffsetHours[]).map((offset) => {
      const elev = runDigitalTwinScenario('elevated', offset, facilities, INFRASTRUCTURE_ASSETS, streetlights);
      const sev = runDigitalTwinScenario('severe', offset, facilities, INFRASTRUCTURE_ASSETS, streetlights);
      return {
        timeOffsetLabel: offset === 0 ? 'Current' : `+${offset}h`,
        elevatedRainfallMm: elev.cumulativeRainfallMm,
        severeRainfallMm: sev.cumulativeRainfallMm,
        elevatedExposedFacilities: elev.exposedFacilityIds.length,
        severeExposedFacilities: sev.exposedFacilityIds.length,
      };
    });

    res.json({
      generatedAt: new Date().toISOString(),
      studyArea,
      hazards,
      exposedFacilities: facilities.filter((f) => f.riskLevel !== 'GREEN'),
      areaComparison,
      scenarioComparison,
      observationsCount: INITIAL_SATELLITE_OBSERVATIONS.length,
      sources: SATELLITE_ADAPTERS.map((a) => `${a.mission} (${a.mode})`),
      isSimulated: true,
    });
  });

  app.get('/api/reports/export', (req, res) => {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : 'all';
    const hazards = assessCurrentHazards(facilities);
    const filteredFacilities =
      areaId === 'all' ? facilities : facilities.filter((f) => f.studyAreaId === areaId);

    if (format === 'csv') {
      const headers = [
        'FacilityID',
        'Name',
        'Category',
        'Community',
        'Latitude',
        'Longitude',
        'RiskLevel',
        'EvacuationVerification',
        'DataSource',
        'Simulated',
      ];
      const rows = filteredFacilities.map((f) =>
        [
          f.id,
          `"${f.name.replace(/"/g, '""')}"`,
          f.category,
          `"${f.community.replace(/"/g, '""')}"`,
          f.latitude,
          f.longitude,
          f.riskLevel,
          `"${f.verifiedStatus}"`,
          `"${f.dataSource.replace(/"/g, '""')}"`,
          String(f.isSimulated),
        ].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="orbit-za-report-${areaId}.csv"`);
      res.send(csv);
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orbit-za-report-${areaId}.json"`);
    res.json({
      application: 'Orbit ZA — Community Risk Intelligence & Environmental Digital Twin',
      challenge: 'NASA Space Apps Challenge 2026 — Dancing with the SARs',
      generatedAt: new Date().toISOString(),
      disclaimer: 'Demonstration dataset — simulated observations and hypothetical scenarios.',
      studyAreaId: areaId,
      hazards,
      facilities: filteredFacilities,
      infrastructure: INFRASTRUCTURE_ASSETS,
    });
  });

  // Vite dev middleware vs static production build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Orbit ZA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Orbit ZA server:', err);
  process.exit(1);
});
