import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Globe2,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  Satellite,
  Settings,
  Sprout,
  X,
} from 'lucide-react';
import type { NavSectionId } from '../../types/sarwatch';

export const NAV_ITEMS: { id: NavSectionId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'community-risk', label: 'Community Risk Intelligence', icon: Building2 },
  { id: 'water-infrastructure', label: 'Water Infrastructure', icon: Droplets },
  { id: 'ground-movement', label: 'Ground Movement', icon: Activity },
  { id: 'agricultural', label: 'Agricultural Intelligence', icon: Sprout },
  { id: 'digital-twin', label: 'Digital Twin', icon: Layers3 },
  { id: 'satellite-explorer', label: 'Satellite Data Explorer', icon: Satellite },
  { id: 'smart-streetlights', label: 'Smart Streetlights', icon: Lightbulb },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeSection: NavSectionId;
  onSelect: (id: NavSectionId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:ml-4 lg:my-4 inset-y-0 left-0 z-50 flex flex-col bg-white/95 backdrop-blur-md lg:rounded-[28px] border border-white shadow-[0_20px_50px_-15px_rgba(30,64,175,0.12)] transition-all duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[78px]' : 'w-64'}`}
        aria-label="Primary navigation"
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-[12px] sar-blue-gradient flex items-center justify-center text-white shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
                Orbit ZA
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-[#1565F5] hover:bg-[#E8F0FE] transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-xs font-semibold transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-[#E8F0FE] text-[#1565F5]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#1565F5]' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-800">KwaZulu-Natal Prototype</div>
            <p className="leading-relaxed text-slate-400">
              Seeing Hazards. Understanding Risk. Protecting Communities.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
