import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Satellite, Search } from 'lucide-react';
import { sarwatchApi, type DataAdapterInfo } from '../services/api';
import type { LiveCatalogCollection, SatelliteObservation } from '../types/sarwatch';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';
import { ScientificTooltip } from '../components/shared/ScientificTooltip';

const MISSIONS = [
  'ALL',
  'NISAR',
  'NASA GPM IMERG',
  'NASA VIIRS Black Marble',
  'Copernicus DEM',
  'ESA WorldCover',
  'SMAP',
];

export function SatelliteExplorerView() {
  const [missionFilter, setMissionFilter] = useState('ALL');
  const [observations, setObservations] = useState<SatelliteObservation[]>([]);
  const [adapters, setAdapters] = useState<DataAdapterInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [catalogKeyword, setCatalogKeyword] = useState('NISAR');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogResult, setCatalogResult] = useState<{
    liveReachable: boolean;
    queriedAt: string;
    keyword: string;
    collections: LiveCatalogCollection[];
    note: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    sarwatchApi
      .getSatelliteObservations(missionFilter, 'ALL')
      .then((res) => {
        if (!mounted) return;
        setObservations(res.observations);
        setAdapters(res.adapters);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [missionFilter]);

  const handleQueryCatalog = async (kw = catalogKeyword) => {
    setCatalogLoading(true);
    try {
      const res = await sarwatchApi.queryLiveNasaCatalog(kw);
      setCatalogResult(res);
    } finally {
      setCatalogLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Earth-Observation Provenance & Real vs. Simulated Data Policy"
        message="Orbit ZA never fabricates NASA API responses or product measurements. Regional KwaZulu-Natal observation records below are clearly labelled Demonstration Extracts, while the Modular Adapter Panel can query NASA's public Common Metadata Repository (CMR) live."
        isSimulated={true}
      />

      {/* Mission Filter Controls */}
      <div className="sar-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {MISSIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMissionFilter(m)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                missionFilter === m
                  ? 'sar-blue-gradient text-white'
                  : 'bg-[#F8FAFF] text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {m === 'ALL' ? 'All Datasets' : m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <ScientificTooltip termKey="polarization" label="Radar Polarisation" />
          <ScientificTooltip termKey="gpm" label="GPM IMERG" />
          <ScientificTooltip termKey="viirs" label="VIIRS DNB" />
        </div>
      </div>

      {/* Observation Metadata Catalog */}
      <div className="sar-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Satellite Observation Metadata Catalog ({observations.length} products)
          </h3>
          <span className="text-[11px] font-mono text-amber-600">Labelled Demonstration Products</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading observation catalog...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {observations.map((obs) => (
              <div key={obs.id} className="p-5 space-y-3 hover:bg-[#F8FAFF] transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#1565F5]">{obs.mission}</span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="font-bold text-slate-900">{obs.datasetName}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Product ID: {obs.productId} · Instrument: {obs.instrument}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        obs.isSimulated ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {obs.isSimulated ? 'Simulated Demonstration Data' : 'Real Observation'}
                    </span>
                    <a
                      href={obs.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1565F5] hover:underline"
                    >
                      <span>Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-[11px] pt-1">
                  <div>
                    <div className="text-slate-400">Provider</div>
                    <div className="font-medium text-slate-800">{obs.provider}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Acquisition Date</div>
                    <div className="font-mono text-slate-800">{obs.acquisitionDate.slice(0, 10)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Retrieval Date</div>
                    <div className="font-mono text-slate-800">{obs.retrievalDate.slice(0, 10)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Spatial Resolution</div>
                    <div className="font-mono text-slate-800">{obs.resolution}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Polarisation / Mode</div>
                    <div className="font-mono text-slate-800 truncate" title={obs.polarization}>
                      {obs.polarization}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Units &amp; Quality</div>
                    <div className="text-slate-800">
                      {obs.units} · <span className="font-semibold text-[#1565F5]">{obs.quality}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-[#F8FAFF] border border-slate-100 rounded-xl px-3.5 py-2">
                  <span className="text-slate-500">Summary Reading: </span>
                  <span className="font-mono font-semibold text-slate-900">{obs.summaryValue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modular Data Adapter Architecture + Live NASA CMR Catalog Check */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
              <Satellite className="w-4 h-4" />
            </div>
            <span>Modular Data-Adapter Architecture</span>
          </h3>
          <div className="space-y-2.5">
            {adapters.map((ad) => (
              <div key={ad.id} className="p-3.5 rounded-2xl bg-[#F8FAFF] border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{ad.name}</span>
                  <span className="font-mono text-[11px] font-semibold text-[#1565F5]">{ad.mode}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{ad.description}</p>
                <p className="text-[11px] text-slate-400">{ad.notes}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Live NASA CMR Public Collection Metadata Adapter
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Query NASA&apos;s official Common Metadata Repository (`cmr.earthdata.nasa.gov`) in real time to verify collection IDs for NISAR, GPM IMERG (`GPM_3IMERGHHE`), or VIIRS Black Marble (`VNP46A2`).
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogKeyword}
                onChange={(e) => setCatalogKeyword(e.target.value)}
                placeholder="Keyword: NISAR, GPM_3IMERGHHE, VNP46A2..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#1565F5]"
              />
            </div>
            <button
              type="button"
              onClick={() => handleQueryCatalog(catalogKeyword)}
              disabled={catalogLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl sar-blue-gradient text-white font-bold text-xs hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${catalogLoading ? 'animate-spin' : ''}`} />
              <span>{catalogLoading ? 'Querying...' : 'Query NASA CMR'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {['NISAR', 'GPM_3IMERGHHE', 'VNP46A2'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setCatalogKeyword(preset);
                  handleQueryCatalog(preset);
                }}
                className="px-3 py-1 rounded-xl border border-slate-200 bg-[#F8FAFF] text-slate-700 hover:border-[#1565F5] hover:text-[#1565F5] font-mono font-semibold cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {catalogResult && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-mono text-slate-600">{catalogResult.note}</div>
              {catalogResult.collections.length === 0 ? (
                <div className="text-xs text-slate-500">No collections returned for keyword.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {catalogResult.collections.map((c) => (
                    <div key={c.id} className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100 text-xs space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-[#1565F5]">{c.id}</span>
                        <span
                          className={`font-mono text-[10px] font-semibold ${
                            c.source === 'NASA CMR Live API' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {c.source}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Short Name: {c.shortName} · Data Center: {c.provider}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
