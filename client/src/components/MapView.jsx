import { useEffect, useState } from 'react';
import { MapContainer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { getTileConfig } from './MapLayerControl';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Category colors
const CAT_COLORS = {
    restaurant: '#D93025', cafe: '#795548', gas_station: '#E37400',
    ev_charging: '#0D904F', lodging: '#9334E6', hospital: '#E91E63',
    pharmacy: '#00897B', atm: '#1A73E8', parking: '#5F6368',
    tourist: '#F9AB00', things_to_do: '#E91E63', museum: '#6D4C41',
    transit: '#0288D1', shopping: '#FF5722', temple: '#FF6F00',
};

const CAT_SYMBOLS = {
    restaurant: '🍽️', cafe: '☕', gas_station: '⛽',
    ev_charging: '🔋', lodging: '🏨', hospital: '🏥',
    pharmacy: '💊', atm: '🏧', parking: '🅿️',
    tourist: '🎡', things_to_do: '🎭', museum: '🏛️',
    transit: '🚉', shopping: '🛍️', temple: '⛪',
};

// SVG Pin Marker
function createPinIcon(category, isSelected) {
    const color = CAT_COLORS[category] || '#1A73E8';
    const symbol = CAT_SYMBOLS[category] || '📍';
    const scale = isSelected ? 1.3 : 1;
    const w = Math.round(30 * scale);
    const h = Math.round(40 * scale);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 30 40">
      <defs><filter id="s${category}" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
      </filter></defs>
      <path d="M15 38 C15 38 28 22 28 14 A13 13 0 0 0 2 14 C2 22 15 38 15 38Z"
            fill="${color}" filter="url(#s${category})" stroke="#fff" stroke-width="1.2"/>
      <circle cx="15" cy="14" r="8" fill="#fff"/>
      <text x="15" y="18" text-anchor="middle" font-size="12">${symbol}</text>
    </svg>`;

    return L.divIcon({
        className: 'custom-marker',
        html: svg,
        iconSize: [w, h],
        iconAnchor: [w / 2, h],
        popupAnchor: [0, -h + 4],
    });
}

// Start / End markers
function makeEndpointIcon(letter, color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
          <defs><filter id="ep${letter}" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
          </filter></defs>
          <path d="M17 42 C17 42 32 24 32 15 A15 15 0 0 0 2 15 C2 24 17 42 17 42Z"
                fill="${color}" filter="url(#ep${letter})" stroke="#fff" stroke-width="1.5"/>
          <circle cx="17" cy="15" r="8" fill="#fff"/>
          <text x="17" y="19.5" text-anchor="middle" font-size="13" font-weight="bold"
                fill="${color}" font-family="Arial,sans-serif">${letter}</text>
        </svg>`,
        iconSize: [34, 44],
        iconAnchor: [17, 44],
        popupAnchor: [0, -40],
    });
}
const startIcon = makeEndpointIcon('A', '#0D904F');
const endIcon = makeEndpointIcon('B', '#D93025');

// Waypoint / added-stop markers — amber numbered pins
function makeWaypointIcon(index) {
    const color = '#F7941D'; // Brand orange
    const label = (index + 1).toString();
    return L.divIcon({
        className: 'custom-marker',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
          <defs>
            <filter id="wp${index}" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/>
            </filter>
          </defs>
          <!-- Hexagonal/Diamond body -->
          <path d="M16 40 C16 40 30 23 30 14 A14 14 0 0 0 2 14 C2 23 16 40 16 40Z"
                fill="${color}" filter="url(#wp${index})" stroke="#fff" stroke-width="2"/>
          <!-- White inner circle with number -->
          <circle cx="16" cy="14" r="8" fill="#fff"/>
          <text x="16" y="18.5" text-anchor="middle" font-size="11" font-weight="800"
                fill="${color}" font-family="Arial,sans-serif">${label}</text>
          <!-- Small badge stripe at top to distinguish from A/B markers -->
          <rect x="10" y="3" width="12" height="3" rx="1.5" fill="#fff" opacity="0.6"/>
        </svg>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -40],
    });
}

