import type {
  AgriculturalZone,
  CommunityPolygon,
  Facility,
  GroundMovementStation,
  Hazard,
  InfrastructureAsset,
  LiveCatalogCollection,
  RiskLevel,
  SatelliteObservation,
  Scenario,
  ScenarioPreset,
  Streetlight,
  StreetlightCommandLog,
  StudyArea,
  TimeOffsetHours,
} from '../types/sarwatch';

export interface OverviewResponse {
  studyAreas: StudyArea[];
  selectedStudyArea: StudyArea;
  communityPolygons: CommunityPolygon[];
  overallStatus: RiskLevel;
  metrics: {
    totalFacilities: number;
    areaFacilitiesCount: number;
    potentiallyExposedFacilities: number;
    waterInfrastructureCount: number;
    areaWaterInfrastructureCount: number;
    agriculturalAreasCount: number;
    areaAgriculturalCount: number;
    streetlightTotal: number;
    areaStreetlightsCount: number;
    streetlightActiveAlerts: number;
  };
  rainfallSummary: {
    peakRateMmHr: number;
    accumulation24hMm: number;
    source: string;
    isSimulated: boolean;
  };
  hazards: Hazard[];
  facilities: Facility[];
  infrastructure: InfrastructureAsset[];
  groundMovement: GroundMovementStation[];
  agriculturalZones: AgriculturalZone[];
  streetlights: Streetlight[];
  observations: SatelliteObservation[];
  activityFeed: {
    id: string;
    timestamp: string;
    category: string;
    message: string;
    severity: RiskLevel;
    isSimulated: boolean;
  }[];
  digitalTwinSummary: Scenario;
  isSimulated: boolean;
}

export interface DataAdapterInfo {
  id: string;
  name: string;
  mission: string;
  mode: string;
  endpoint: string;
  description: string;
  notes: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let errText = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) errText = data.error;
    } catch {
      // ignore parse failure
    }
    throw new Error(errText);
  }
  return (await res.json()) as T;
}

export const sarwatchApi = {
  getOverview: (areaId = 'kzn-durban-metro') =>
    fetchJson<OverviewResponse>(`/api/overview?areaId=${encodeURIComponent(areaId)}`),

  getFacilities: (params?: { category?: string; riskLevel?: string; areaId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.riskLevel) q.set('riskLevel', params.riskLevel);
    if (params?.areaId) q.set('areaId', params.areaId);
    if (params?.search) q.set('search', params.search);
    return fetchJson<{ facilities: Facility[]; total: number; isSimulated: boolean }>(
      `/api/facilities?${q.toString()}`
    );
  },

  createFacility: (payload: Partial<Facility>) =>
    fetchJson<Facility>('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  updateFacility: (id: string, payload: Partial<Facility>) =>
    fetchJson<Facility>(`/api/facilities/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getInfrastructure: () =>
    fetchJson<{
      assets: InfrastructureAsset[];
      groundMovementStations: GroundMovementStation[];
      disclaimer: string;
      isSimulated: boolean;
    }>('/api/infrastructure'),

  getAgriculture: () =>
    fetchJson<{ zones: AgriculturalZone[]; isSimulated: boolean }>('/api/agriculture'),

  getStreetlights: () =>
    fetchJson<{
      streetlights: Streetlight[];
      commandLogs: StreetlightCommandLog[];
      disclaimer: string;
      isSimulated: boolean;
    }>('/api/streetlights'),

  simulateStreetlights: (payload: {
    preset?: ScenarioPreset;
    targetCommunity?: string;
    manualRisk?: RiskLevel;
  }) =>
    fetchJson<{
      streetlights: Streetlight[];
      commandLogs: StreetlightCommandLog[];
      updatedCount: number;
      isSimulated: boolean;
    }>('/api/streetlights/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getDigitalTwin: (scenario: ScenarioPreset, offset: TimeOffsetHours) =>
    fetchJson<{
      scenario: Scenario;
      facilities: Facility[];
      infrastructure: InfrastructureAsset[];
      agriculturalZones: AgriculturalZone[];
      communityPolygons: CommunityPolygon[];
      streetlights: Streetlight[];
      studyAreas: StudyArea[];
    }>(`/api/digital-twin?scenario=${encodeURIComponent(scenario)}&offset=${offset}`),

  getHazards: () =>
    fetchJson<{ hazards: Hazard[]; overallStatus: RiskLevel; disclaimer: string }>('/api/hazards'),

  getSatelliteObservations: (mission = 'ALL', areaId = 'ALL') =>
    fetchJson<{ observations: SatelliteObservation[]; adapters: DataAdapterInfo[] }>(
      `/api/satellite-observations?mission=${encodeURIComponent(mission)}&areaId=${encodeURIComponent(areaId)}`
    ),

  queryLiveNasaCatalog: (keyword: string) =>
    fetchJson<{
      liveReachable: boolean;
      queriedAt: string;
      keyword: string;
      collections: LiveCatalogCollection[];
      note: string;
    }>(`/api/satellite-adapters/live-catalog?keyword=${encodeURIComponent(keyword)}`),

  getReportSummary: (areaId = 'kzn-durban-metro') =>
    fetchJson<{
      generatedAt: string;
      studyArea: StudyArea;
      hazards: Hazard[];
      exposedFacilities: Facility[];
      areaComparison: {
        studyAreaId: string;
        name: string;
        totalFacilities: number;
        exposedFacilities: number;
        infrastructureCount: number;
        agriculturalZones: number;
      }[];
      scenarioComparison: {
        timeOffsetLabel: string;
        elevatedRainfallMm: number;
        severeRainfallMm: number;
        elevatedExposedFacilities: number;
        severeExposedFacilities: number;
      }[];
      observationsCount: number;
      sources: string[];
      isSimulated: boolean;
    }>(`/api/reports/summary?areaId=${encodeURIComponent(areaId)}`),
};
