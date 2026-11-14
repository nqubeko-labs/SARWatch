import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import type { NavSectionId, ScenarioPreset, TimeOffsetHours } from '../../types/sarwatch';

export interface DemoStepConfig {
  step: number;
  title: string;
  description: string;
  section: NavSectionId;
  areaId: string;
  scenario: ScenarioPreset;
  offset: TimeOffsetHours;
  highlightNote: string;
}

export const DEMO_STEPS: DemoStepConfig[] = [
  {
    step: 1,
    title: 'Initial Normal Environmental State',
    description:
      'Durban & KwaZulu-Natal study baseline starts in GREEN (Normal) conditions with nominal GPM rainfall (4.2 mm/hr) and baseline InSAR coherence.',
    section: 'digital-twin',
    areaId: 'kzn-durban-metro',
    scenario: 'normal',
    offset: 0,
    highlightNote: 'All community facilities and streetlight corridors begin in Green normal operational mode.',
  },
  {
    step: 2,
    title: 'Simulated GPM IMERG Rainfall Increase',
    description:
      'Demonstration convective rainfall indicator escalates to 18.4 mm/hr (58.0 mm cumulative) over the lower Umgeni and Palmiet catchments.',
    section: 'digital-twin',
    areaId: 'kzn-durban-metro',
    scenario: 'elevated',
    offset: 0,
    highlightNote: 'GPM IMERG proxy triggers Yellow Advisory screening across lowland terraces.',
  },
  {
    step: 3,
    title: 'Community Highlight: Quarry Road West & Palmiet Confluence',
    description:
      'Focus narrows onto Quarry Road West informal settlement and adjacent Clare Estate / Springfield facilities where Copernicus 30m DEM shows low-terrace exposure.',
    section: 'community-risk',
    areaId: 'kzn-durban-metro',
    scenario: 'elevated',
    offset: 1,
    highlightNote: 'Churches and schools remain marked Unverified for Evacuation unless officially certified.',
  },
  {
    step: 4,
    title: 'Simulated Flood-Exposure Zone Activated (+1h)',
    description:
      'NISAR L-band backscatter drop (-3.3 dB simulated) and rising runoff expand the hypothetical flood-exposure polygons along Palmiet & Umgeni.',
    section: 'digital-twin',
    areaId: 'kzn-durban-metro',
    scenario: 'elevated',
    offset: 1,
    highlightNote: 'Polygons depict hypothetical exposure envelopes, not validated hydrodynamic forecasts.',
  },
  {
    step: 5,
    title: 'Potentially Exposed Facilities Flagged (+2h)',
    description:
      'As simulated storm intensity shifts to Severe (+2h), clinics, schools, and settlements intersecting the envelope are highlighted on the map.',
    section: 'digital-twin',
    areaId: 'kzn-durban-metro',
    scenario: 'severe',
    offset: 2,
    highlightNote: 'Verified shelters (Springfield Civic Hall, Cato Crest Hall) are distinguished from unverified sites.',
  },
  {
    step: 6,
    title: 'Smart Streetlight Warning Colours Updated',
    description:
      'Simulated municipal IoT streetlight nodes transition from GREEN → YELLOW → ORANGE → RED and log hypothetical alert commands.',
    section: 'smart-streetlights',
    areaId: 'kzn-durban-metro',
    scenario: 'severe',
    offset: 2,
    highlightNote: 'VIIRS nighttime lights do not control streetlights; municipal IoT controllers are simulated.',
  },
  {
    step: 7,
    title: 'Digital Twin +3h & +6h Progression',
    description:
      'Advancing the timeline slider to +3h and +6h illustrates cumulative saturation (96%), deeper simulated ponding (2.19 m), and widened risk perimeter.',
    section: 'digital-twin',
    areaId: 'kzn-durban-metro',
    scenario: 'severe',
    offset: 6,
    highlightNote: 'Demonstrates how temporal progression informs preparedness before peak runoff.',
  },
  {
    step: 8,
    title: 'Water Infrastructure & Slope Screening Exposure',
    description:
      'Inspects Inanda Dam, Lower Umgeni channel, and Southern Aqueduct corridor indicators alongside InSAR slope movement stations.',
    section: 'water-infrastructure',
    areaId: 'kzn-durban-metro',
    scenario: 'severe',
    offset: 6,
    highlightNote: 'Radar data alone never confirms pipeline leaks or structural failure; field checks are required.',
  },
  {
    step: 9,
    title: 'Transparent Rule-Based Scenario Assumptions',
    description:
      'Full provenance and rule-based assumptions are exposed for judges, planners, and community leaders—ready for real NASA NISAR & hydrologic model hooks.',
    section: 'digital-twin',
    areaId: 'kzn-durban-metro',
    scenario: 'severe',
    offset: 3,
    highlightNote: 'Demonstration complete. You can freely scrub the Digital Twin timeline or explore any module.',
  },
];

interface DemoModeBarProps {
  currentIndex: number;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  onChangeStep: (index: number) => void;
  onExit: () => void;
}

export function DemoModeBar({
  currentIndex,
  autoPlay,
  onToggleAutoPlay,
  onChangeStep,
  onExit,
}: DemoModeBarProps) {
  const step = DEMO_STEPS[currentIndex];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      if (currentIndex < DEMO_STEPS.length - 1) {
        onChangeStep(currentIndex + 1);
      } else {
        onToggleAutoPlay();
      }
    }, 5500);
    return () => clearInterval(timer);
  }, [autoPlay, currentIndex, onChangeStep, onToggleAutoPlay]);

  return (
    <div className="mx-4 lg:mx-6 mt-2 sar-blue-gradient rounded-[22px] px-5 py-4 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold text-blue-100">
              DEMO STEP {step.step} OF {DEMO_STEPS.length}
            </span>
            <span className="text-blue-200" aria-hidden="true">·</span>
            <span className="font-display font-bold text-white">{step.title}</span>
            <span className="text-blue-200" aria-hidden="true">·</span>
            <span className="font-mono text-blue-100">Hypothetical KZN Rainfall Walkthrough</span>
          </div>
          <p className="text-xs text-blue-50 leading-relaxed">{step.description}</p>
          <p className="text-[11px] text-blue-100/90">{step.highlightNote}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeStep(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-semibold hover:bg-white disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={onToggleAutoPlay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-xs font-semibold text-white hover:bg-white/30 cursor-pointer"
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoPlay ? 'Pause' : 'Auto-Advance'}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeStep(Math.min(DEMO_STEPS.length - 1, currentIndex + 1))}
            disabled={currentIndex === DEMO_STEPS.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#1565F5] text-xs font-bold hover:bg-blue-50 disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            aria-label="Close demo bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-9 gap-1.5">
        {DEMO_STEPS.map((s, i) => (
          <button
            key={s.step}
            type="button"
            onClick={() => onChangeStep(i)}
            title={`Step ${s.step}: ${s.title}`}
            className={`h-1.5 rounded-full transition-colors cursor-pointer ${
              i === currentIndex
                ? 'bg-white'
                : i < currentIndex
                ? 'bg-white/60'
                : 'bg-white/25 hover:bg-white/40'
            }`}
            aria-label={`Jump to demo step ${s.step}`}
          />
        ))}
      </div>
    </div>
  );
}
