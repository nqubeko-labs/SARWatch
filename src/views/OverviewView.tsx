import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CloudRain,
  Droplets,
  Layers3,
  Lightbulb,
  MapPin,
  Satellite,
  Siren,
  Sprout,
} from 'lucide-react';
import type { OverviewResponse } from '../services/api';
import type { NavSectionId, RiskLevel, Scenario, TimeOffsetHours } from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus, RISK_CONFIG } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';
import { ScientificTooltip } from '../components/shared/ScientificTooltip';

interface OverviewViewProps {
  data: OverviewResponse;
  activeTwinScenario: Scenario;
  timeOffset: TimeOffsetHours;
  sosActive: boolean;
  autoFocusCenter: [number, number] | null;
  focusTriggerKey: string | number;
  onChangeTimeOffset: (offset: TimeOffsetHours) => void;
  onFocusAffectedArea: () => void;
  onNavigate: (section: NavSectionId) => void;
}

export function OverviewView({
  data,
  activeTwinScenario,
  timeOffset,
  sosActive,
  autoFocusCenter,
  focusTriggerKey,
  onChangeTimeOffset,
  onFocusAffectedArea,
  onNavigate,
}: OverviewViewProps) {
  const {
    selectedStudyArea,
    overallStatus,
    metrics,
    rainfallSummary,
    hazards,
    facilities,
    infrastructure,
    groundMovement,
    agriculturalZones,
    communityPolygons,
    streetlights,
    observations,
    activityFeed,
  } = data;

  const exposedFacilitiesList = useMemo(
    () => facilities.filter((f) => activeTwinScenario.exposedFacilityIds.includes(f.id)),
    [facilities, activeTwinScenario.exposedFacilityIds]
  );

  const affectedInfraList = useMemo(
    () => infrastructure.filter((i) => activeTwinScenario.affectedInfrastructureIds.includes(i.id)),
    [infrastructure, activeTwinScenario.affectedInfrastructureIds]
  );

  const exposedCategoryBreakdown = useMemo(() => {
    if (exposedFacilitiesList.length === 0) return 'No facilities intersecting simulated flood buffer';
    const counts = new Map<string, number>();
    exposedFacilitiesList.forEach((f) => counts.set(f.category, (counts.get(f.category) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([cat, n]) => `${n} ${cat}${n > 1 ? 's' : ''}`)
      .join(' · ');
  }, [exposedFacilitiesList]);

  const nominalPct = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((metrics.totalFacilities - exposedFacilitiesList.length) /
          Math.max(1, metrics.totalFacilities)) *
          100
      )
    )
  );
  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - nominalPct / 100);

  const hazardDistributionData = useMemo(() => {
    const counts: Record<RiskLevel, number> = { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0 };
    hazards.forEach((h) => {
      counts[h.severity] += 1;
    });
    return (['GREEN', 'YELLOW', 'ORANGE', 'RED'] as RiskLevel[]).map((level) => ({
      level,
      label: RISK_CONFIG[level].label,
      count: counts[level],
      fill: RISK_CONFIG[level].hex,
    }));
  }, [hazards]);

  const facilityExposureData = useMemo(() => {
    const byCat = new Map<string, { category: string; normal: number; exposed: number }>();
    facilities.forEach((f) => {
      const entry = byCat.get(f.category) ?? { category: f.category, normal: 0, exposed: 0 };
      const isScenarioExposed = activeTwinScenario.exposedFacilityIds.includes(f.id);
      if (f.riskLevel === 'GREEN' && !isScenarioExposed) entry.normal += 1;
      else entry.exposed += 1;
      byCat.set(f.category, entry);
    });
    return Array.from(byCat.values());
  }, [facilities, activeTwinScenario.exposedFacilityIds]);

  const rainfallPct = Math.min(
    100,
    Math.max(38, Math.round((activeTwinScenario.cumulativeRainfallMm / 180) * 100))
  );

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title={`Study Area: ${selectedStudyArea.name} (${selectedStudyArea.province})`}
        message="Command-centre indicators combine simulated SAR/GPM/VIIRS demonstration datasets and hypothetical community screening layers. Never treat simulated outputs as official government warnings."
        isSimulated={true}
      />

      {/* ACTIVE IMPACT SUMMARY CARD (Scannable in < 3 seconds) */}
      <section
        aria-label="Active Impact Summary"
        className={`rounded-[24px] p-5 border shadow-[0_14px_36px_-12px_rgba(30,64,175,0.12)] transition-colors ${
          sosActive
            ? 'bg-red-950 text-white border-red-700/80'
            : 'bg-white text-slate-900 border-slate-200/80'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-current/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                sosActive
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-[#E8F0FE] text-[#1565F5]'
              }`}
            >
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-bold">Active Impact Summary</h2>
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    sosActive
                      ? 'bg-red-600/80 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sosActive ? `SOS TRIGGERED · T+${timeOffset}h` : `T+${timeOffset}h · Monitoring`}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${sosActive ? 'text-red-100' : 'text-slate-500'}`}>
                {sosActive
                  ? `Automated impact screening detected ${exposedFacilitiesList.length} exposed facilities and ${affectedInfraList.length} water assets at risk.`
                  : 'Advance Digital Twin horizon to +3h or +6h to simulate critical community impact & SOS alerts.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                sosActive ? 'bg-red-900/60 border-red-700' : 'bg-[#F8FAFF] border-slate-200'
              }`}
            >
              {([0, 1, 3, 6] as TimeOffsetHours[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChangeTimeOffset(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    timeOffset === t
                      ? sosActive
                        ? 'bg-white text-red-950'
                        : 'bg-[#1565F5] text-white'
                      : sosActive
                      ? 'text-red-200 hover:bg-red-800/70'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {t === 0 ? 'Now' : `+${t}h`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onFocusAffectedArea}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sosActive
                  ? 'bg-white text-red-950 hover:bg-red-50'
                  : 'bg-[#E8F0FE] text-[#1565F5] hover:bg-blue-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Focus Map on Impact</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Metric 1: Facilities Exposed */}
          <div
            className={`rounded-2xl p-3.5 flex items-start gap-3 border ${
              sosActive
                ? 'bg-red-900/50 border-red-700/70'
                : 'bg-[#F8FAFF] border-slate-100'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                exposedFacilitiesList.length > 0
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-emerald-500/15 text-emerald-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tabular-nums">
                {exposedFacilitiesList.length} Facilities Exposed
              </div>
              <div className={`text-xs mt-0.5 ${sosActive ? 'text-red-100' : 'text-slate-500'}`}>
                {exposedCategoryBreakdown}
              </div>
            </div>
          </div>

          {/* Metric 2: Water Infrastructure */}
          <div
            className={`rounded-2xl p-3.5 flex items-start gap-3 border ${
              sosActive
                ? 'bg-red-900/50 border-red-700/70'
                : 'bg-[#F8FAFF] border-slate-100'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                affectedInfraList.length > 0
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-emerald-500/15 text-emerald-600'
              }`}
            >
              <Droplets className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tabular-nums">
                {affectedInfraList.length} Water Infrastructure Asset{affectedInfraList.length === 1 ? '' : 's'} at Risk
              </div>
              <div className={`text-xs mt-0.5 ${sosActive ? 'text-red-100' : 'text-slate-500'}`}>
                {affectedInfraList.length > 0
                  ? affectedInfraList.map((a) => a.name).slice(0, 2).join(' · ')
                  : 'No water assets in active flood envelope'}
              </div>
            </div>
          </div>

          {/* Metric 3: Streetlight Alert Network */}
          <div
            className={`rounded-2xl p-3.5 flex items-start gap-3 border ${
              sosActive
                ? 'bg-red-900/50 border-red-700/70'
                : 'bg-[#F8FAFF] border-slate-100'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTwinScenario.commandLogPreview.length > 0
                  ? 'bg-red-500/25 text-red-300'
                  : 'bg-emerald-500/15 text-emerald-600'
              }`}
            >
              <Siren className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tabular-nums">
                {activeTwinScenario.commandLogPreview.length} Smart Streetlight Alerts
              </div>
              <div className={`text-xs mt-0.5 ${sosActive ? 'text-red-100' : 'text-slate-500'}`}>
                Scenario severity: {activeTwinScenario.severity} · {activeTwinScenario.rainfallRateMmHr} mm/hr
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Royal-Blue Summary Card + 4 UI-Guide Metric Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-4 sar-blue-gradient rounded-[26px] p-6 text-white flex flex-col justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
                <circle
                  cx="38"
                  cy="38"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="7"
                />
                <circle
                  cx="38"
                  cy="38"
                  r={ringRadius}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <span className="absolute font-display text-base font-bold tabular-nums">
                {nominalPct}%
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="text-xs font-medium text-blue-100">Community Baseline Status</div>
              <div className="font-display text-xl font-bold leading-tight">
                {sosActive ? activeTwinScenario.severity : overallStatus} ·{' '}
                {RISK_CONFIG[sosActive ? activeTwinScenario.severity : overallStatus].label}
              </div>
              <div className="text-xs text-blue-100 tabular-nums">
                {Math.max(0, metrics.totalFacilities - exposedFacilitiesList.length)} of{' '}
                {metrics.totalFacilities} facilities outside buffer
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-blue-50">
            <span>{selectedStudyArea.populationEstimate}</span>
            <button
              type="button"
              onClick={() => onNavigate('digital-twin')}
              className="font-semibold text-white hover:underline cursor-pointer"
            >
              Simulate Risk →
            </button>
          </div>
        </div>

        {/* 4 Clean White Bento Cards */}
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('community-risk')}
            className="sar-card p-5 text-left flex flex-col justify-between hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-display text-sm font-bold text-slate-900">Facilities</span>
            </div>
            <div className="my-3">
              <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.totalFacilities}
              </div>
              <div className="text-xs text-amber-600 font-medium tabular-nums">
                {exposedFacilitiesList.length} exposed at T+{timeOffset}h
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-[#E9EEF7] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full sar-blue-gradient transition-all duration-300"
                style={{
                  width: `${Math.round(
                    (exposedFacilitiesList.length / Math.max(1, metrics.totalFacilities)) * 100
                  )}%`,
                }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('satellite-explorer')}
            className="sar-card p-5 text-left flex flex-col justify-between hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <CloudRain className="w-4 h-4" />
              </div>
              <span className="font-display text-sm font-bold text-slate-900">GPM Rain</span>
            </div>
            <div className="mx-auto w-[84px] h-[96px] rounded-[16px] bg-[#E9EEF7] overflow-hidden flex items-end">
              <div
                className="w-full sar-blue-gradient rounded-b-[16px] flex flex-col items-center justify-center text-white transition-all duration-300"
                style={{ height: `${rainfallPct}%` }}
              >
                <span className="font-display text-base font-bold tabular-nums leading-tight">
                  {activeTwinScenario.cumulativeRainfallMm}
                </span>
                <span className="text-[10px] text-blue-100">mm cumul.</span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ground-movement')}
            className="sar-card p-5 text-left flex flex-col justify-between hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <Satellite className="w-4 h-4" />
              </div>
              <span className="font-display text-sm font-bold text-slate-900">Peak Flux</span>
            </div>
            <svg viewBox="0 0 140 52" className="w-full h-12 my-1 overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="sarWaveGrad" x1="0" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#BAE6FD" />
                  <stop offset="30%" stopColor="#38BDF8" />
                  <stop offset="60%" stopColor="#1565F5" />
                  <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>
              </defs>
              <path
                d="M 4 30 C 16 30, 20 42, 30 42 C 42 42, 46 10, 58 10 C 70 10, 74 44, 86 44 C 98 44, 102 14, 114 14 C 124 14, 128 30, 136 30"
                fill="none"
                stroke="url(#sarWaveGrad)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {activeTwinScenario.rainfallRateMmHr}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                mm/hr · {activeTwinScenario.backscatterDropDb} dB
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('water-infrastructure')}
            className="sar-card p-5 text-left flex flex-col justify-between hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="font-display text-sm font-bold text-slate-900">Water &amp; Nodes</span>
            </div>
            <div className="my-2">
              <div className="font-display text-lg font-bold text-slate-900 tabular-nums">
                {metrics.waterInfrastructureCount} Assets
              </div>
              <div className="text-xs text-slate-400 tabular-nums">
                {metrics.agriculturalAreasCount} ag zones · {activeTwinScenario.commandLogPreview.length} light alerts
              </div>
            </div>
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {[100, 100, 80, 45, 20].map((fill, idx) => (
                <div
                  key={idx}
                  className="w-4 h-6 rounded-[5px] bg-[#E9EEF7] overflow-hidden flex items-end"
                >
                  <div className="w-full sar-blue-gradient" style={{ height: `${fill}%` }} />
                </div>
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Central Interactive Map + Hazard & Digital Twin Side Panel */}
      <div id="overview-map-anchor" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Operational Geospatial View — {selectedStudyArea.name}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedStudyArea.description} · {rainfallSummary.source}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('community-risk')}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-[#1565F5] hover:text-[#1565F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                Inspect Facilities
              </button>
              <button
                type="button"
                onClick={() => onNavigate('digital-twin')}
                className="px-3.5 py-2 rounded-xl sar-blue-gradient text-white font-semibold hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Digital Twin
              </button>
            </div>
          </div>

          <SarWatchMap
            center={selectedStudyArea.center}
            zoom={selectedStudyArea.zoom}
            heightClass="h-[490px]"
            facilities={facilities}
            exposedFacilityIds={activeTwinScenario.exposedFacilityIds}
            infrastructure={infrastructure}
            affectedInfrastructureIds={activeTwinScenario.affectedInfrastructureIds}
            groundMovement={groundMovement}
            agriculturalZones={agriculturalZones}
            communityPolygons={communityPolygons}
            floodZones={activeTwinScenario.floodZones}
            streetlights={streetlights}
            sosActive={sosActive}
            autoFocusCenter={sosActive ? autoFocusCenter : null}
            autoFocusZoom={13}
            focusTriggerKey={focusTriggerKey}
          />
        </div>

        {/* Right Side Column */}
        <div className="xl:col-span-4 space-y-5">
          <div className="sar-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Recent Hazard Indicators
              </h3>
              <ScientificTooltip termKey="backscatter" />
            </div>
            <div className="space-y-3 divide-y divide-slate-100">
              {hazards.map((h) => (
                <div key={h.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{h.type}</span>
                    <HazardStatus level={h.severity} compact={true} />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {h.area} · <span className="font-mono text-slate-600">{h.classification}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {h.supportingMeasurements[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] overflow-hidden shadow-[0_14px_36px_-12px_rgba(30,64,175,0.12)] border border-white">
            <div className="sar-blue-gradient px-5 pt-4 pb-8 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-blue-100">Digital Twin Active State</div>
                <div className="font-display text-sm font-bold">{activeTwinScenario.name}</div>
              </div>
              <span className="font-mono text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                {activeTwinScenario.severity}
              </span>
            </div>
            <div className="bg-white -mt-4 rounded-t-[22px] p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Hypothetical rainfall{' '}
                <span className="font-mono font-semibold text-[#1565F5]">
                  {activeTwinScenario.rainfallRateMmHr} mm/hr
                </span>{' '}
                with{' '}
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {activeTwinScenario.exposedFacilityIds.length}
                </span>{' '}
                facilities in modelled buffer.
              </p>
              <div className="text-[11px] text-amber-600 leading-relaxed">
                {activeTwinScenario.disclaimer}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('digital-twin')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8F0FE] text-[#1565F5] hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Layers3 className="w-3.5 h-3.5" />
                <span>Run Timeline Scenarios (+1h to +6h)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="sar-card p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-slate-900">Quick Module Access</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'water-infrastructure' as NavSectionId, label: 'Water Assets', icon: Droplets },
                { id: 'agricultural' as NavSectionId, label: 'Agriculture', icon: Sprout },
                { id: 'satellite-explorer' as NavSectionId, label: 'Satellite Data', icon: Satellite },
                { id: 'smart-streetlights' as NavSectionId, label: 'Streetlights', icon: Lightbulb },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => onNavigate(btn.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-[#F8FAFF] border border-slate-100 hover:border-blue-200 hover:bg-[#E8F0FE]/60 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts + Observation Timeline & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sar-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Hazard Severity Distribution (Simulated Screening)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">4 active hazard domains</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hazardDistributionData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '14px',
                    fontSize: '12px',
                    color: '#0F172A',
                  }}
                />
                <Bar dataKey="count" name="Hazard Count" radius={[8, 8, 0, 0]}>
                  {hazardDistributionData.map((entry) => (
                    <Cell key={entry.level} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sar-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Facility Exposure Breakdown by Category
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Normal vs. Elevated/High</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityExposureData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="category" stroke="#64748B" fontSize={10} interval={0} angle={-15} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '14px',
                    fontSize: '12px',
                    color: '#0F172A',
                  }}
                />
                <Bar dataKey="normal" stackId="a" name="Green (Normal)" fill="#1565F5" />
                <Bar dataKey="exposed" stackId="a" name="Advisory / High Exposure" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Satellite Observation Timeline & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sar-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Latest Satellite Observations
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('satellite-explorer')}
              className="text-xs font-semibold text-[#1565F5] hover:underline cursor-pointer"
            >
              View All Metadata →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {observations.slice(0, 5).map((obs) => (
              <div key={obs.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{obs.datasetName}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {obs.mission} · {obs.resolution} · {obs.summaryValue}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-amber-600 whitespace-nowrap shrink-0">
                  {obs.acquisitionDate.slice(0, 10)} · {obs.isSimulated ? 'Simulated' : 'Real'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sar-card p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Recent Operational Activity Feed
          </h3>
          <div className="divide-y divide-slate-100">
            {activityFeed.map((item) => (
              <div key={item.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold text-[#1565F5]">
                    {item.category} · {item.timestamp.replace('T', ' ').slice(0, 16)} UTC
                  </span>
                  <HazardStatus level={item.severity} compact={true} />
                </div>
                <p className="text-xs text-slate-600">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
