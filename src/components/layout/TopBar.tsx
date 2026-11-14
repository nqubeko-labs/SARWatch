import { Menu, Play, Siren, Square } from 'lucide-react';
import type { NavSectionId, RiskLevel, StudyArea } from '../../types/sarwatch';
import { NAV_ITEMS } from './Sidebar';

interface TopBarProps {
  activeSection: NavSectionId;
  studyAreas: StudyArea[];
  selectedAreaId: string;
  onChangeArea: (areaId: string) => void;
  demoActive: boolean;
  onToggleDemo: () => void;
  onOpenMobileMenu: () => void;
  sosActive: boolean;
  sosAcknowledged: boolean;
  sosSeverity: RiskLevel;
  onReopenSos: () => void;
}

export function TopBar({
  activeSection,
  studyAreas,
  selectedAreaId,
  onChangeArea,
  demoActive,
  onToggleDemo,
  onOpenMobileMenu,
  sosActive,
  sosAcknowledged,
  sosSeverity,
  onReopenSos,
}: TopBarProps) {
  const currentTitle = NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Overview Dashboard';

  return (
    <header className="px-4 lg:px-6 pt-4 pb-2 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900 truncate">
          {currentTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Persistent SOS Indicator in Top Bar when Alert is Active & Acknowledged */}
        {sosActive && sosAcknowledged && (
          <button
            type="button"
            onClick={onReopenSos}
            title="Reopen SOS impact alert banner"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[14px] bg-red-900 text-white text-xs font-bold shadow-md hover:bg-red-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-85" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <Siren className="w-3.5 h-3.5 text-red-200" />
            <span>{sosSeverity === 'RED' ? 'SOS Critical' : 'SOS High'}</span>
          </button>
        )}

        <label className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="whitespace-nowrap">Study Area</span>
          <select
            value={selectedAreaId}
            onChange={(e) => onChangeArea(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-[14px] px-3 py-2 shadow-sm focus:outline-none focus:border-[#1565F5] cursor-pointer"
            aria-label="Select study area"
          >
            {studyAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onToggleDemo}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            demoActive
              ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600'
              : 'sar-blue-gradient text-white hover:opacity-95'
          }`}
        >
          {demoActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{demoActive ? 'Exit Demo Mode' : 'DEMO MODE'}</span>
        </button>
      </div>
    </header>
  );
}
