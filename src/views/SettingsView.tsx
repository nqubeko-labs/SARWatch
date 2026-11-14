import type { StudyArea } from '../types/sarwatch';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';

interface SettingsViewProps {
  studyAreas: StudyArea[];
  selectedAreaId: string;
  onChangeArea: (id: string) => void;
}

export function SettingsView({ studyAreas, selectedAreaId, onChangeArea }: SettingsViewProps) {
  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Orbit ZA Platform Settings & Scientific Governance"
        message="Developed for the NASA Space Apps Challenge 2026 (Dancing with the SARs). Configured with Durban & KwaZulu-Natal demonstration baselines and modular data adapters."
        isSimulated={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Baseline Settings */}
        <div className="sar-card p-6 space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Default Study Corridor
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Switch the active geographical study corridor used across the Overview Dashboard, Community Risk Registry, and Digital Twin maps.
          </p>
          <div className="space-y-2.5">
            {studyAreas.map((area) => (
              <label
                key={area.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                  selectedAreaId === area.id
                    ? 'border-[#1565F5] bg-[#E8F0FE]/60'
                    : 'border-slate-100 bg-[#F8FAFF] hover:border-blue-200'
                }`}
              >
                <input
                  type="radio"
                  name="study-area"
                  checked={selectedAreaId === area.id}
                  onChange={() => onChangeArea(area.id)}
                  className="mt-1 accent-[#1565F5]"
                />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">{area.name}</div>
                  <div className="text-slate-600">{area.description}</div>
                  <div className="font-mono text-[11px] font-semibold text-[#1565F5]">
                    Center: {area.center[0].toFixed(3)}, {area.center[1].toFixed(3)} · {area.populationEstimate}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Colour-Coded Hazard Engine Definitions */}
        <div className="sar-card p-6 space-y-4">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Colour-Coded Hazard Engine Governance
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every hazard assessment includes explicit severity definitions, data provenance, confidence statements, and expiry timestamps. Orbit ZA never manufactures official emergency warnings.
          </p>
          <div className="space-y-3">
            {(['GREEN', 'YELLOW', 'ORANGE', 'RED'] as const).map((level) => (
              <div key={level} className="p-3.5 rounded-2xl bg-[#F8FAFF] border border-slate-100">
                <HazardStatus level={level} showDescription={true} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture & Challenge Reference */}
      <div className="sar-card p-6 space-y-3 text-xs text-slate-600">
        <h3 className="font-display text-sm font-bold text-slate-900">
          Architecture &amp; Ethical Remote-Sensing Principles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-slate-100 space-y-1">
            <div className="font-bold text-[#1565F5]">Community Privacy</div>
            <p className="text-slate-600 leading-relaxed">
              Only public and community-level facilities are mapped. No household-level personal records or sensitive resident identities are stored or exposed.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-slate-100 space-y-1">
            <div className="font-bold text-[#1565F5]">Shelter Verification</div>
            <p className="text-slate-600 leading-relaxed">
              Churches, schools, and community halls are never assumed to be safe evacuation centres unless explicitly verified in municipal registries.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F8FAFF] border border-slate-100 space-y-1">
            <div className="font-bold text-[#1565F5]">Scientific Honesty</div>
            <p className="text-slate-600 leading-relaxed">
              Radar backscatter and InSAR coherence screen for surface moisture and motion; they do not confirm pipeline leaks, structural failure, or individual streetlight health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