// FitBounds helper
function FitBounds({ routePoints }) {
    const map = useMap();
    useEffect(() => {
        if (routePoints && routePoints.length > 1) {
            const bounds = L.latLngBounds(routePoints.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
    }, [routePoints, map]);
    return null;
}

// Dynamic tile layer based on selected map layer and theme
function DynamicTiles({ layerId }) {
    const { theme } = useTheme();
    const map = useMap();

    useEffect(() => {
        map.eachLayer(l => { if (l instanceof L.TileLayer) map.removeLayer(l); });
        const config = getTileConfig(layerId, theme);
        L.tileLayer(config.url, {
            attribution: config.attribution,
            maxZoom: config.maxZoom || 19,
            className: config.className || '',
        }).addTo(map);
    }, [layerId, theme, map]);

    return null;
}

// Custom Zoom Buttons component (renders into Leaflet map via useMap)
function CustomZoomControl() {
    const map = useMap();
    return null; // We use the HTML overlay buttons below instead
}

function openStreetView(lat, lng) {
    window.open(
        `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`,
        '_blank'
    );
}

// Map Layer Buttons
const LAYERS = [
    { id: 'default', label: 'Map', icon: '🗺️' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' },
    { id: 'terrain', label: 'Terrain', icon: '⛰️' },
    { id: 'transit', label: 'Transit', icon: '🚉' },
];

// Right-click handler
function MapRightClickHandler({ onRightClick }) {
    useMapEvents({
        contextmenu(e) {
            onRightClick(e.latlng);
        }
    });
    return null;
}

export default function MapView({
    routePoints, alternativeRoutes = [], stops, category,
    selectedStop, onSelectStop, onSelectAlternative,
    activeLayer, onLayerChange, onAddCustomWaypoint,
    travelMode = 'driving',
    waypoints = [],
}) {
    const center = [20.5937, 78.9629];

    // Mode-based path styling
    const ROUTE_STYLES = {
        driving: {
            color: '#F7941D',
            outlineColor: '#b85f00',
            weight: 5,
            outlineWeight: 8,
            dashArray: null,
            opacity: 1,
        },
        walking: {
            color: '#10B981',
            outlineColor: '#065f46',
            weight: 4,
            outlineWeight: 7,
            dashArray: '1 10',
            lineCap: 'round',
            opacity: 1,
        },
        cycling: {
            color: '#a855f7',
            outlineColor: '#6b21a8',
            weight: 4,
            outlineWeight: 7,
            dashArray: '12 6',
            lineCap: 'round',
            opacity: 1,
        },
    };
    const routeStyle = ROUTE_STYLES[travelMode] || ROUTE_STYLES.driving;

    const [mapRef, setMapRef] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const handleZoomIn = () => { if (mapRef) mapRef.zoomIn(); };
    const handleZoomOut = () => { if (mapRef) mapRef.zoomOut(); };

    const handleRightClick = (latlng) => {
        setContextMenu(latlng);
    };

    const handleAddCustomWaypoint = async () => {
        if (!contextMenu || !onAddCustomWaypoint) return;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${contextMenu.lat}&lon=${contextMenu.lng}`
            );
            const data = await res.json();
            onAddCustomWaypoint({
                name: data.display_name || `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`,
                lat: contextMenu.lat,
                lng: contextMenu.lng,
                place_id: `custom-${Date.now()}`,
            });
        } catch {
            onAddCustomWaypoint({
                name: `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`,
                lat: contextMenu.lat,
                lng: contextMenu.lng,
                place_id: `custom-${Date.now()}`,
            });
        }
        setContextMenu(null);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer
                center={center}
                zoom={5}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                touchZoom={true}
                ref={setMapRef}
            >
                <DynamicTiles layerId={activeLayer} />
                <MapRightClickHandler onRightClick={handleRightClick} />

                {/* Right-click context menu marker */}
                {contextMenu && (
                    <Marker position={[contextMenu.lat, contextMenu.lng]} zIndexOffset={2000}>
                        <Popup onClose={() => setContextMenu(null)}>
                            <div style={{ fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: '#70757a', marginBottom: 6 }}>
                                    {contextMenu.lat.toFixed(5)}, {contextMenu.lng.toFixed(5)}
                                </div>
                                <button
                                    className="btn-street-view-popup"
                                    onClick={handleAddCustomWaypoint}
                                    style={{ background: 'rgba(13, 144, 79, 0.1)', color: '#0D904F', borderColor: 'rgba(13, 144, 79, 0.25)' }}
                                >
                                    ➕ Add as Waypoint
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Alternative routes (gray, behind main) */}
                {alternativeRoutes.map((alt, idx) => (
                    <Polyline
                        key={`alt-${idx}`}
                        positions={alt.routePoints.map(p => [p.lat, p.lng])}
                        pathOptions={{
                            color: '#9AA0A6',
                            weight: 6,
                            opacity: 0.6,
                            dashArray: '10 8',
                            lineCap: 'round',
                        }}
                        eventHandlers={{
                            click: () => onSelectAlternative && onSelectAlternative(idx),
                        }}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Alternative Route {idx + 1}</div>
                                <div>{alt.distance?.text} · {alt.duration?.text}</div>
                                <div style={{ color: '#1A73E8', cursor: 'pointer', marginTop: 4, fontWeight: 500 }}>
                                    Click to use this route
                                </div>
                            </div>
                        </Popup>
                    </Polyline>
                ))}

                {/* Main route — mode-styled */}
                {routePoints && routePoints.length > 1 && (
                    <>
                        {/* Outline/glow layer */}
                        <Polyline
                            positions={routePoints.map(p => [p.lat, p.lng])}
                            pathOptions={{
                                color: routeStyle.outlineColor,
                                weight: routeStyle.outlineWeight,
                                opacity: 0.35,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        {/* Main line */}
                        <Polyline
                            positions={routePoints.map(p => [p.lat, p.lng])}
                            pathOptions={{
                                color: routeStyle.color,
                                weight: routeStyle.weight,
                                opacity: routeStyle.opacity,
                                lineCap: 'round',
                                lineJoin: 'round',
                                dashArray: routeStyle.dashArray || undefined,
                            }}
                        />
                        <Marker position={[routePoints[0].lat, routePoints[0].lng]} icon={startIcon} zIndexOffset={1000}>
                            <Popup><strong>Start</strong></Popup>
                        </Marker>
                        <Marker position={[routePoints[routePoints.length - 1].lat, routePoints[routePoints.length - 1].lng]} icon={endIcon} zIndexOffset={1000}>
                            <Popup><strong>Destination</strong></Popup>
                        </Marker>
                        <FitBounds routePoints={routePoints} />
                    </>
                )}

                {/* ── User-added Waypoint Markers (amber/orange numbered pins) ── */}
                {waypoints.map((wp, idx) => (
                    <Marker
                        key={wp.place_id || `wp-${idx}`}
                        position={[wp.lat, wp.lng]}
                        icon={makeWaypointIcon(idx)}
                        zIndexOffset={900}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'Inter,sans-serif', maxWidth: 220, lineHeight: 1.5 }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontWeight: 700, fontSize: 13, color: '#F7941D', marginBottom: 4
                                }}>
                                    <span style={{
                                        background: '#F7941D', color: '#fff',
                                        borderRadius: '50%', width: 20, height: 20,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, flexShrink: 0
                                    }}>{idx + 1}</span>
                                    Stop {idx + 1}
                                </div>
                                <div style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{wp.name}</div>
                                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                    Added waypoint · click × in sidebar to remove
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Stop markers (SVG pin) */}
                {stops.map((stop) => (
                    <Marker
                        key={stop.place_id}
                        position={[stop.lat, stop.lng]}
                        icon={createPinIcon(category, selectedStop?.place_id === stop.place_id)}
                        zIndexOffset={selectedStop?.place_id === stop.place_id ? 500 : 1}
                        eventHandlers={{ click: () => onSelectStop(stop) }}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'Inter,sans-serif', maxWidth: 240, lineHeight: 1.5 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, color: '#202124', marginBottom: 4 }}>
                                    {stop.name}
                                </div>
                                {stop.rating && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 4, color: '#70757a' }}>
                                        <span style={{ color: '#fbbc04' }}>{'★'.repeat(Math.round(stop.rating))}</span>
                                        <span>{stop.rating.toFixed(1)}</span>
                                        <span>({stop.user_ratings_total?.toLocaleString()})</span>
                                    </div>
                                )}
                                <div style={{ fontSize: 12, color: '#70757a' }}>{stop.vicinity}</div>
                                {stop.open_now === true && <div style={{ color: '#0D904F', fontWeight: 500, fontSize: 12, marginTop: 4 }}>Open</div>}
                                {stop.open_now === false && <div style={{ color: '#D93025', fontWeight: 500, fontSize: 12, marginTop: 4 }}>Closed</div>}
                                <button
                                    className="btn-street-view-popup"
                                    onClick={() => openStreetView(stop.lat, stop.lng)}
                                >
                                    🛣️ Street View
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* ═══ OVERLAY CONTROLS (absolute positioned over the map) ═══ */}

            {/* Custom Zoom +/- Buttons */}
            <div className="map-zoom-controls">
                <button className="zoom-btn" onClick={handleZoomIn} title="Zoom in">＋</button>
                <button className="zoom-btn" onClick={handleZoomOut} title="Zoom out">－</button>
            </div>

            {/* Map Layer Selector */}
            <div className="map-layer-control">
                {LAYERS.map((layer) => (
                    <button
                        key={layer.id}
                        className={`layer-btn ${activeLayer === layer.id ? 'active' : ''}`}
                        onClick={() => onLayerChange(layer.id)}
                        title={layer.label}
                    >
                        <span className="layer-icon">{layer.icon}</span>
                        <span className="layer-label">{layer.label}</span>
                    </button>
                ))}
            </div>

            {/* Alternative route badges */}
            {alternativeRoutes.length > 0 && (
                <div className="alt-route-badges">
                    {alternativeRoutes.map((alt, idx) => (
                        <button
                            key={alt.id || idx}
                            className="alt-route-badge"
                            onClick={() => onSelectAlternative && onSelectAlternative(idx)}
                        >
                            Alt {idx + 1}: {alt.distance?.text} · {alt.duration?.text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
