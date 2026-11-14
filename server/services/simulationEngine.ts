import type {
  Facility,
  FloodExposureZone,
  InfrastructureAsset,
  RiskLevel,
  Scenario,
  ScenarioPreset,
  Streetlight,
  StreetlightCommandLog,
  TimeOffsetHours,
} from '../../src/types/sarwatch.ts';

function getScenarioParameters(preset: ScenarioPreset, offset: TimeOffsetHours) {
  // Rule-based progression across time offsets (0, +1h, +2h, +3h, +6h)
  const factorMap: Record<TimeOffsetHours, number> = {
    0: 1.0,
    1: 1.25,
    2: 1.55,
    3: 1.85,
    6: 2.15,
  };
  const f = factorMap[offset];

  if (preset === 'normal') {
    const rainRate = Number((4.2 + offset * 0.4).toFixed(1));
    const cumRain = Number((12.0 + offset * 4.5).toFixed(1));
    return {
      severity: 'GREEN' as RiskLevel,
      rainfallRateMmHr: rainRate,
      cumulativeRainfallMm: cumRain,
      soilSaturationPct: Math.min(48, Math.round(28 + offset * 2.5)),
      backscatterDropDb: Number((-0.4 - offset * 0.1).toFixed(1)),
      expansionScale: 0.35,
      depthEstimateM: 0.15,
    };
  }

  if (preset === 'elevated') {
    const rainRate = Number((18.4 * f).toFixed(1));
    const cumRain = Number((58.0 + offset * 18.5).toFixed(1));
    const severity: RiskLevel = offset >= 3 ? 'ORANGE' : 'YELLOW';
    return {
      severity,
      rainfallRateMmHr: rainRate,
      cumulativeRainfallMm: cumRain,
      soilSaturationPct: Math.min(82, Math.round(52 + offset * 4.8)),
      backscatterDropDb: Number((-2.8 - offset * 0.45).toFixed(1)),
      expansionScale: 0.7 + offset * 0.08,
      depthEstimateM: Number((0.45 + offset * 0.14).toFixed(2)),
    };
  }

  // severe preset
  const rainRate = Number((32.5 * f).toFixed(1));
  const cumRain = Number((88.0 + offset * 34.0).toFixed(1));
  let severity: RiskLevel = 'ORANGE';
  if (offset >= 2) severity = 'RED';
  return {
    severity,
    rainfallRateMmHr: rainRate,
    cumulativeRainfallMm: cumRain,
    soilSaturationPct: Math.min(96, Math.round(68 + offset * 4.6)),
    backscatterDropDb: Number((-4.1 - offset * 0.55).toFixed(1)),
    expansionScale: 0.95 + offset * 0.14,
    depthEstimateM: Number((0.75 + offset * 0.24).toFixed(2)),
  };
}

function buildFloodZones(preset: ScenarioPreset, offset: TimeOffsetHours, scale: number, depthM: number): FloodExposureZone[] {
  if (preset === 'normal' && offset === 0) {
    return [
      {
        id: 'FZ-PALMIET-BASE',
        name: 'Palmiet Stream Normal Channel Margin',
        severity: 'GREEN',
        depthEstimateM: 0.1,
        community: 'Quarry Road West',
        coordinates: [
          [-29.8028, 30.9630],
          [-29.8028, 30.9690],
          [-29.8065, 30.9690],
          [-29.8065, 30.9630],
        ],
      },
    ];
  }

  const dLat = 0.0045 * scale;
  const dLon = 0.0075 * scale;
  const primarySeverity: RiskLevel =
    preset === 'severe' ? (offset >= 2 ? 'RED' : 'ORANGE') : offset >= 3 ? 'ORANGE' : 'YELLOW';
  const secondarySeverity: RiskLevel =
    preset === 'severe' ? (offset >= 3 ? 'ORANGE' : 'YELLOW') : 'YELLOW';

  const zones: FloodExposureZone[] = [
    {
      id: 'FZ-QUARRY-PALMIET',
      name: 'Quarry Road West & Palmiet Confluence Simulated Flood Zone',
      severity: primarySeverity,
      depthEstimateM: depthM,
      community: 'Quarry Road West',
      coordinates: [
        [-29.8045 + dLat, 30.9665 - dLon],
        [-29.8045 + dLat, 30.9665 + dLon * 1.3],
        [-29.8045 - dLat * 1.1, 30.9665 + dLon * 1.3],
        [-29.8045 - dLat * 1.1, 30.9665 - dLon],
      ],
    },
    {
      id: 'FZ-UMGENI-SPRINGFIELD',
      name: 'Lower Umgeni & Springfield Industrial Lowland Margin',
      severity: secondarySeverity,
      depthEstimateM: Number((depthM * 0.78).toFixed(2)),
      community: 'Springfield / Sea Cow Lake',
      coordinates: [
        [-29.800 + dLat * 0.8, 30.978 - dLon * 0.6],
        [-29.800 + dLat * 0.8, 30.996 + dLon * 0.9],
        [-29.814 - dLat * 0.8, 30.996 + dLon * 0.9],
        [-29.814 - dLat * 0.8, 30.978 - dLon * 0.6],
      ],
    },
  ];

  if (preset === 'severe' || (preset === 'elevated' && offset >= 2)) {
    zones.push({
      id: 'FZ-ISIPINGO-BASIN',
      name: 'Isipingo Canal & Southern Basin Ponding Envelope',
      severity: preset === 'severe' && offset >= 3 ? 'ORANGE' : 'YELLOW',
      depthEstimateM: Number((depthM * 0.65).toFixed(2)),
      community: 'Isipingo Rail / Umlazi Fringe',
      coordinates: [
        [-29.978 + dLat * 0.6, 30.920 - dLon * 0.5],
        [-29.978 + dLat * 0.6, 30.938 + dLon * 0.6],
        [-29.992 - dLat * 0.6, 30.938 + dLon * 0.6],
        [-29.992 - dLat * 0.6, 30.920 - dLon * 0.5],
      ],
    });
  }

  return zones;
}

