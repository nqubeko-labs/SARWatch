import { AlertTriangle, Check, MapPin, Siren } from 'lucide-react';
import type { Facility, InfrastructureAsset, RiskLevel, TimeOffsetHours } from '../../types/sarwatch';

interface SOSAlertBannerProps {
  visible: boolean;
  severity: RiskLevel;
  timeOffset: TimeOffsetHours;
  exposedFacilities: Facility[];
  affectedInfrastructure: InfrastructureAsset[];
  onAcknowledge: () => void;
  onViewDetails: () => void;
}

function summarizeCategories(facilities: Facility[]): string {
  if (facilities.length === 0) return 'No tagged facilities';
  const counts = new Map<string, number>();
  facilities.forEach((f) => {
    counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .slice(0, 3)
    .map(([cat, count]) => `${count} ${cat}${count > 1 ? 's' : ''}`)
    .join(', ');
}

export function SOSAlertBanner({
  visible,
  severity,
  timeOffset,
  exposedFacilities,
  affectedInfrastructure,
  onAcknowledge,
  onViewDetails,
}: SOSAlertBannerProps) {
  if (!visible) return null;

  const isCritical = severity === 'RED';
  const communities = Array.from(new Set(exposedFacilities.map((f) => f.community))).slice(0, 3);
  const communityText = communities.length > 0 ? communities.join(' & ') : 'Durban Metro Basin';
  const categorySummary = summarizeCategories(exposedFacilities);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-[1100] w-full bg-red-900/95 backdrop-blur-md border-b border-red-500/70 text-white shadow-lg"
    >
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/80 border border-red-400/60 text-white shrink-0 animate-pulse">
            {isCritical ? <Siren className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </span>

          <div className="text-xs sm:text-sm leading-snug min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-bold tracking-wide text-red-100 animate-pulse">
                {isCritical ? 'CRITICAL IMPACT DETECTED' : 'HIGH IMPACT DETECTED'}
              </span>
              <span className="text-red-300" aria-hidden="true">·</span>
              <span className="font-mono text-xs text-red-200">
                Simulated T+{timeOffset}h Horizon
              </span>
            </div>
            <p className="text-xs text-white/95 font-medium mt-0.5">
              {categorySummary} in {communityText} at {isCritical ? 'critical' : 'high'} flood exposure risk
              {affectedInfrastructure.length > 0
                ? ` · ${affectedInfrastructure.length} water asset${affectedInfrastructure.length > 1 ? 's' : ''} flagged`
                : ''}
              . <span className="text-red-200 font-normal">(Simulated Screening Alert)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-red-950 font-bold text-xs hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>
          <button
            type="button"
            onClick={onAcknowledge}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-950/80 border border-red-400/60 text-red-100 font-semibold text-xs hover:bg-red-950 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
