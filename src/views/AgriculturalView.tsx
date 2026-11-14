import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AgriculturalZone, StudyArea } from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';
import { ScientificTooltip } from '../components/shared/ScientificTooltip';

interface AgriculturalViewProps {
  zones: AgriculturalZone[];
  studyArea: StudyArea;
}

export function AgriculturalView({ zones, studyArea }: AgriculturalViewProps) {
  const [selectedZone, setSelectedZone] = useState<AgriculturalZone>(zones[0]);

  const comparisonData = zones.map((z) => ({
    name: z.name.split(' ').slice(0, 2).join(' '),
    ndviScaled: Number((z.ndvi * 100).toFixed(1)),
    soilMoisture: z.soilMoisturePct,
    hvAbs: Math.abs(z.radarBackscatterHvDb),
  }));

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Agricultural Land Degradation & Moisture Screening"
        message="Combines simulated L-band dual-polarisation SAR backscatter (HV canopy volume & VV surface dielectric sensitivity), optical NDVI composites, and SMAP soil moisture proxies across KwaZulu-Natal croplands."
        isSimulated={true}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7">
          <SarWatchMap
            center={
              selectedZone?.coordinates[0]
                ? [selectedZone.coordinates[0][0] - 0.015, selectedZone.coordinates[0][1] + 0.025]
                : studyArea.center
            }
            zoom={11}
            heightClass="h-[460px]"
            agriculturalZones={zones}
            selectedId={selectedZone?.id ?? null}
            initialLayers={{
              agriculture: true,
              communities: true,
              facilities: false,
              floodZones: false,
              infrastructure: false,
              groundMovement: false,
              streetlights: false,
            }}
            onSelectAgZone={(z) => setSelectedZone(z)}
          />
        </div>

        <div className="xl:col-span-5 sar-card p-5 space-y-4">
          {selectedZone && (
            <>
              <div className="space-y-1">
                <div className="text-[11px] font-mono font-semibold text-[#1565F5]">
                  {selectedZone.id} · {selectedZone.district}
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {selectedZone.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <HazardStatus level={selectedZone.degradationStatus} compact={true} />
                  <span className="text-xs text-slate-500">
                    {selectedZone.cropType} · {selectedZone.areaHectares} ha
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500">NDVI Index</div>
                  <div className="text-lg font-mono font-bold text-emerald-600 tabular-nums">
                    {selectedZone.ndvi.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Δ {selectedZone.ndviDelta >= 0 ? '+' : ''}
                    {selectedZone.ndviDelta.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500">Soil Moisture</div>
                  <div className="text-lg font-mono font-bold text-[#1565F5] tabular-nums">
                    {selectedZone.soilMoisturePct}%
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>HV σ⁰</span>
                    <ScientificTooltip termKey="polarization" />
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                    {selectedZone.radarBackscatterHvDb} <span className="text-[11px]">dB</span>
                  </div>
                </div>
                <div className="bg-[#F8FAFF] border border-slate-100 rounded-2xl p-3">
                  <div className="text-[11px] text-slate-500">VV σ⁰</div>
                  <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                    {selectedZone.radarBackscatterVvDb} <span className="text-[11px]">dB</span>
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="text-slate-500 font-medium">Land Condition Assessment</div>
                <p className="text-slate-800 leading-relaxed">{selectedZone.degradationIndicator}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  6-Month NDVI, Soil Moisture &amp; HV Backscatter Trend
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedZone.history} margin={{ top: 5, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                      <YAxis yAxisId="left" domain={[0, 1]} stroke="#10B981" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#1565F5" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          borderRadius: '14px',
                          fontSize: '11px',
                        }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="ndvi" name="NDVI" stroke="#10B981" strokeWidth={2.5} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="soilMoisturePct"
                        name="Soil Moisture (%)"
                        stroke="#1565F5"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Regional Agricultural Comparison + Indicator Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Cross-Zone Vegetation &amp; Moisture Comparison
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '14px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="ndviScaled" name="NDVI (×100)" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="soilMoisture" name="Soil Moisture (%)" fill="#1565F5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Environmental Indicator Guide for Agricultural Resilience
          </h3>
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100">
              <div className="font-bold text-[#1565F5]">L-Band HV Cross-Polarised Backscatter (dB)</div>
              <p className="text-slate-600 mt-0.5">
                Sensitive to volumetric scattering within crop canopies. A sustained negative drop (&lt; -2 dB) paired with declining NDVI flags topsoil exposure, erosion rills, or crop washout even beneath cloud cover.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100">
              <div className="font-bold text-emerald-600">Optical NDVI &amp; Seasonal Delta</div>
              <p className="text-slate-600 mt-0.5">
                Normalized Difference Vegetation Index tracks photosynthetic canopy density (0.2 sparse soil to 0.8 dense crops). Useful during clear-sky windows to corroborate radar backscatter changes.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100">
              <div className="font-bold text-amber-600">Topsoil Moisture Saturation (%)</div>
              <p className="text-slate-600 mt-0.5">
                High soil moisture (&gt; 40%) increases surface runoff velocity on KwaZulu-Natal slopes, amplifying downstream siltation and gully erosion risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
