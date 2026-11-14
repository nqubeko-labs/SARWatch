import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Droplets,
  Info,
  Lightbulb,
  Waves,
} from 'lucide-react';
import type {
  AgriculturalZone,
  CommunityPolygon,
  Facility,
  InfrastructureAsset,
  Scenario,
  ScenarioPreset,
  Streetlight,
  StudyArea,
  TimeOffsetHours,
} from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';

const TIME_OFFSETS: TimeOffsetHours[] = [0, 1, 2, 3, 6];
const PRESET_ORDER: ScenarioPreset[] = ['normal', 'elevated', 'severe'];
const PRESET_LABELS: Record<ScenarioPreset, string> = {
  normal: 'Normal Conditions',
  elevated: 'Elevated Hazard',
  severe: 'Severe Hazard',
};

interface DigitalTwinViewProps {
  scenarioPreset: ScenarioPreset;
  timeOffset: TimeOffsetHours;
  onChangeScenario: (preset: ScenarioPreset) => void;
  onChangeOffset: (offset: TimeOffsetHours) => void;
  scenario: Scenario;
  studyArea: StudyArea;
  facilities: Facility[];
  infrastructure: InfrastructureAsset[];
  agriculturalZones: AgriculturalZone[];
  communityPolygons: CommunityPolygon[];
  streetlights: Streetlight[];
  loading: boolean;
  sosActive?: boolean;
  autoFocusCenter?: [number, number] | null;
  focusTriggerKey?: string | number;
}

