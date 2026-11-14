import type { Facility, Hazard, RiskLevel } from '../../src/types/sarwatch.ts';

export const RISK_DEFINITIONS: Record<
  RiskLevel,
  {
    code: RiskLevel;
    label: string;
    title: string;
    description: string;
    hex: string;
  }
> = {
  GREEN: {
    code: 'GREEN',
    label: 'NORMAL',
    title: 'GREEN — NORMAL',
    description: 'No elevated hazard indicators detected in the selected data.',
    hex: '#10B981',
  },
  YELLOW: {
    code: 'YELLOW',
    label: 'ADVISORY',
    title: 'YELLOW — ADVISORY',
    description: 'Conditions may require monitoring.',
    hex: '#F59E0B',
  },
  ORANGE: {
    code: 'ORANGE',
    label: 'HIGH',
    title: 'ORANGE — HIGH',
    description: 'Significant hazard indicators suggest increased potential exposure.',
    hex: '#F97316',
  },
  RED: {
    code: 'RED',
    label: 'CRITICAL',
    title: 'RED — CRITICAL',
    description: 'Severe hazard indicators require urgent verification and attention from authorised emergency personnel.',
    hex: '#EF4444',
  },
};

export function assessCurrentHazards(facilities: Facility[]): Hazard[] {
  const now = new Date('2026-11-14T06:45:00Z');
  const expiryPlus6h = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();
  const expiryPlus12h = new Date(now.getTime() + 12 * 3600 * 1000).toISOString();

  const quarryFacilities = facilities
    .filter((f) => f.studyAreaId === 'kzn-durban-metro' && (f.riskLevel === 'ORANGE' || f.riskLevel === 'RED' || f.community.includes('Quarry')))
    .map((f) => f.id);

  const slopeFacilities = facilities
    .filter((f) => f.community.includes('Cato') || f.community.includes('Umlazi'))
    .map((f) => f.id);

  const tongaatFacilities = facilities
    .filter((f) => f.studyAreaId === 'north-coast-tongaat')
    .map((f) => f.id);

  const umgeniFacilities = facilities
    .filter((f) => f.studyAreaId === 'umgeni-corridor')
    .map((f) => f.id);

  return [
    {
      id: 'HAZ-KZN-2026-001',
      type: 'Flash Flood Exposure',
      severity: 'ORANGE',
      area: 'Quarry Road West & Lower Palmiet Confluence',
      studyAreaId: 'kzn-durban-metro',
      timestamp: now.toISOString(),
      expiryTime: expiryPlus6h,
      source: 'Simulated NISAR L-Band Backscatter + NASA GPM IMERG Demonstration Feed',
      supportingMeasurements: [
        'GPM IMERG simulated peak cell: 18.4 mm/hr (64.2 mm / 24h)',
        'NISAR L-band riparian sigma-nought drop: -3.8 dB vs dry baseline',
        'Copernicus GLO-30 DEM low-terrace elevation (< 14 m ASL)',
      ],
      confidence: 'Moderate-High (Prototype Rule-Based Screening; requires local gauge verification)',
      classification: 'Simulated',
      status: 'Active Simulation',
      affectedFacilities: quarryFacilities,
      recommendedPrecautions: [
        'Verify local river-gauge levels and municipal drainage channels on site.',
        'Alert community focal points in Quarry Road West to monitor rising culvert water.',
        'Confirm readiness of verified municipal evacuation halls (do not assume unverified buildings are shelters).',
      ],
      isSimulated: true,
    },
    {
      id: 'HAZ-KZN-2026-002',
      type: 'Slope Instability / Ground Movement',
      severity: 'YELLOW',
      area: 'Cato Manor Escarpment & Umlazi Hillside Terraces',
      studyAreaId: 'kzn-durban-metro',
      timestamp: now.toISOString(),
      expiryTime: expiryPlus12h,
      source: 'Simulated NISAR L-Band InSAR GUNW + SMAP Soil Moisture',
      supportingMeasurements: [
        'Cumulative LOS displacement: -11.4 mm over 5 months (-14.8 mm/yr)',
        'Interferometric coherence: 0.72 (reliable scatterer track)',
        'SMAP top-layer saturation proxy: 0.41 cm³/cm³',
      ],
      confidence: 'Moderate (InSAR screening indicates deformation trend, not structural failure confirmation)',
      classification: 'Modelled',
      status: 'Monitoring',
      affectedFacilities: slopeFacilities,
      recommendedPrecautions: [
        'Schedule municipal geotechnical visual inspection along retaining walls and road cuttings.',
        'Monitor stormwater runoff paths above hillside terraces during heavy rainfall.',
      ],
      isSimulated: true,
    },
    {
      id: 'HAZ-KZN-2026-003',
      type: 'Infrastructure Buffer Exposure',
      severity: 'YELLOW',
      area: 'Inanda Dam Spillway & Lower Umgeni Basin',
      studyAreaId: 'umgeni-corridor',
      timestamp: now.toISOString(),
      expiryTime: expiryPlus6h,
      source: 'Simulated NISAR L-Band Coherence + Hydrological Catchment Proxy',
      supportingMeasurements: [
        'Inanda Dam simulated reservoir extent +4.2% vs 90-day baseline',
        'Southern Aqueduct easement coherence dip: 0.78 → 0.64 (field check recommended)',
        'Radar data alone does not confirm pipeline leaks or structural damage.',
      ],
      confidence: 'Moderate (Screening indicator only; municipal telemetry takes precedence)',
      classification: 'Simulated',
      status: 'Monitoring',
      affectedFacilities: umgeniFacilities,
      recommendedPrecautions: [
        'Cross-check dam release schedules with Umgeni-uThukela Water authorities.',
        'Conduct routine ground patrol on flagged hillside pipeline easements.',
      ],
      isSimulated: true,
    },
    {
      id: 'HAZ-KZN-2026-004',
      type: 'Land Degradation Stress',
      severity: 'YELLOW',
      area: 'Tongaat & Umgeni Valley Croplands',
      studyAreaId: 'north-coast-tongaat',
      timestamp: now.toISOString(),
      expiryTime: expiryPlus12h,
      source: 'Simulated NISAR HV/VV Backscatter + Optical NDVI Composite',
      supportingMeasurements: [
        'Umgeni Valley smallholder NDVI dropped -0.14 (0.58 → 0.44)',
        'L-band HV backscatter drop: -2.4 dB consistent with canopy thinning & wet topsoil',
      ],
      confidence: 'Moderate (Multi-sensor environmental screening)',
      classification: 'Simulated',
      status: 'Monitoring',
      affectedFacilities: tongaatFacilities,
      recommendedPrecautions: [
        'Inspect contour drainage and silt traps in harvested sugarcane and smallholder plots.',
        'Avoid heavy field machinery on saturated slopes above 35% volumetric moisture.',
      ],
      isSimulated: true,
    },
  ];
}

export function getOverallRiskLevel(severities: RiskLevel[]): RiskLevel {
  if (severities.includes('RED')) return 'RED';
  if (severities.includes('ORANGE')) return 'ORANGE';
  if (severities.includes('YELLOW')) return 'YELLOW';
  return 'GREEN';
}
