import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { RiskLevel } from '../../types/sarwatch';

export const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    fullTitle: string;
    textClass: string;
    bgSoftClass: string;
    borderClass: string;
    hex: string;
    description: string;
  }
> = {
  GREEN: {
    label: 'NORMAL',
    fullTitle: 'GREEN — NORMAL',
    textClass: 'text-emerald-600',
    bgSoftClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    hex: '#10B981',
    description: 'No elevated hazard indicators detected in the selected data.',
  },
  YELLOW: {
    label: 'ADVISORY',
    fullTitle: 'YELLOW — ADVISORY',
    textClass: 'text-amber-600',
    bgSoftClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    hex: '#F59E0B',
    description: 'Conditions may require monitoring.',
  },
  ORANGE: {
    label: 'HIGH',
    fullTitle: 'ORANGE — HIGH',
    textClass: 'text-orange-600',
    bgSoftClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    hex: '#F97316',
    description: 'Significant hazard indicators suggest increased potential exposure.',
  },
  RED: {
    label: 'CRITICAL',
    fullTitle: 'RED — CRITICAL',
    textClass: 'text-red-600',
    bgSoftClass: 'bg-red-50',
    borderClass: 'border-red-200',
    hex: '#EF4444',
    description: 'Severe hazard indicators require urgent verification and attention from authorised emergency personnel.',
  },
};

interface HazardStatusProps {
  level: RiskLevel;
  compact?: boolean;
  showDescription?: boolean;
}

export function HazardStatus({ level, compact = false, showDescription = false }: HazardStatusProps) {
  const cfg = RISK_CONFIG[level];
  const Icon =
    level === 'GREEN'
      ? CheckCircle2
      : level === 'YELLOW'
      ? Info
      : level === 'ORANGE'
      ? AlertTriangle
      : AlertOctagon;

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 ${cfg.textClass}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{compact ? `${level} · ${cfg.label}` : cfg.fullTitle}</span>
      </span>
      {showDescription && <p className="text-xs text-slate-600 leading-relaxed">{cfg.description}</p>}
    </div>
  );
}
