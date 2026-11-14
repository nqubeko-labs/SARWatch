export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type NavSectionId =
  | 'overview'
  | 'community-risk'
  | 'water-infrastructure'
  | 'ground-movement'
  | 'agricultural'
  | 'digital-twin'
  | 'satellite-explorer'
  | 'smart-streetlights'
  | 'reports'
  | 'settings';

export type FacilityCategory =
  | 'Informal Settlement'
  | 'School'
  | 'Clinic'
  | 'Hospital'
  | 'Church'
  | 'Community Hall'
  | 'Evacuation Shelter'
  | 'Public Facility';

export type EvacuationVerificationStatus =
  | 'Verified Evacuation Shelter'
  | 'Unverified for Evacuation'
  | 'Not Designated as Shelter';

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  latitude: number;
  longitude: number;
  community: string;
  studyAreaId: string;
  riskLevel: RiskLevel;
  verifiedStatus: EvacuationVerificationStatus;
  lastAssessed: string;
  dataSource: string;
  exposureReason: string;
  isSimulated: boolean;
}

export type InfrastructureType =
  | 'Dam'
  | 'Reservoir'
  | 'River'
  | 'Water Treatment Facility'
  | 'Mapped Water Pipeline'
  | 'Pump Station';

export interface InfrastructureObservationRecord {
  date: string;
  backscatterVvDb: number;
  backscatterVhDb: number;
  coherence: number;
  displacementMm: number;
  waterLevelPct?: number;
  note: string;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: InfrastructureType;
  latitude: number;
  longitude: number;
  path?: [number, number][];
  community: string;
  studyAreaId: string;
  status: RiskLevel;
  statusLabel: string;
  lastObserved: string;
  nisarProduct: string;
  coherence: number;
  backscatterChangeDb: number;
  displacementMmYr: number;
  exposureIndicator: string;
  history: InfrastructureObservationRecord[];
  isSimulated: boolean;
}

export interface GroundMovementStation {
  id: string;
  name: string;
  corridor: string;
  studyAreaId: string;
  latitude: number;
  longitude: number;
  velocityMmYr: number;
  cumulativeDisplacementMm: number;
  coherence: number;
  riskLevel: RiskLevel;
  sensorMode: string;
  lastAcquisition: string;
  nearbyAssets: string[];
  timeSeries: {
    date: string;
    displacementMm: number;
    coherence: number;
    rainfallMm: number;
  }[];
  isSimulated: boolean;
}

export interface Streetlight {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  community: string;
  studyAreaId: string;
  simulatedStatus: 'Operational - Normal' | 'Advisory Caution Amber' | 'High Risk Alert Pattern' | 'Critical Hazard Beacon';
  riskLevel: RiskLevel;
  lastCommunication: string;
  controllerStatus: 'Simulated Connected' | 'Simulated Standby' | 'Simulated Local Override';
  powerDrawWatts: number;
  isSimulated: boolean;
}

export interface StreetlightCommandLog {
  id: string;
  timestamp: string;
  streetlightId: string;
  community: string;
  command: string;
  targetRiskLevel: RiskLevel;
  reason: string;
  isSimulated: boolean;
}

export interface SatelliteObservation {
  id: string;
  mission: 'NISAR' | 'NASA GPM IMERG' | 'NASA VIIRS Black Marble' | 'Copernicus DEM' | 'ESA WorldCover' | 'HydroSHEDS' | 'WorldPop' | 'SMAP';
  datasetName: string;
  provider: string;
  instrument: string;
  product: string;
  productId: string;
  acquisitionDate: string;
  retrievalDate: string;
  polarization: string;
  resolution: string;
  units: string;
  quality: 'Nominal' | 'Good' | 'Moderate' | 'Demonstration';
  dataSource: string;
  sourceUrl: string;
  summaryValue: string;
  studyAreaId: string;
  isSimulated: boolean;
}

export interface Hazard {
  id: string;
  type: 'Flash Flood Exposure' | 'Slope Instability / Ground Movement' | 'Infrastructure Buffer Exposure' | 'Land Degradation Stress' | 'Coastal & Estuary Surge';
  severity: RiskLevel;
  area: string;
  studyAreaId: string;
  timestamp: string;
  expiryTime: string;
  source: string;
  supportingMeasurements: string[];
  confidence: string;
  classification: 'Simulated' | 'Modelled' | 'Official';
  status: 'Active Simulation' | 'Monitoring' | 'Cleared';
  affectedFacilities: string[];
  recommendedPrecautions: string[];
  isSimulated: boolean;
}

export type ScenarioPreset = 'normal' | 'elevated' | 'severe';
export type TimeOffsetHours = 0 | 1 | 2 | 3 | 6;

export interface FloodExposureZone {
  id: string;
  name: string;
  severity: RiskLevel;
  depthEstimateM: number;
  coordinates: [number, number][];
  community: string;
}

export interface Scenario {
  id: string;
  name: string;
  preset: ScenarioPreset;
  hazardType: string;
  timeOffset: TimeOffsetHours;
  severity: RiskLevel;
  rainfallRateMmHr: number;
  cumulativeRainfallMm: number;
  soilSaturationPct: number;
  backscatterDropDb: number;
  assumptions: string[];
  disclaimer: string;
  floodZones: FloodExposureZone[];
  exposedFacilityIds: string[];
  affectedInfrastructureIds: string[];
  streetlightUpdates: {
    id: string;
    riskLevel: RiskLevel;
    simulatedStatus: Streetlight['simulatedStatus'];
  }[];
  commandLogPreview: StreetlightCommandLog[];
  isSimulated: boolean;
}

export interface AgriculturalZone {
  id: string;
  name: string;
  district: string;
  studyAreaId: string;
  cropType: string;
  areaHectares: number;
  coordinates: [number, number][];
  ndvi: number;
  ndviDelta: number;
  soilMoisturePct: number;
  radarBackscatterHvDb: number;
  radarBackscatterVvDb: number;
  degradationStatus: RiskLevel;
  degradationIndicator: string;
  lastObserved: string;
  history: {
    month: string;
    ndvi: number;
    soilMoisturePct: number;
    backscatterHvDb: number;
    rainfallMm: number;
  }[];
  isSimulated: boolean;
}

export interface StudyArea {
  id: string;
  name: string;
  province: string;
  center: [number, number];
  zoom: number;
  populationEstimate: string;
  boundary: [number, number][];
  description: string;
}

export interface CommunityPolygon {
  id: string;
  name: string;
  studyAreaId: string;
  riskLevel: RiskLevel;
  coordinates: [number, number][];
  notes: string;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  category: 'Satellite' | 'Hazard' | 'Facility' | 'Digital Twin' | 'Streetlights';
  message: string;
  severity: RiskLevel;
  isSimulated: boolean;
}

export interface LiveCatalogCollection {
  id: string;
  title: string;
  shortName: string;
  provider: string;
  timeStart?: string;
  source: 'NASA CMR Live API' | 'Fallback Catalog Metadata';
}
