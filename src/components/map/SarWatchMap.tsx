import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { Layers } from 'lucide-react';
import type {
  AgriculturalZone,
  CommunityPolygon,
  Facility,
  FloodExposureZone,
  GroundMovementStation,
  InfrastructureAsset,
  RiskLevel,
  Streetlight,
} from '../../types/sarwatch';
import { RISK_CONFIG } from '../shared/HazardBadge';

export type BasemapType = 'light' | 'osm' | 'satellite' | 'dark';

export interface MapLayerVisibility {
  communities: boolean;
  floodZones: boolean;
  facilities: boolean;
  infrastructure: boolean;
  groundMovement: boolean;
  agriculture: boolean;
  streetlights: boolean;
}

interface SarWatchMapProps {
  center: [number, number];
  zoom: number;
  heightClass?: string;
  facilities?: Facility[];
  exposedFacilityIds?: string[];
  infrastructure?: InfrastructureAsset[];
  affectedInfrastructureIds?: string[];
  groundMovement?: GroundMovementStation[];
  agriculturalZones?: AgriculturalZone[];
  communityPolygons?: CommunityPolygon[];
  floodZones?: FloodExposureZone[];
  streetlights?: Streetlight[];
  selectedId?: string | null;
  sosActive?: boolean;
  autoFocusCenter?: [number, number] | null;
  autoFocusZoom?: number;
  focusTriggerKey?: string | number;
  initialLayers?: Partial<MapLayerVisibility>;
  onSelectFacility?: (f: Facility) => void;
  onSelectInfrastructure?: (inf: InfrastructureAsset) => void;
  onSelectStation?: (st: GroundMovementStation) => void;
  onSelectAgZone?: (zone: AgriculturalZone) => void;
  onSelectStreetlight?: (sl: Streetlight) => void;
  showLegend?: boolean;
}

function MapViewportSync({
  center,
  zoom,
  autoFocusCenter,
  autoFocusZoom,
  focusTriggerKey,
}: {
  center: [number, number];
  zoom: number;
  autoFocusCenter?: [number, number] | null;
  autoFocusZoom?: number;
  focusTriggerKey?: string | number;
}) {
  const map = useMap();
  const lastFocusKeyRef = useRef<string | number | undefined>(undefined);
  const lastBaseRef = useRef<string>('');

  useEffect(() => {
    // Only auto-fly to SOS cluster when SOS trigger key changes (never fights user pan/zoom)
    if (autoFocusCenter && focusTriggerKey !== undefined && focusTriggerKey !== lastFocusKeyRef.current) {
      lastFocusKeyRef.current = focusTriggerKey;
      map.flyTo(autoFocusCenter, autoFocusZoom ?? 13, { duration: 0.9 });
      return;
    }

    const baseKey = `${center[0].toFixed(4)},${center[1].toFixed(4)},${zoom}`;
    if (baseKey !== lastBaseRef.current && !autoFocusCenter) {
      lastBaseRef.current = baseKey;
      map.flyTo(center, zoom, { duration: 0.6 });
    }
  }, [center, zoom, autoFocusCenter, autoFocusZoom, focusTriggerKey, map]);

  return null;
}

function getRiskHex(level: RiskLevel): string {
  return RISK_CONFIG[level]?.hex ?? '#1565F5';
}

function createPulsingSosIcon(colorHex: string) {
  const ringBg = colorHex === '#EF4444' ? 'rgba(239, 68, 68, 0.48)' : 'rgba(249, 115, 22, 0.45)';
  return L.divIcon({
    className: 'sos-marker-wrapper',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: `<div class="sos-marker-container">
      <span class="sos-marker-ring" style="background-color:${ringBg};"></span>
      <span class="sos-marker-core" style="background-color:${colorHex};"></span>
    </div>`,
  });
}