export function DigitalTwinView({
  scenarioPreset,
  timeOffset,
  onChangeScenario,
  onChangeOffset,
  scenario,
  studyArea,
  facilities,
  infrastructure,
  agriculturalZones,
  communityPolygons,
  streetlights,
  loading,
  sosActive = false,
  autoFocusCenter = null,
  focusTriggerKey,
}: DigitalTwinViewProps) {
  const projectedStreetlights = streetlights.map((sl) => {
    const upd = scenario.streetlightUpdates.find((u) => u.id === sl.id);
    if (!upd) return sl;
    return {
      ...sl,
      riskLevel: upd.riskLevel,
      simulatedStatus: upd.simulatedStatus,
    };
  });

  const exposedFacilities = facilities.filter((f) => scenario.exposedFacilityIds.includes(f.id));
  const affectedInfra = infrastructure.filter((i) => scenario.affectedInfrastructureIds.includes(i.id));

  const presetIndex = PRESET_ORDER.indexOf(scenarioPreset);
  const stepScenario = (dir: -1 | 1) => {
    const nextIdx = Math.max(0, Math.min(PRESET_ORDER.length - 1, presetIndex + dir));
    onChangeScenario(PRESET_ORDER[nextIdx]);
  };

  // Circular gauge math matching the Sleep Quality ring in the UI guide
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - scenario.soilSaturationPct / 100);

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Hypothetical Environmental Digital Twin (Rule-Based Prototype)"
        message={scenario.disclaimer + ' Architecture is structured for future integration with validated HEC-RAS / LISFLOOD-FP hydrodynamic models.'}
        tone="caution"
        isSimulated={true}
      />

      {/* Digital Twin Split: Left Map + Right UI-Guide Curved Blue Header & White Sheet Console */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-4">
          <div id="digital-twin-map-anchor" className="relative">
            {loading && (
              <div className="absolute top-5 left-5 z-[450] px-3 py-1.5 rounded-xl bg-white border border-blue-200 shadow-md text-xs font-mono font-semibold text-[#1565F5]">
                Updating Digital Twin state...
              </div>
            )}
            <SarWatchMap
              center={studyArea.center}
              zoom={studyArea.zoom}
              heightClass="h-[540px]"
              facilities={facilities}
              exposedFacilityIds={scenario.exposedFacilityIds}
              infrastructure={infrastructure}
              affectedInfrastructureIds={scenario.affectedInfrastructureIds}
              agriculturalZones={agriculturalZones}
              communityPolygons={communityPolygons}
              floodZones={scenario.floodZones}
              streetlights={projectedStreetlights}
              sosActive={sosActive}
              autoFocusCenter={sosActive ? autoFocusCenter : null}
              autoFocusZoom={13}
              focusTriggerKey={focusTriggerKey}
            />
          </div>

          {/* Scenario Assumptions Card */}
          <div className="sar-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Transparent Rule-Based Scenario Assumptions ({scenario.name})
              </h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600">
              {scenario.assumptions.map((assumption, idx) => (
                <li key={idx} className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100 flex items-start gap-2">
                  <CloudRain className="w-3.5 h-3.5 text-[#1565F5] mt-0.5 shrink-0" />
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Console Styled Directly Like the Right Screen in the UI Guide */}
        <div className="xl:col-span-5 space-y-5">
          <div className="rounded-[28px] overflow-hidden shadow-[0_22px_50px_-14px_rgba(30,64,175,0.18)] border border-white bg-white">
            {/* Curved Royal Blue Gradient Top Control Area */}
            <div className="sar-blue-gradient px-6 pt-5 pb-12 text-white space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-bold">Digital Twin Control</span>
                <div className="flex items-center gap-1.5">
                  {sosActive && (
                    <span className="font-mono text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-lg animate-pulse">
                      SOS ACTIVE
                    </span>
                  )}
                  <span className="font-mono text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-lg">
                    {scenario.severity}
                  </span>
                </div>
              </div>

              {/* Underlined Timeframe Tabs (matching Day | Week | Month | Year) */}
              <div className="flex items-center justify-between px-1">
                {TIME_OFFSETS.map((t) => {
                  const active = timeOffset === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChangeOffset(t)}
                      className={`pb-1.5 px-2 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
                        active
                          ? 'text-white border-white'
                          : 'text-blue-200/80 border-transparent hover:text-white'
                      }`}
                    >
                      {t === 0 ? 'Current' : `+${t}h`}
                    </button>
                  );
                })}
              </div>

              {/* Scenario Preset Stepper (matching < Today, July 16 >) */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  type="button"
                  onClick={() => stepScenario(-1)}
                  disabled={presetIndex === 0}
                  aria-label="Previous scenario severity"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-blue-100 hover:bg-white/15 disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {PRESET_ORDER.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onChangeScenario(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        scenarioPreset === preset
                          ? 'bg-white text-[#1565F5]'
                          : 'text-blue-100 hover:bg-white/15'
                      }`}
                    >
                      {PRESET_LABELS[preset].split(' ')[0]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => stepScenario(1)}
                  disabled={presetIndex === PRESET_ORDER.length - 1}
                  aria-label="Next scenario severity"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-blue-100 hover:bg-white/15 disabled:opacity-35 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overlapping Curved White Sheet */}
            <div className="bg-[#F8FAFF] -mt-7 rounded-t-[28px] px-6 pt-6 pb-6 space-y-5">
              {/* Circular SVG Soil Saturation Gauge (matching 75% Quality ring) */}
              <div className="flex flex-col items-center">
                <div className="relative w-[154px] h-[154px] flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <defs>
                      <linearGradient id="twinRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#93C5FD" />
                        <stop offset="55%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#0D56E8" />
                      </linearGradient>
                    </defs>
                    <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5ECF8" strokeWidth="13" />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke="url(#twinRingGrad)"
                      strokeWidth="13"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-slate-900 tabular-nums leading-none">
                      {scenario.soilSaturationPct}%
                    </span>
                    <span className="text-xs text-slate-400 font-medium mt-1">Saturation</span>
                  </div>
                </div>
              </div>

              {/* Floating Summary Pill Card (matching Total sleep | Goal) */}
              <div className="bg-white rounded-[20px] px-5 py-3.5 shadow-[0_10px_28px_-10px_rgba(30,64,175,0.1)] border border-slate-100 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-[11px] font-semibold text-[#2563EB]">Rainfall Rate</div>
                  <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
                    {scenario.rainfallRateMmHr} mm/hr
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#2563EB]">Cumulative</div>
                  <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
                    {scenario.cumulativeRainfallMm} mm
                  </div>
                </div>
              </div>

              {/* 2x2 Ice-Blue Icon Metric Tiles (matching Went to bed / Fell asleep / Woke up / Snoring) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[13px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center shrink-0">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">SAR σ⁰ Shift</div>
                    <div className="font-display text-sm font-bold text-slate-900 tabular-nums">
                      {scenario.backscatterDropDb} dB
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[13px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Exposed Sites</div>
                    <div className="font-display text-sm font-bold text-slate-900 tabular-nums">
                      {exposedFacilities.length} / {facilities.length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[13px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Water Assets</div>
                    <div className="font-display text-sm font-bold text-slate-900 tabular-nums">
                      {affectedInfra.length} flagged
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[13px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Light Alerts</div>
                    <div className="font-display text-sm font-bold text-slate-900 tabular-nums">
                      {scenario.commandLogPreview.length} nodes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Potentially Exposed Facilities & Simulated Streetlights */}
          <div className="sar-card p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>Potentially Exposed Facilities ({exposedFacilities.length})</span>
            </h3>
            {exposedFacilities.length === 0 ? (
              <p className="text-xs text-slate-500">
                No tagged facilities intersect simulated flood-exposure buffers at this step.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {exposedFacilities.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100 flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {f.category} · {f.community} · {f.verifiedStatus}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-red-600 shrink-0">Exposed</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-900">
                Projected Streetlight Warnings ({scenario.commandLogPreview.length})
              </div>
              {scenario.commandLogPreview.length === 0 ? (
                <p className="text-xs text-slate-500">All streetlight corridors in Green normal mode.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {scenario.commandLogPreview.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-2.5 rounded-xl bg-[#F8FAFF] border border-slate-100 text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-[#1565F5] truncate">{cmd.streetlightId}</div>
                        <div className="text-slate-500 truncate">{cmd.community}</div>
                      </div>
                      <HazardStatus level={cmd.targetRiskLevel} compact={true} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
