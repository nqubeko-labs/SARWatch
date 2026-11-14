import { useState } from 'react';
import { Lightbulb, Radio, Terminal } from 'lucide-react';
import { sarwatchApi } from '../services/api';
import type {
  RiskLevel,
  ScenarioPreset,
  Streetlight,
  StreetlightCommandLog,
  StudyArea,
} from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';

interface SmartStreetlightsViewProps {
  streetlights: Streetlight[];
  commandLogs: StreetlightCommandLog[];
  studyArea: StudyArea;
  onUpdated: () => Promise<void>;
}

export function SmartStreetlightsView({
  streetlights,
  commandLogs,
  studyArea,
  onUpdated,
}: SmartStreetlightsViewProps) {
  const [selectedNode, setSelectedNode] = useState<Streetlight | null>(streetlights[0] ?? null);
  const [targetCommunity, setTargetCommunity] = useState<string>('ALL');
  const [busy, setBusy] = useState(false);

  const communities = Array.from(new Set(streetlights.map((s) => s.community)));

  const triggerPreset = async (preset: ScenarioPreset) => {
    setBusy(true);
    try {
      await sarwatchApi.simulateStreetlights({ preset, targetCommunity });
      await onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const triggerManualRisk = async (manualRisk: RiskLevel) => {
    setBusy(true);
    try {
      await sarwatchApi.simulateStreetlights({ manualRisk, targetCommunity });
      await onUpdated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Simulated Smart Streetlight & Nighttime Radiance Clarification"
        message="NASA VIIRS Black Marble nighttime-light observations are NOT direct measurements of individual streetlight functionality. Actual public streetlight warning control requires authorised municipal IoT infrastructure. All node states and command logs below are simulated for the hackathon prototype."
        tone="caution"
        isSimulated={true}
      />

      {/* Interactive Simulation Controls */}
      <div className="sar-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <span>Interactive Hazard-Linked Streetlight Simulation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select a target community corridor and trigger a simulated hazard scenario or direct warning beacon test.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={targetCommunity}
              onChange={(e) => setTargetCommunity(e.target.value)}
              className="bg-[#F8FAFF] border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-[#1565F5]"
              aria-label="Target streetlight community"
            >
              <option value="ALL">All Communities ({streetlights.length} nodes)</option>
              {communities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-1">Simulate Scenario:</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => triggerPreset('normal')}
            className="px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
          >
            Normal Baseline (GREEN)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => triggerPreset('elevated')}
            className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
          >
            Elevated Rainfall (YELLOW/ORANGE)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => triggerPreset('severe')}
            className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 cursor-pointer"
          >
            Severe Hazard (ORANGE/RED)
          </button>
          <span className="text-slate-300 mx-1" aria-hidden="true">|</span>
          <span className="text-xs font-medium text-slate-500 mr-1">Override Test:</span>
          {(['GREEN', 'YELLOW', 'ORANGE', 'RED'] as RiskLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              disabled={busy}
              onClick={() => triggerManualRisk(level)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-[#F8FAFF] text-xs font-mono font-semibold text-slate-700 hover:border-[#1565F5] hover:text-[#1565F5] disabled:opacity-50 cursor-pointer"
            >
              Set {level}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Simulated Command Log */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7">
          <SarWatchMap
            center={
              selectedNode ? [selectedNode.latitude, selectedNode.longitude] : studyArea.center
            }
            zoom={12}
            heightClass="h-[460px]"
            streetlights={streetlights}
            selectedId={selectedNode?.id ?? null}
            initialLayers={{
              streetlights: true,
              communities: true,
              floodZones: true,
              facilities: false,
              infrastructure: false,
              groundMovement: false,
              agriculture: false,
            }}
            onSelectStreetlight={(sl) => setSelectedNode(sl)}
          />
        </div>

        <div className="xl:col-span-5 sar-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#E8F0FE] text-[#1565F5] flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <span>Simulated Controller Command Log</span>
            </h3>
            <span className="text-[11px] font-mono text-amber-600">Simulation Only</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Displays which tagged public lighting nodes would receive warning pattern instructions under authorised municipal controller integration.
          </p>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {commandLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#1565F5]">{log.streetlightId}</span>
                  <HazardStatus level={log.targetRiskLevel} compact={true} />
                </div>
                <div className="font-mono text-[11px] text-slate-800">{log.command}</div>
                <div className="text-[11px] text-slate-500">
                  {log.community} · {log.reason}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {log.timestamp.replace('T', ' ').slice(0, 19)} UTC · Simulated
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Streetlight Inventory Table */}
      <div className="sar-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Tagged Public Streetlight Infrastructure ({streetlights.length} nodes)</span>
          </h3>
          <span className="text-[11px] font-mono text-amber-600">Simulated Municipal Telemetry</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFF] text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Streetlight ID</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Community</th>
                <th className="py-3 px-4 font-semibold">Simulated Operating Status</th>
                <th className="py-3 px-4 font-semibold">Warning Category</th>
                <th className="py-3 px-4 font-semibold">Controller Connection</th>
                <th className="py-3 px-4 font-semibold">Last Communication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {streetlights.map((sl) => (
                <tr
                  key={sl.id}
                  onClick={() => setSelectedNode(sl)}
                  className={`cursor-pointer transition-colors ${
                    selectedNode?.id === sl.id ? 'bg-[#EEF4FF]' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-semibold text-[#1565F5]">{sl.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {sl.name}
                    <div className="text-[11px] font-mono font-normal text-slate-400">
                      {sl.latitude.toFixed(4)}, {sl.longitude.toFixed(4)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{sl.community}</td>
                  <td className="py-3 px-4 text-slate-800">{sl.simulatedStatus}</td>
                  <td className="py-3 px-4">
                    <HazardStatus level={sl.riskLevel} compact={true} />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{sl.controllerStatus}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {sl.lastCommunication.replace('T', ' ').slice(0, 16)} UTC
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