export function SarWatchMap({
  center,
  zoom,
  heightClass = 'h-[480px]',
  facilities = [],
  exposedFacilityIds = [],
  infrastructure = [],
  affectedInfrastructureIds = [],
  groundMovement = [],
  agriculturalZones = [],
  communityPolygons = [],
  floodZones = [],
  streetlights = [],
  selectedId = null,
  sosActive = false,
  autoFocusCenter = null,
  autoFocusZoom = 13,
  focusTriggerKey,
  initialLayers,
  onSelectFacility,
  onSelectInfrastructure,
  onSelectStation,
  onSelectAgZone,
  onSelectStreetlight,
  showLegend = true,
}: SarWatchMapProps) {
  const [basemap, setBasemap] = useState<BasemapType>('light');
  const [layersOpen, setLayersOpen] = useState(false);
  const [layers, setLayers] = useState<MapLayerVisibility>({
    communities: true,
    floodZones: true,
    facilities: true,
    infrastructure: true,
    groundMovement: true,
    agriculture: true,
    streetlights: true,
    ...initialLayers,
  });

  const toggleLayer = (key: keyof MapLayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const tileConfig =
    basemap === 'light'
      ? {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }
      : basemap === 'dark'
      ? {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }
      : basemap === 'satellite'
      ? {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri',
        }
      : {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
        };

  return (
    <div className="sar-card p-2.5">
      <div className={`relative w-full ${heightClass} rounded-[18px] overflow-hidden border border-slate-200/80 bg-[#EEF3FC]`}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <MapViewportSync
            center={center}
            zoom={zoom}
            autoFocusCenter={autoFocusCenter}
            autoFocusZoom={autoFocusZoom}
            focusTriggerKey={focusTriggerKey}
          />
          <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />

          {/* Community Boundaries */}
          {layers.communities &&
            communityPolygons.map((poly) => (
              <Polygon
                key={poly.id}
                positions={poly.coordinates}
                pathOptions={{
                  color: getRiskHex(poly.riskLevel),
                  weight: 1.75,
                  dashArray: '5 5',
                  fillColor: getRiskHex(poly.riskLevel),
                  fillOpacity: 0.1,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 max-w-[230px]">
                    <div className="font-bold text-slate-900">{poly.name}</div>
                    <div className="font-mono text-[11px] font-semibold" style={{ color: getRiskHex(poly.riskLevel) }}>
                      {poly.riskLevel} · Community Screening Zone
                    </div>
                    <p className="text-slate-600 leading-relaxed">{poly.notes}</p>
                  </div>
                </Popup>
              </Polygon>
            ))}

          {/* Agricultural Zones */}
          {layers.agriculture &&
            agriculturalZones.map((zone) => {
              const isSelected = selectedId === zone.id;
              return (
                <Polygon
                  key={zone.id}
                  positions={zone.coordinates}
                  pathOptions={{
                    color: isSelected ? '#1565F5' : getRiskHex(zone.degradationStatus),
                    weight: isSelected ? 2.5 : 1.75,
                    fillColor: getRiskHex(zone.degradationStatus),
                    fillOpacity: isSelected ? 0.3 : 0.18,
                  }}
                  eventHandlers={{
                    click: () => onSelectAgZone?.(zone),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 max-w-[240px]">
                      <div className="font-bold text-slate-900">{zone.name}</div>
                      <div className="font-mono text-[11px] text-[#1565F5]">
                        NDVI {zone.ndvi.toFixed(2)} · Soil Moisture {zone.soilMoisturePct}% · HV {zone.radarBackscatterHvDb} dB
                      </div>
                      <p className="text-slate-600">{zone.degradationIndicator}</p>
                      <div className="text-[10px] font-mono text-amber-600">Simulated Demonstration Zone</div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

          {/* Simulated Flood Exposure Zones */}
          {layers.floodZones &&
            floodZones.map((fz) => (
              <Polygon
                key={fz.id}
                positions={fz.coordinates}
                pathOptions={{
                  color: getRiskHex(fz.severity),
                  weight: 2,
                  fillColor: getRiskHex(fz.severity),
                  fillOpacity: 0.28,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 max-w-[240px]">
                    <div className="font-bold text-slate-900">{fz.name}</div>
                    <div className="font-mono text-[11px] font-semibold" style={{ color: getRiskHex(fz.severity) }}>
                      {fz.severity} · Est. Depth {fz.depthEstimateM} m
                    </div>
                    <div className="text-slate-600">Community: {fz.community}</div>
                    <div className="text-[10px] font-mono text-amber-600">
                      Hypothetical Flood-Exposure Envelope
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

          {/* Water Infrastructure Lines & Nodes */}
          {layers.infrastructure &&
            infrastructure.map((inf) => {
              const isAffected = affectedInfrastructureIds.includes(inf.id);
              const isSelected = selectedId === inf.id;
              const color = isAffected ? '#F97316' : getRiskHex(inf.status);

              return (
                <div key={inf.id}>
                  {inf.path && (
                    <Polyline
                      positions={inf.path}
                      pathOptions={{
                        color: isSelected ? '#1565F5' : '#0EA5E9',
                        weight: isSelected ? 4.5 : 3,
                        dashArray: inf.type === 'Mapped Water Pipeline' ? '6 4' : undefined,
                      }}
                      eventHandlers={{
                        click: () => onSelectInfrastructure?.(inf),
                      }}
                    />
                  )}
                  <CircleMarker
                    center={[inf.latitude, inf.longitude]}
                    radius={isSelected ? 10 : 7.5}
                    pathOptions={{
                      color: isSelected ? '#1565F5' : '#FFFFFF',
                      weight: isSelected ? 3 : 2,
                      fillColor: color,
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{
                      click: () => onSelectInfrastructure?.(inf),
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 max-w-[240px]">
                        <div className="font-bold text-slate-900">{inf.name}</div>
                        <div className="font-mono text-[11px] text-[#1565F5]">
                          {inf.type} · Coherence {inf.coherence.toFixed(2)}
                        </div>
                        <p className="text-slate-600">{inf.exposureIndicator}</p>
                        <div className="text-[10px] text-amber-600">
                          Screening only; radar cannot confirm leaks or failure.
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </div>
              );
            })}

          {/* Ground Movement InSAR Stations */}
          {layers.groundMovement &&
            groundMovement.map((st) => {
              const isSelected = selectedId === st.id;
              return (
                <CircleMarker
                  key={st.id}
                  center={[st.latitude, st.longitude]}
                  radius={isSelected ? 10 : 7.5}
                  pathOptions={{
                    color: '#FFFFFF',
                    weight: isSelected ? 3 : 2,
                    fillColor: getRiskHex(st.riskLevel),
                    fillOpacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => onSelectStation?.(st),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 max-w-[230px]">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="font-mono text-[11px] text-[#1565F5]">
                        LOS Velocity: {st.velocityMmYr} mm/yr · Coherence {st.coherence}
                      </div>
                      <div className="text-slate-600">Cumulative: {st.cumulativeDisplacementMm} mm</div>
                      <div className="text-[10px] font-mono text-amber-600">Simulated InSAR Station</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* Community Facilities (Pulsing SOS Markers for HIGH/CRITICAL or SOS-exposed items) */}
          {layers.facilities &&
            facilities.map((fac) => {
              const isExposed = exposedFacilityIds.includes(fac.id);
              const isSelected = selectedId === fac.id;
              const isHighOrCritical = fac.riskLevel === 'ORANGE' || fac.riskLevel === 'RED';
              const shouldPulse = (sosActive && isExposed) || isHighOrCritical;
              const effectiveColor =
                sosActive && isExposed
                  ? '#EF4444'
                  : isExposed
                  ? '#F97316'
                  : getRiskHex(fac.riskLevel);

              const popupNode = (
                <Popup>
                  <div className="text-xs space-y-1 max-w-[240px]">
                    <div className="font-bold text-slate-900">{fac.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {fac.id} · {fac.category}
                    </div>
                    <div className="font-mono text-[11px] font-semibold" style={{ color: effectiveColor }}>
                      {isExposed && sosActive
                        ? 'SOS EXPOSED IN SCENARIO'
                        : isExposed
                        ? 'EXPOSED IN SCENARIO'
                        : `${fac.riskLevel} · ${RISK_CONFIG[fac.riskLevel].label}`}
                    </div>
                    <div className="text-slate-700">{fac.verifiedStatus}</div>
                    <div className="text-[11px] text-slate-500">Community: {fac.community}</div>
                  </div>
                </Popup>
              );

              if (shouldPulse) {
                return (
                  <Marker
                    key={`${fac.id}-pulse-${effectiveColor}`}
                    position={[fac.latitude, fac.longitude]}
                    icon={createPulsingSosIcon(effectiveColor)}
                    eventHandlers={{
                      click: () => onSelectFacility?.(fac),
                    }}
                  >
                    {popupNode}
                  </Marker>
                );
              }

              return (
                <CircleMarker
                  key={fac.id}
                  center={[fac.latitude, fac.longitude]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{
                    color: isSelected ? '#1565F5' : '#FFFFFF',
                    weight: isSelected ? 2.5 : 2,
                    fillColor: effectiveColor,
                    fillOpacity: 0.95,
                  }}
                  eventHandlers={{
                    click: () => onSelectFacility?.(fac),
                  }}
                >
                  {popupNode}
                </CircleMarker>
              );
            })}

          {/* Smart Streetlights */}
          {layers.streetlights &&
            streetlights.map((sl) => {
              const isSelected = selectedId === sl.id;
              const color = getRiskHex(sl.riskLevel);
              return (
                <CircleMarker
                  key={sl.id}
                  center={[sl.latitude, sl.longitude]}
                  radius={isSelected ? 8.5 : 5.5}
                  pathOptions={{
                    color: '#0F172A',
                    weight: 1.5,
                    fillColor: color,
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => onSelectStreetlight?.(sl),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 max-w-[230px]">
                      <div className="font-bold text-slate-900">{sl.name}</div>
                      <div className="font-mono text-[11px] font-semibold" style={{ color }}>
                        {sl.id} · {sl.simulatedStatus}
                      </div>
                      <div className="text-slate-600">Community: {sl.community}</div>
                      <div className="text-[10px] font-mono text-amber-600">Simulated Municipal Node</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>

        {/* Floating Top-Right Basemap & Layer Switcher */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-md">
            {(
              [
                ['light', 'Light Map'],
                ['osm', 'Streets'],
                ['satellite', 'Imagery'],
                ['dark', 'Dark'],
              ] as [BasemapType, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBasemap(mode)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  basemap === mode
                    ? 'bg-[#1565F5] text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLayersOpen((v) => !v)}
              className={`ml-0.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                layersOpen ? 'bg-[#E8F0FE] text-[#1565F5]' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
            </button>
          </div>

          {layersOpen && (
            <div className="w-60 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-900 pb-1.5 border-b border-slate-100">
                Map Layer Visibility
              </div>
              {(
                [
                  ['facilities', 'Community Facilities'],
                  ['floodZones', 'Simulated Flood Zones'],
                  ['communities', 'Community Boundaries'],
                  ['infrastructure', 'Water Infrastructure'],
                  ['groundMovement', 'InSAR Ground Movement'],
                  ['agriculture', 'Agricultural Zones'],
                  ['streetlights', 'Smart Streetlights'],
                ] as [keyof MapLayerVisibility, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={() => toggleLayer(key)}
                    className="accent-[#1565F5] rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Floating Bottom-Left Map Legend */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3.5 py-2 text-[11px] text-slate-700 shadow-md flex flex-wrap items-center gap-x-4 gap-y-1 max-w-[90%]">
            <span className="font-bold text-slate-900">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" /> Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" /> Advisory
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] inline-block" /> High (Pulsing)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block animate-pulse" /> Critical SOS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0EA5E9] inline-block" /> River / Pipeline
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