function isPointNearZones(lat: number, lon: number, zones: FloodExposureZone[], padDeg = 0.004): boolean {
  return zones.some((zone) => {
    const lats = zone.coordinates.map((c) => c[0]);
    const lons = zone.coordinates.map((c) => c[1]);
    const minLat = Math.min(...lats) - padDeg;
    const maxLat = Math.max(...lats) + padDeg;
    const minLon = Math.min(...lons) - padDeg;
    const maxLon = Math.max(...lons) + padDeg;
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
  });
}

function mapStatusFromRisk(risk: RiskLevel): Streetlight['simulatedStatus'] {
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

export function runDigitalTwinScenario(
  preset: ScenarioPreset,
  offset: TimeOffsetHours,
  facilities: Facility[],
  infrastructure: InfrastructureAsset[],
  streetlights: Streetlight[]
): Scenario {
  const params = getScenarioParameters(preset, offset);
  const floodZones = buildFloodZones(preset, offset, params.expansionScale, params.depthEstimateM);

  const exposedFacilityIds =
    preset === 'normal' && offset === 0
      ? []
      : facilities
          .filter((f) => isPointNearZones(f.latitude, f.longitude, floodZones, preset === 'severe' ? 0.006 : 0.003))
          .map((f) => f.id);

  const affectedInfrastructureIds =
    preset === 'normal' && offset === 0
      ? []
      : infrastructure
          .filter(
            (inf) =>
              isPointNearZones(inf.latitude, inf.longitude, floodZones, 0.012) ||
              (preset === 'severe' && inf.type === 'Dam')
          )
          .map((inf) => inf.id);

  const streetlightUpdates = streetlights.map((sl) => {
    const inZone = isPointNearZones(sl.latitude, sl.longitude, floodZones, 0.008);
    let targetRisk: RiskLevel = 'GREEN';
    if (preset === 'normal') {
      targetRisk = 'GREEN';
    } else if (preset === 'elevated') {
      targetRisk = inZone ? (offset >= 3 ? 'ORANGE' : 'YELLOW') : offset >= 3 ? 'YELLOW' : 'GREEN';
    } else {
      targetRisk = inZone ? (offset >= 2 ? 'RED' : 'ORANGE') : offset >= 2 ? 'ORANGE' : 'YELLOW';
    }
    return {
      id: sl.id,
      riskLevel: targetRisk,
      simulatedStatus: mapStatusFromRisk(targetRisk),
    };
  });

  const simBaseTime = new Date('2026-11-14T06:45:00Z');
  const simTime = new Date(simBaseTime.getTime() + offset * 3600 * 1000).toISOString();

  const commandLogPreview: StreetlightCommandLog[] = streetlightUpdates
    .filter((u) => u.riskLevel !== 'GREEN')
    .map((u, idx) => {
      const node = streetlights.find((s) => s.id === u.id)!;
      return {
        id: `CMD-SIM-${offset}H-${idx + 1}`,
        timestamp: simTime,
        streetlightId: u.id,
        community: node.community,
        command: `SET_PATTERN("${u.simulatedStatus.toUpperCase()}")`,
        targetRiskLevel: u.riskLevel,
        reason: `Hypothetical T+${offset}h ${preset} rainfall scenario (${params.rainfallRateMmHr} mm/hr)`,
        isSimulated: true,
      };
    });

  const presetLabel =
    preset === 'normal'
      ? 'Normal Baseline Conditions'
      : preset === 'elevated'
      ? 'Elevated Rainfall Hazard'
      : 'Severe Convective Storm Event';

  return {
    id: `SCEN-${preset.toUpperCase()}-T${offset}`,
    name: `${presetLabel} (T+${offset}h)`,
    preset,
    hazardType: 'Hypothetical Heavy-Rainfall & Riparian Exposure',
    timeOffset: offset,
    severity: params.severity,
    rainfallRateMmHr: params.rainfallRateMmHr,
    cumulativeRainfallMm: params.cumulativeRainfallMm,
    soilSaturationPct: params.soilSaturationPct,
    backscatterDropDb: params.backscatterDropDb,
    floodZones,
    exposedFacilityIds,
    affectedInfrastructureIds,
    streetlightUpdates,
    commandLogPreview,
    assumptions: [
      `Hypothetical rainfall forcing of ${params.rainfallRateMmHr} mm/hr sustained through T+${offset}h (cumulative ${params.cumulativeRainfallMm} mm).`,
      `Antecedent catchment soil moisture initialized at ${params.soilSaturationPct}% based on SMAP/NISAR proxy baseline.`,
      'Flood-exposure envelopes expand proportionally along low-lying Copernicus 30m DEM terraces near Quarry Road West, Springfield, and Isipingo.',
      'Smart streetlight status changes assume authorised municipal IoT controller integration (simulated only in prototype).',
      'Rule-based prototype logic is designed to accept future hydrodynamic HEC-RAS / LISFLOOD-FP model outputs.',
    ],
    disclaimer:
      'HYPOTHETICAL DIGITAL TWIN SCENARIO: Not a validated hourly meteorological forecast or official emergency warning.',
    isSimulated: true,
  };
}
