import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Search } from 'lucide-react';
import type { InfrastructureAsset, InfrastructureType, StudyArea } from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';
import { ScientificTooltip } from '../components/shared/ScientificTooltip';

const INFRA_TYPES: InfrastructureType[] = [
  'Dam',
  'Reservoir',
  'River',
  'Water Treatment Facility',
  'Mapped Water Pipeline',
];

interface WaterInfrastructureViewProps {
  assets: InfrastructureAsset[];
  studyArea: StudyArea;
}

export function WaterInfrastructureView({ assets, studyArea }: WaterInfrastructureViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset>(assets[0]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return assets.filter((a) => {
      if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
      if (q && !`${a.id} ${a.name} ${a.community} ${a.type}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, search, typeFilter]);

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="NISAR Water Infrastructure Screening Disclaimer"
        message="NISAR backscatter, interferometric coherence, and displacement products provide surface-change screening only. Radar observations alone never confirm a pipeline leak, broken infrastructure, or structural failure—municipal engineering inspection is always required."
        tone="caution"
        isSimulated={true}
      />

      {/* Search & Asset Type Filter */}
      <div className="sar-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dam, river, treatment plant, or pipeline..."
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1565F5]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#F8FAFF] border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#1565F5]"
          aria-label="Filter by infrastructure asset type"
        >
          <option value="ALL">All Water Asset Types ({assets.length})</option>
          {INFRA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Map + Selected Asset SAR Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7">
          <SarWatchMap
            center={
              selectedAsset ? [selectedAsset.latitude, selectedAsset.longitude] : studyArea.center
            }
            zoom={12}
            heightClass="h-[460px]"
            infrastructure={filtered}
            selectedId={selectedAsset?.id ?? null}
            initialLayers={{
              infrastructure: true,
              communities: true,
              floodZones: true,
              facilities: false,
              groundMovement: false,
              agriculture: false,
              streetlights: false,
            }}
            onSelectInfrastructure={(inf) => setSelectedAsset(inf)}
          />
        </div>

        <div className="xl:col-span-5 sar-card p-5 space-y-4">
          {selectedAsset && (
            <>
              <div className="space-y-1">
                <div className="text-[11px] font-mono font-semibold text-[#1565F5]">
                  {selectedAsset.id} · {selectedAsset.type}
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {selectedAsset.name}
                </h3>
                <HazardStatus level={selectedAsset.status} compact={true} />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Coherence</span>
                    <ScientificTooltip termKey="coherence" />
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                    {selectedAsset.coherence.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>σ⁰ Delta</span>
                    <ScientificTooltip termKey="backscatter" />
                  </div>
                  <div className="text-lg font-mono font-bold text-[#1565F5] tabular-nums mt-0.5">
                    {selectedAsset.backscatterChangeDb > 0 ? '+' : ''}
                    {selectedAsset.backscatterChangeDb.toFixed(1)} <span className="text-xs">dB</span>
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>LOS Vel.</span>
                    <ScientificTooltip termKey="insar" />
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                    {selectedAsset.displacementMmYr.toFixed(1)} <span className="text-xs">mm/yr</span>
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="text-slate-500 font-medium">NISAR Product Reference</div>
                <div className="font-mono text-[11px] text-slate-800">{selectedAsset.nisarProduct}</div>
                <div className="text-slate-500 font-medium pt-1">Screening Observation</div>
                <p className="text-slate-700 leading-relaxed">{selectedAsset.exposureIndicator}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Historical Radar Backscatter &amp; Coherence Comparison
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedAsset.history} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                      <YAxis yAxisId="left" stroke="#1565F5" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 1]} stroke="#F59E0B" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          borderRadius: '14px',
                          fontSize: '11px',
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="backscatterVvDb"
                        name="VV Backscatter (dB)"
                        stroke="#1565F5"
                        strokeWidth={2.5}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="coherence"
                        name="Coherence (0-1)"
                        stroke="#F59E0B"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Asset List */}
      <div className="sar-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Monitored Water Infrastructure Assets ({filtered.length})
          </h3>
          <span className="text-[11px] font-mono text-amber-600">Simulated Demonstration Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Asset ID</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Coherence</th>
                <th className="py-3 px-4 font-semibold">σ⁰ Change</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Last Observed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAsset(a)}
                  className={`cursor-pointer transition-colors ${
                    selectedAsset?.id === a.id ? 'bg-[#EEF4FF]' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-semibold text-[#1565F5]">{a.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{a.name}</td>
                  <td className="py-3 px-4 text-slate-600">{a.type}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">{a.coherence.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#1565F5]">
                    {a.backscatterChangeDb > 0 ? '+' : ''}
                    {a.backscatterChangeDb.toFixed(1)} dB
                  </td>
                  <td className="py-3 px-4">
                    <HazardStatus level={a.status} compact={true} />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {a.lastObserved.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
