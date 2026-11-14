import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GroundMovementStation, InfrastructureAsset, StudyArea } from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';
import { ScientificTooltip } from '../components/shared/ScientificTooltip';

interface GroundMovementViewProps {
  stations: GroundMovementStation[];
  infrastructure: InfrastructureAsset[];
  studyArea: StudyArea;
}

export function GroundMovementView({
  stations,
  infrastructure,
  studyArea,
}: GroundMovementViewProps) {
  const [selected, setSelected] = useState<GroundMovementStation>(stations[0]);

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="NISAR Interferometric Ground Movement Screening"
        message="InSAR Line-of-Sight (LOS) displacement estimates track multi-pass surface motion across slopes, coastal bluffs, and dam abutments. Simulated demonstration time-series are shown; field geotechnical surveys remain essential to verify structural stability."
        tone="info"
        isSimulated={true}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7">
          <SarWatchMap
            center={selected ? [selected.latitude, selected.longitude] : studyArea.center}
            zoom={12}
            heightClass="h-[460px]"
            groundMovement={stations}
            infrastructure={infrastructure}
            selectedId={selected?.id ?? null}
            initialLayers={{
              groundMovement: true,
              infrastructure: true,
              communities: true,
              floodZones: false,
              facilities: false,
              agriculture: false,
              streetlights: false,
            }}
            onSelectStation={(st) => setSelected(st)}
          />
        </div>

        <div className="xl:col-span-5 sar-card p-5 space-y-4">
          {selected && (
            <>
              <div className="space-y-1">
                <div className="text-[11px] font-mono font-semibold text-[#1565F5]">
                  {selected.id} · {selected.corridor}
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {selected.name}
                </h3>
                <HazardStatus level={selected.riskLevel} compact={true} />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>LOS Velocity</span>
                    <ScientificTooltip termKey="insar" />
                  </div>
                  <div className="text-lg font-mono font-bold text-orange-600 tabular-nums mt-0.5">
                    {selected.velocityMmYr.toFixed(1)} <span className="text-xs">mm/yr</span>
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500">Cumulative</div>
                  <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                    {selected.cumulativeDisplacementMm.toFixed(1)} <span className="text-xs">mm</span>
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Coherence</span>
                    <ScientificTooltip termKey="coherence" />
                  </div>
                  <div className="text-lg font-mono font-bold text-[#1565F5] tabular-nums mt-0.5">
                    {selected.coherence.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-slate-500 font-medium">Radar Acquisition Mode</div>
                <div className="font-mono text-[11px] text-slate-800">{selected.sensorMode}</div>
                <div className="text-slate-500 font-medium pt-1">Nearby Community &amp; Infrastructure Assets</div>
                <div className="text-slate-800">{selected.nearbyAssets.join(' · ')}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Cumulative LOS Displacement (mm) vs. Monthly Rainfall (mm)
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={selected.timeSeries} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
                      <YAxis yAxisId="left" stroke="#EA580C" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#1565F5" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          borderRadius: '14px',
                          fontSize: '11px',
                        }}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="rainfallMm"
                        name="Monthly Rainfall (mm)"
                        fill="#93C5FD"
                        radius={[6, 6, 0, 0]}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="displacementMm"
                        name="Cumulative Displacement (mm)"
                        stroke="#EA580C"
                        strokeWidth={2.5}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Station Comparison Table */}
      <div className="sar-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900">
            InSAR Displacement Screening Stations
          </h3>
          <span className="text-[11px] font-mono text-amber-600">Simulated L-Band InSAR Time-Series</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Station ID</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">LOS Velocity</th>
                <th className="py-3 px-4 font-semibold">Cumulative</th>
                <th className="py-3 px-4 font-semibold">Coherence</th>
                <th className="py-3 px-4 font-semibold">Risk Category</th>
                <th className="py-3 px-4 font-semibold">Last Acquisition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stations.map((st) => (
                <tr
                  key={st.id}
                  onClick={() => setSelected(st)}
                  className={`cursor-pointer transition-colors ${
                    selected?.id === st.id ? 'bg-[#EEF4FF]' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-semibold text-[#1565F5]">{st.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{st.name}</td>
                  <td className="py-3 px-4 font-mono tabular-nums font-semibold text-orange-600">
                    {st.velocityMmYr.toFixed(1)} mm/yr
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {st.cumulativeDisplacementMm.toFixed(1)} mm
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {st.coherence.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <HazardStatus level={st.riskLevel} compact={true} />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {st.lastAcquisition.slice(0, 10)}
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
