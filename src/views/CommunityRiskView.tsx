import { useMemo, useState } from 'react';
import { Edit3, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { sarwatchApi } from '../services/api';
import type {
  EvacuationVerificationStatus,
  Facility,
  FacilityCategory,
  RiskLevel,
  StudyArea,
} from '../types/sarwatch';
import { SarWatchMap } from '../components/map/SarWatchMap';
import { HazardStatus } from '../components/shared/HazardBadge';
import { ProvenanceBanner } from '../components/shared/ProvenanceBanner';

const CATEGORIES: FacilityCategory[] = [
  'Informal Settlement',
  'School',
  'Clinic',
  'Hospital',
  'Church',
  'Community Hall',
  'Evacuation Shelter',
  'Public Facility',
];

const VERIFICATION_OPTIONS: EvacuationVerificationStatus[] = [
  'Verified Evacuation Shelter',
  'Unverified for Evacuation',
  'Not Designated as Shelter',
];

interface CommunityRiskViewProps {
  facilities: Facility[];
  studyArea: StudyArea;
  onFacilitiesChanged: () => Promise<void>;
}

export function CommunityRiskView({
  facilities,
  studyArea,
  onFacilitiesChanged,
}: CommunityRiskViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(facilities[0] ?? null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    category: 'Clinic' as FacilityCategory,
    latitude: studyArea.center[0],
    longitude: studyArea.center[1],
    community: 'Quarry Road West',
    riskLevel: 'YELLOW' as RiskLevel,
    verifiedStatus: 'Not Designated as Shelter' as EvacuationVerificationStatus,
    exposureReason: '',
    dataSource: 'User Demonstration Entry',
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return facilities.filter((f) => {
      if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
      if (riskFilter !== 'ALL' && f.riskLevel !== riskFilter) return false;
      if (q && !`${f.id} ${f.name} ${f.community} ${f.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [facilities, search, categoryFilter, riskFilter]);

  const exposedIds = useMemo(
    () => filtered.filter((f) => f.riskLevel === 'ORANGE' || f.riskLevel === 'RED').map((f) => f.id),
    [filtered]
  );

  const openAddModal = () => {
    setEditingId(null);
    setErrorMsg(null);
    setFormState({
      name: '',
      category: 'Community Hall',
      latitude: Number(studyArea.center[0].toFixed(4)),
      longitude: Number(studyArea.center[1].toFixed(4)),
      community: 'Quarry Road West',
      riskLevel: 'YELLOW',
      verifiedStatus: 'Not Designated as Shelter',
      exposureReason: 'Demonstration facility added for spatial exposure review.',
      dataSource: 'User Demonstration Entry',
    });
    setModalOpen(true);
  };

  const openEditModal = (fac: Facility) => {
    setEditingId(fac.id);
    setErrorMsg(null);
    setFormState({
      name: fac.name,
      category: fac.category,
      latitude: fac.latitude,
      longitude: fac.longitude,
      community: fac.community,
      riskLevel: fac.riskLevel,
      verifiedStatus: fac.verifiedStatus,
      exposureReason: fac.exposureReason,
      dataSource: fac.dataSource,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);
    try {
      const payload = {
        ...formState,
        latitude: Number(formState.latitude),
        longitude: Number(formState.longitude),
        studyAreaId: studyArea.id,
      };
      if (editingId) {
        const updated = await sarwatchApi.updateFacility(editingId, payload);
        setSelectedFacility(updated);
      } else {
        const created = await sarwatchApi.createFacility(payload);
        setSelectedFacility(created);
      }
      await onFacilitiesChanged();
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save facility record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProvenanceBanner
        title="Community Safeguarding & Shelter Verification Policy"
        message="Facility records are demonstration spatial points without household-level personal information. Churches and schools are strictly labelled Unverified for Evacuation unless verified by municipal disaster authorities."
        tone="caution"
        isSimulated={true}
      />

      {/* Search, Filter & Add Bar */}
      <div className="sar-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facility ID, name, or community..."
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1565F5]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F8FAFF] border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#1565F5]"
            aria-label="Filter by facility category"
          >
            <option value="ALL">All Categories ({facilities.length})</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#F8FAFF] border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#1565F5]"
            aria-label="Filter by risk category"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="GREEN">GREEN — Normal</option>
            <option value="YELLOW">YELLOW — Advisory</option>
            <option value="ORANGE">ORANGE — High</option>
            <option value="RED">RED — Critical</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl sar-blue-gradient text-white font-bold text-xs hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Demonstration Facility</span>
        </button>
      </div>

      {/* Map + Selected Facility Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <SarWatchMap
            center={
              selectedFacility
                ? [selectedFacility.latitude, selectedFacility.longitude]
                : studyArea.center
            }
            zoom={selectedFacility ? 13 : studyArea.zoom}
            heightClass="h-[460px]"
            facilities={filtered}
            exposedFacilityIds={exposedIds}
            selectedId={selectedFacility?.id ?? null}
            initialLayers={{
              facilities: true,
              communities: true,
              floodZones: true,
              infrastructure: false,
              groundMovement: false,
              agriculture: false,
              streetlights: false,
            }}
            onSelectFacility={(fac) => setSelectedFacility(fac)}
          />
        </div>

        <div className="xl:col-span-4 sar-card p-5 space-y-4">
          {selectedFacility ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono font-semibold text-[#1565F5]">
                    {selectedFacility.id} · {selectedFacility.category}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                    {selectedFacility.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(selectedFacility)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E8F0FE] text-[#1565F5] text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <HazardStatus level={selectedFacility.riskLevel} showDescription={true} />

              <dl className="grid grid-cols-1 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Community Area</dt>
                  <dd className="font-semibold text-slate-900 text-right">{selectedFacility.community}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Coordinates</dt>
                  <dd className="font-mono text-slate-700 tabular-nums">
                    {selectedFacility.latitude.toFixed(4)}, {selectedFacility.longitude.toFixed(4)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Shelter Status</dt>
                  <dd
                    className={`font-semibold text-right ${
                      selectedFacility.verifiedStatus === 'Verified Evacuation Shelter'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {selectedFacility.verifiedStatus}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Last Assessed</dt>
                  <dd className="font-mono text-slate-600">
                    {selectedFacility.lastAssessed.replace('T', ' ').slice(0, 16)} UTC
                  </dd>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <dt className="text-slate-500">Potential Hazard Exposure</dt>
                  <dd className="text-slate-800 leading-relaxed">{selectedFacility.exposureReason}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-slate-500">Data Source</dt>
                  <dd className="text-slate-700">{selectedFacility.dataSource}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">
              Select a facility marker on the map or table below to inspect exposure metadata.
            </div>
          )}
        </div>
      </div>

      {/* Facility Registry Table */}
      <div className="sar-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Community Facility Registry ({filtered.length} matching records)
          </h3>
          <span className="text-[11px] font-mono text-amber-600">Simulated Demonstration Data</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-slate-600">No facilities match the selected search or filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                setRiskFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-[#E8F0FE] text-xs font-semibold text-[#1565F5] hover:bg-blue-100 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFF] text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Facility ID</th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Community</th>
                  <th className="py-3 px-4 font-semibold">Lat / Lon</th>
                  <th className="py-3 px-4 font-semibold">Evacuation Status</th>
                  <th className="py-3 px-4 font-semibold">Risk Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedFacility(f)}
                    className={`cursor-pointer transition-colors ${
                      selectedFacility?.id === f.id ? 'bg-[#EEF4FF]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#1565F5] whitespace-nowrap">{f.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{f.name}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{f.category}</td>
                    <td className="py-3 px-4 text-slate-600">{f.community}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                      {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          f.verifiedStatus === 'Verified Evacuation Shelter'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {f.verifiedStatus === 'Verified Evacuation Shelter' && (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{f.verifiedStatus}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <HazardStatus level={f.riskLevel} compact={true} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(f);
                        }}
                        className="text-[#1565F5] hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[26px] border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingId ? `Edit Facility (${editingId})` : 'Add Demonstration Facility'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Facility Name</label>
                <input
                  required
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. Palmiet Primary Clinic"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1565F5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({ ...formState, category: e.target.value as FacilityCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1565F5]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Community Area</label>
                  <input
                    required
                    type="text"
                    value={formState.community}
                    onChange={(e) => setFormState({ ...formState, community: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1565F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Latitude (e.g. -29.804)</label>
                  <input
                    required
                    type="number"
                    step="0.0001"
                    value={formState.latitude}
                    onChange={(e) =>
                      setFormState({ ...formState, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#1565F5]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Longitude (e.g. 30.966)</label>
                  <input
                    required
                    type="number"
                    step="0.0001"
                    value={formState.longitude}
                    onChange={(e) =>
                      setFormState({ ...formState, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#1565F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Risk Category</label>
                  <select
                    value={formState.riskLevel}
                    onChange={(e) =>
                      setFormState({ ...formState, riskLevel: e.target.value as RiskLevel })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1565F5]"
                  >
                    <option value="GREEN">GREEN — Normal</option>
                    <option value="YELLOW">YELLOW — Advisory</option>
                    <option value="ORANGE">ORANGE — High</option>
                    <option value="RED">RED — Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Evacuation Verification</label>
                  <select
                    value={formState.verifiedStatus}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        verifiedStatus: e.target.value as EvacuationVerificationStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1565F5]"
                  >
                    {VERIFICATION_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Exposure Notes</label>
                <textarea
                  rows={2}
                  value={formState.exposureReason}
                  onChange={(e) => setFormState({ ...formState, exposureReason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFF] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#1565F5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl sar-blue-gradient text-white font-bold hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
