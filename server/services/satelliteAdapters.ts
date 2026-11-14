import type { LiveCatalogCollection, SatelliteObservation } from '../../src/types/sarwatch.ts';

export interface DataAdapterDescriptor {
  id: string;
  name: string;
  mission: string;
  mode: 'Simulated Prototype Feed' | 'Public Metadata Query Available';
  endpoint: string;
  description: string;
  notes: string;
}

export const SATELLITE_ADAPTERS: DataAdapterDescriptor[] = [
  {
    id: 'adapter-nisar',
    name: 'NISAR L-Band & S-Band SAR Adapter',
    mission: 'NASA-ISRO SAR (NISAR)',
    mode: 'Public Metadata Query Available',
    endpoint: 'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=NISAR',
    description: 'Supports GCOV backscatter, GSLC complex imagery, and GUNW unwrapped interferograms.',
    notes: 'Live granule pixels require NASA Earthdata authentication & ASF DAAC staging; prototype renders labelled simulated KZN extracts.',
  },
  {
    id: 'adapter-gpm-imerg',
    name: 'NASA GPM IMERG Precipitation Adapter',
    mission: 'GPM IMERG Early/Late Run',
    mode: 'Public Metadata Query Available',
    endpoint: 'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=GPM_3IMERGHHE',
    description: 'Half-hourly 0.1-degree global precipitation rate and accumulation estimates.',
    notes: 'Catalog metadata is queried live from NASA CMR; regional rainfall time-series uses labelled demonstration data.',
  },
  {
    id: 'adapter-viirs-black-marble',
    name: 'NASA VIIRS Black Marble Nighttime Lights Adapter',
    mission: 'VIIRS VNP46A2',
    mode: 'Public Metadata Query Available',
    endpoint: 'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=VNP46A2',
    description: 'Daily moonlight-adjusted nighttime radiance (500 m resolution).',
    notes: 'Nighttime radiance provides regional outage context and is NOT a direct measurement of individual streetlight health.',
  },
  {
    id: 'adapter-terrain-hydro',
    name: 'Copernicus DEM & HydroSHEDS Adapter',
    mission: 'Copernicus GLO-30 / HydroRIVERS / WorldCover / WorldPop / SMAP',
    mode: 'Simulated Prototype Feed',
    endpoint: 'Local Geospatial Reference Layer',
    description: 'Static elevation, land cover, drainage networks, soil moisture, and population exposure baselines.',
    notes: 'Pre-packaged KwaZulu-Natal demonstration extracts for deterministic offline reliability.',
  },
];

const FALLBACK_CATALOG: LiveCatalogCollection[] = [
  {
    id: 'C2858891863-ASF',
    title: 'NISAR Simulated/Science Data Product Catalog Entry (Fallback)',
    shortName: 'NISAR_L2_GCOV',
    provider: 'ASF',
    timeStart: '2025-01-01T00:00:00Z',
    source: 'Fallback Catalog Metadata',
  },
  {
    id: 'C2723754864-GES_DISC',
    title: 'GPM IMERG Final/Early Precipitation L3 Half Hourly 0.1 deg V07 (Fallback)',
    shortName: 'GPM_3IMERGHHE',
    provider: 'GES_DISC',
    timeStart: '2000-06-01T00:00:00Z',
    source: 'Fallback Catalog Metadata',
  },
  {
    id: 'C2104832445-LAADS',
    title: 'VIIRS/NPP Gap-Filled Lunar BRDF-Adjusted Nighttime Lights Daily L3 Global 500m (Fallback)',
    shortName: 'VNP46A2',
    provider: 'LAADS',
    timeStart: '2012-01-19T00:00:00Z',
    source: 'Fallback Catalog Metadata',
  },
];

export async function queryLiveNasaCmrCatalog(keyword: string): Promise<{
  liveReachable: boolean;
  queriedAt: string;
  keyword: string;
  collections: LiveCatalogCollection[];
  note: string;
}> {
  const safeKeyword = keyword.trim() || 'NISAR';
  const queriedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=${encodeURIComponent(
      safeKeyword
    )}&page_size=5`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`NASA CMR returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      feed?: {
        entry?: Array<{
          id?: string;
          title?: string;
          short_name?: string;
          data_center?: string;
          time_start?: string;
        }>;
      };
    };

    const entries = data.feed?.entry ?? [];
    if (entries.length === 0) {
      return {
        liveReachable: true,
        queriedAt,
        keyword: safeKeyword,
        collections: [],
        note: 'Live NASA CMR API responded with 0 matching collections for this keyword.',
      };
    }

    return {
      liveReachable: true,
      queriedAt,
      keyword: safeKeyword,
      collections: entries.map((e) => ({
        id: e.id ?? 'UNKNOWN-ID',
        title: e.title ?? 'Untitled Collection',
        shortName: e.short_name ?? 'N/A',
        provider: e.data_center ?? 'NASA Earthdata',
        timeStart: e.time_start,
        source: 'NASA CMR Live API',
      })),
      note: 'Live collection metadata retrieved directly from NASA Common Metadata Repository (CMR). Observation values in map layers remain clearly labelled demonstration extracts.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      liveReachable: false,
      queriedAt,
      keyword: safeKeyword,
      collections: FALLBACK_CATALOG.filter((c) =>
        `${c.title} ${c.shortName}`.toLowerCase().includes(safeKeyword.toLowerCase())
      ),
      note: `Live NASA CMR endpoint unavailable (${message}); displaying labelled fallback catalog metadata.`,
    };
  }
}

export function filterObservations(
  observations: SatelliteObservation[],
  mission?: string,
  studyAreaId?: string
): SatelliteObservation[] {
  return observations.filter((obs) => {
    const missionMatch = !mission || mission === 'ALL' || obs.mission === mission;
    const areaMatch = !studyAreaId || studyAreaId === 'ALL' || obs.studyAreaId === studyAreaId;
    return missionMatch && areaMatch;
  });
}
