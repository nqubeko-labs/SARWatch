import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sarwatchApi, type OverviewResponse } from './services/api';
import type {
  NavSectionId,
  Scenario,
  ScenarioPreset,
  StreetlightCommandLog,
  TimeOffsetHours,
} from './types/sarwatch';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DEMO_STEPS, DemoModeBar } from './components/layout/DemoModeBar';
import { SOSAlertBanner } from './components/shared/SOSAlertBanner';
import { OverviewView } from './views/OverviewView';
import { CommunityRiskView } from './views/CommunityRiskView';
import { WaterInfrastructureView } from './views/WaterInfrastructureView';
import { GroundMovementView } from './views/GroundMovementView';
import { AgriculturalView } from './views/AgriculturalView';
import { DigitalTwinView } from './views/DigitalTwinView';
import { SatelliteExplorerView } from './views/SatelliteExplorerView';
import { SmartStreetlightsView } from './views/SmartStreetlightsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSectionId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedAreaId, setSelectedAreaId] = useState('kzn-durban-metro');
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Digital Twin State (elevated +1h default -> SOS hidden until +3h / +6h)
  const [scenarioPreset, setScenarioPreset] = useState<ScenarioPreset>('elevated');
  const [timeOffset, setTimeOffset] = useState<TimeOffsetHours>(1);
  const [twinScenario, setTwinScenario] = useState<Scenario | null>(null);
  const [twinLoading, setTwinLoading] = useState(false);

  // Global SOS Alert & Auto-Focus State
  const [sosAcknowledged, setSosAcknowledged] = useState(false);
  const [focusTriggerNonce, setFocusTriggerNonce] = useState(0);
  const prevSosActiveRef = useRef(false);

  // Streetlight Command Logs
  const [commandLogs, setCommandLogs] = useState<StreetlightCommandLog[]>([]);

  // Demo Mode State
  const [demoActive, setDemoActive] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [demoAutoPlay, setDemoAutoPlay] = useState(false);

  const loadOverview = useCallback(async (areaId: string) => {
    try {
      setError(null);
      const [ov, sl] = await Promise.all([
        sarwatchApi.getOverview(areaId),
        sarwatchApi.getStreetlights(),
      ]);
      setOverview(ov);
      setCommandLogs(sl.commandLogs);
      setTwinScenario((prev) => prev ?? ov.digitalTwinSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Orbit ZA API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(selectedAreaId);
  }, [selectedAreaId, loadOverview]);

  const fetchDigitalTwin = useCallback(
    async (preset: ScenarioPreset, offset: TimeOffsetHours) => {
      setTwinLoading(true);
      try {
        const res = await sarwatchApi.getDigitalTwin(preset, offset);
        setTwinScenario(res.scenario);
      } catch (err) {
        console.error(err);
      } finally {
        setTwinLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDigitalTwin(scenarioPreset, timeOffset);
  }, [scenarioPreset, timeOffset, fetchDigitalTwin]);

  const activeTwinScenario = twinScenario ?? overview?.digitalTwinSummary ?? null;

  // SOS Trigger Rule:
  // If timeOffset is 0 or 1 -> SOS banner is hidden.
  // If timeOffset is 3 or 6 AND severity is HIGH ('ORANGE') or CRITICAL ('RED') -> SOS active!
  const sosActive = Boolean(
    activeTwinScenario &&
      (timeOffset === 3 || timeOffset === 6) &&
      (activeTwinScenario.severity === 'ORANGE' || activeTwinScenario.severity === 'RED')
  );

  // Automatically surface SOS banner & flyTo cluster whenever SOS transitions into active state
  useEffect(() => {
    if (sosActive && !prevSosActiveRef.current) {
      setSosAcknowledged(false);
      setFocusTriggerNonce((n) => n + 1);
    }
    prevSosActiveRef.current = sosActive;
  }, [sosActive]);

  // Also trigger auto-focus if scenario severity escalates while SOS is already active
  useEffect(() => {
    if (sosActive) {
      setFocusTriggerNonce((n) => n + 1);
    }
  }, [scenarioPreset, timeOffset, sosActive]);

  const exposedFacilities = useMemo(() => {
    if (!overview || !activeTwinScenario) return [];
    return overview.facilities.filter((f) => activeTwinScenario.exposedFacilityIds.includes(f.id));
  }, [overview, activeTwinScenario]);

  const affectedInfrastructure = useMemo(() => {
    if (!overview || !activeTwinScenario) return [];
    return overview.infrastructure.filter((i) =>
      activeTwinScenario.affectedInfrastructureIds.includes(i.id)
    );
  }, [overview, activeTwinScenario]);

  // Compute centroid of highest-risk exposed facility cluster for smart map flyTo
  const sosClusterCenter = useMemo<[number, number] | null>(() => {
    if (exposedFacilities.length === 0) {
      const highRisk = overview?.facilities.filter(
        (f) => f.riskLevel === 'RED' || f.riskLevel === 'ORANGE'
      );
      if (!highRisk || highRisk.length === 0) return null;
      const lat = highRisk.reduce((s, f) => s + f.latitude, 0) / highRisk.length;
      const lon = highRisk.reduce((s, f) => s + f.longitude, 0) / highRisk.length;
      return [lat, lon];
    }
    const lat = exposedFacilities.reduce((s, f) => s + f.latitude, 0) / exposedFacilities.length;
    const lon = exposedFacilities.reduce((s, f) => s + f.longitude, 0) / exposedFacilities.length;
    return [lat, lon];
  }, [exposedFacilities, overview?.facilities]);

  const handleViewSosDetails = () => {
    setFocusTriggerNonce((n) => n + 1);
    if (activeSection !== 'overview' && activeSection !== 'digital-twin') {
      setActiveSection('digital-twin');
    }
    setTimeout(() => {
      const mapEl =
        document.getElementById('overview-map-anchor') ??
        document.getElementById('digital-twin-map-anchor');
      mapEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const applyDemoStep = useCallback(
    async (index: number) => {
      const step = DEMO_STEPS[index];
      setDemoStepIndex(index);
      setSelectedAreaId(step.areaId);
      setActiveSection(step.section);
      setScenarioPreset(step.scenario);
      setTimeOffset(step.offset);

      if (step.step === 6) {
        await sarwatchApi.simulateStreetlights({ preset: 'severe', targetCommunity: 'ALL' });
        await loadOverview(step.areaId);
      } else if (step.step === 1) {
        await sarwatchApi.simulateStreetlights({ preset: 'normal', targetCommunity: 'ALL' });
        await loadOverview(step.areaId);
      }
    },
    [loadOverview]
  );

  const handleToggleDemo = async () => {
    if (demoActive) {
      setDemoActive(false);
      setDemoAutoPlay(false);
    } else {
      setDemoActive(true);
      await applyDemoStep(0);
    }
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="sar-card px-8 py-6 text-center space-y-2">
          <div className="font-display text-lg font-bold text-[#1565F5]">Orbit ZA</div>
          <p className="text-xs font-mono text-slate-500">
            Initializing Durban &amp; KwaZulu-Natal Geospatial Command Centre...
          </p>
        </div>
      </div>
    );
  }

  if (error || !overview || !activeTwinScenario) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md sar-card p-6 space-y-3 border-red-200">
          <div className="font-display text-base font-bold text-red-600">
            Orbit ZA Data Service Unavailable
          </div>
          <p className="text-xs text-slate-600">{error ?? 'Unexpected error loading data.'}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadOverview(selectedAreaId);
            }}
            className="px-4 py-2 rounded-xl sar-blue-gradient text-white text-xs font-bold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      {/* Global SOS Alert Banner at very top of viewport above main header */}
      <SOSAlertBanner
        visible={sosActive && !sosAcknowledged}
        severity={activeTwinScenario.severity}
        timeOffset={timeOffset}
        exposedFacilities={exposedFacilities}
        affectedInfrastructure={affectedInfrastructure}
        onAcknowledge={() => setSosAcknowledged(true)}
        onViewDetails={handleViewSosDetails}
      />

      <div className="flex-1 flex min-w-0">
        <Sidebar
          activeSection={activeSection}
          onSelect={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            activeSection={activeSection}
            studyAreas={overview.studyAreas}
            selectedAreaId={selectedAreaId}
            onChangeArea={setSelectedAreaId}
            demoActive={demoActive}
            onToggleDemo={handleToggleDemo}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            sosActive={sosActive}
            sosAcknowledged={sosAcknowledged}
            sosSeverity={activeTwinScenario.severity}
            onReopenSos={() => setSosAcknowledged(false)}
          />

          {demoActive && (
            <DemoModeBar
              currentIndex={demoStepIndex}
              autoPlay={demoAutoPlay}
              onToggleAutoPlay={() => setDemoAutoPlay((p) => !p)}
              onChangeStep={applyDemoStep}
              onExit={() => {
                setDemoActive(false);
                setDemoAutoPlay(false);
              }}
            />
          )}

          <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
            {activeSection === 'overview' && (
              <OverviewView
                data={overview}
                activeTwinScenario={activeTwinScenario}
                timeOffset={timeOffset}
                sosActive={sosActive}
                autoFocusCenter={sosClusterCenter}
                focusTriggerKey={focusTriggerNonce}
                onChangeTimeOffset={(nextOffset) => {
                  if (nextOffset >= 3 && scenarioPreset === 'normal') {
                    setScenarioPreset('elevated');
                  }
                  setTimeOffset(nextOffset);
                }}
                onFocusAffectedArea={handleViewSosDetails}
                onNavigate={setActiveSection}
              />
            )}

            {activeSection === 'community-risk' && (
              <CommunityRiskView
                facilities={overview.facilities}
                studyArea={overview.selectedStudyArea}
                onFacilitiesChanged={() => loadOverview(selectedAreaId)}
              />
            )}

            {activeSection === 'water-infrastructure' && (
              <WaterInfrastructureView
                assets={overview.infrastructure}
                studyArea={overview.selectedStudyArea}
              />
            )}

            {activeSection === 'ground-movement' && (
              <GroundMovementView
                stations={overview.groundMovement}
                infrastructure={overview.infrastructure}
                studyArea={overview.selectedStudyArea}
              />
            )}

            {activeSection === 'agricultural' && (
              <AgriculturalView
                zones={overview.agriculturalZones}
                studyArea={overview.selectedStudyArea}
              />
            )}

            {activeSection === 'digital-twin' && (
              <DigitalTwinView
                scenarioPreset={scenarioPreset}
                timeOffset={timeOffset}
                onChangeScenario={setScenarioPreset}
                onChangeOffset={setTimeOffset}
                scenario={activeTwinScenario}
                studyArea={overview.selectedStudyArea}
                facilities={overview.facilities}
                infrastructure={overview.infrastructure}
                agriculturalZones={overview.agriculturalZones}
                communityPolygons={overview.communityPolygons}
                streetlights={overview.streetlights}
                loading={twinLoading}
                sosActive={sosActive}
                autoFocusCenter={sosClusterCenter}
                focusTriggerKey={focusTriggerNonce}
              />
            )}

            {activeSection === 'satellite-explorer' && <SatelliteExplorerView />}

            {activeSection === 'smart-streetlights' && (
              <SmartStreetlightsView
                streetlights={overview.streetlights}
                commandLogs={commandLogs}
                studyArea={overview.selectedStudyArea}
                onUpdated={() => loadOverview(selectedAreaId)}
              />
            )}

            {activeSection === 'reports' && <ReportsView studyArea={overview.selectedStudyArea} />}

            {activeSection === 'settings' && (
              <SettingsView
                studyAreas={overview.studyAreas}
                selectedAreaId={selectedAreaId}
                onChangeArea={setSelectedAreaId}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
