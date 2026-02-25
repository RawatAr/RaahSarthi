import { useState, useCallback, useEffect, useRef } from 'react';
import { Navigation2, Sun, Moon, AlertTriangle, X, BarChart2, CloudSun, Lightbulb, SlidersHorizontal, User, Globe } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import RouteInfo from './components/RouteInfo';
import StopList from './components/StopList';
import FilterPanel from './components/FilterPanel';
import BreakSuggestions from './components/BreakSuggestions';
import WeatherWidget from './components/WeatherWidget';
import DirectionsPanel from './components/DirectionsPanel';
import ElevationProfile from './components/ElevationProfile';
import SavedRoutes from './components/SavedRoutes';
import TravelModeSelector from './components/TravelModeSelector';
import AuthModal from './components/AuthModal';
import { fetchRoute, fetchPlaces } from './utils/api';

const DEFAULT_FILTERS = {
  category: 'restaurant',
  minRating: 0,
  openNow: false,
  corridorMeters: 2000,
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { lang, t, toggleLang } = useLanguage();
  const [routeData, setRouteData] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [waypoints, setWaypoints] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originStr, setOriginStr] = useState('');
  const [destStr, setDestStr] = useState('');
  const originRef = useRef('');
  const destRef = useRef('');
  const [activeLayer, setActiveLayer] = useState('default');
  const [travelMode, setTravelMode] = useState('driving');
  const travelModeRef = useRef('driving');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('raahsarthi_user')); } catch { return null; }
  });
  const [showAuth, setShowAuth] = useState(false);

  // Auto-verify JWT token on mount
  useEffect(() => {
    const token = localStorage.getItem('raahsarthi_token');
    if (token && !user) {
      fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setUser(d.user); })
        .catch(() => { });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('raahsarthi_token');
    localStorage.removeItem('raahsarthi_user');
    setUser(null);
  };

  // ── Fetch route from backend ──
  const doSearch = useCallback(async (origin, destination, wps = waypoints) => {
    setError(null);
    setRouteLoading(true);
    setStops([]);
    setSelectedStop(null);
    setAlternativeRoutes([]);

    try {
      const waypointStrs = wps.map((w) => `${w.lat},${w.lng}`);
      const data = await fetchRoute(origin, destination, waypointStrs, travelModeRef.current);

      setRouteData(data);
      setRoutePoints(data.routePoints || []);
      setAlternativeRoutes(data.alternativeRoutes || []);
      setOriginStr(origin); originRef.current = origin;
      setDestStr(destination); destRef.current = destination;

      // Auto-fetch stops
      setStopsLoading(true);
      const placesData = await fetchPlaces({
        routePoints: data.routePoints,
        ...filters,
      });
      setStops(placesData.places || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || 'Something went wrong.');
    } finally {
      setRouteLoading(false);
      setStopsLoading(false);
    }
  }, [filters, waypoints]);

  // ── Re-fetch places when filters change ──
  useEffect(() => {
    if (!routeData || !routePoints.length) return;
    const fetchP = async () => {
      setStopsLoading(true);
      setSelectedStop(null);
      try {
        const data = await fetchPlaces({ routePoints, ...filters });
        setStops(data.places || []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message);
      } finally {
        setStopsLoading(false);
      }
    };
    fetchP();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Switch to alternative route ──
  const handleSelectAlternative = useCallback((idx) => {
    const alt = alternativeRoutes[idx];
    if (!alt) return;
    const newAlts = [
      { id: 'prev-main', routePoints, distance: routeData.distance, duration: routeData.duration },
      ...alternativeRoutes.filter((_, i) => i !== idx),
    ];
    setRoutePoints(alt.routePoints);
    setAlternativeRoutes(newAlts);
    setRouteData(prev => ({
      ...prev,
      routePoints: alt.routePoints,
      distance: alt.distance,
      duration: alt.duration,
    }));
    setStopsLoading(true);
    fetchPlaces({ routePoints: alt.routePoints, ...filters })
      .then(data => setStops(data.places || []))
      .catch(() => { })
      .finally(() => setStopsLoading(false));
  }, [alternativeRoutes, routePoints, routeData, filters]);

  // ── Add waypoint (from stop card or map right-click) ──
  const handleAddWaypoint = useCallback((stop) => {
    const updated = [...waypoints, stop];
    setWaypoints(updated);
    if (originStr && destStr) doSearch(originStr, destStr, updated);
  }, [waypoints, originStr, destStr, doSearch]);

  // ── Remove waypoint ──
  const handleRemoveWaypoint = useCallback((idx) => {
    const updated = waypoints.filter((_, i) => i !== idx);
    setWaypoints(updated);
    if (originStr && destStr) doSearch(originStr, destStr, updated);
  }, [waypoints, originStr, destStr, doSearch]);

  // ── Reorder waypoints (drag) ──
  const handleReorderWaypoints = useCallback((reordered) => {
    setWaypoints(reordered);
    if (originStr && destStr) doSearch(originStr, destStr, reordered);
  }, [originStr, destStr, doSearch]);

  // ── Load saved route ──
  const handleLoadSavedRoute = useCallback((origin, dest) => {
    setWaypoints([]);
    doSearch(origin, dest, []);
  }, [doSearch]);

  // ── Suggestion clicked ──
  const handleSuggestFilter = useCallback((category) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  // ── Escape key to close error ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setError(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const hasBreaks = routeData?.breakSuggestions?.length > 0;

  return (
    <div className="app-layout">
      {/* ── Full-screen Map ── */}
      <div className="map-container">
        {routeLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <div className="loading-text">Calculating route…</div>
          </div>
        )}

        <MapView
          routePoints={routePoints}
          alternativeRoutes={alternativeRoutes}
          stops={stops}
          category={filters.category}
          selectedStop={selectedStop}
          onSelectStop={setSelectedStop}
          onSelectAlternative={handleSelectAlternative}
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          onAddCustomWaypoint={handleAddWaypoint}
          travelMode={travelMode}
          waypoints={waypoints}
        />

        {!routeData && !routeLoading && (
          <div className="map-overlay-info">
            🗺️ Search a route to discover stops along the way
            <div className="map-overlay-hint">💡 Tip: Right-click on the map to add a custom waypoint</div>
          </div>
        )}
      </div>

      {/* ── Floating Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-row">
            <div className="brand">
              <div className="brand-logo">
                <Navigation2 size={20} strokeWidth={2.5} color="#fff" />
              </div>
              <div>
                <div className="brand-name"><span style={{ color: '#F7941D' }}>Raah</span><span style={{ color: 'var(--text-primary)' }}>Sarthi</span></div>
                <div className="brand-tagline">Smart stops. Smarter journeys.</div>
              </div>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark'
                ? <Sun size={16} strokeWidth={2} color="#F59E0B" />
                : <Moon size={16} strokeWidth={2} color="#6366F1" />}
            </button>
            <button className="lang-btn" onClick={toggleLang} title={t.lang.label}>
              <Globe size={13} strokeWidth={2} />{t.lang.toggle}
            </button>
            <button
              className={`auth-btn ${user ? 'auth-btn-signed' : ''}`}
              onClick={user ? handleLogout : () => setShowAuth(true)}
              title={user ? `${user.name} — click to sign out` : 'Sign In'}
            >
              <User size={13} strokeWidth={2} />
              {user ? user.name.split(' ')[0] : 'Sign In'}
            </button>
          </div>

          <TravelModeSelector
            mode={travelMode}
            onChange={(m) => {
              setTravelMode(m);
              travelModeRef.current = m;
              // Use refs so we always re-route with the LATEST origin/dest, never stale closures
              if (originRef.current && destRef.current) {
                doSearch(originRef.current, destRef.current, waypoints);
              }
            }}
            lang={lang}
          />
          <SearchPanel
            onSearch={(o, d) => {
              setWaypoints([]);
              doSearch(o, d, []);
            }}
            loading={routeLoading}
            lang={lang}
            t={t.search}
          />
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}

        <div className="sidebar-scroll">
          {error && <div className="error-banner" onClick={() => setError(null)}>
            <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
            {error}
            <X size={14} strokeWidth={2} style={{ marginLeft: 'auto', flexShrink: 0, cursor: 'pointer' }} />
          </div>}

          {/* Saved Routes */}
          <SavedRoutes routeData={routeData} onLoadRoute={handleLoadSavedRoute} />

          {routeData && (
            <>
              <div className="section">
                <div className="section-title">
                  <BarChart2 size={13} strokeWidth={2.5} color="var(--accent)" />Route Summary
                </div>
              </div>
              <RouteInfo
                routeData={routeData}
                waypoints={waypoints}
                onRemoveWaypoint={handleRemoveWaypoint}
                onReorderWaypoints={handleReorderWaypoints}
              />

              {/* Weather Widget */}
              {routeData.startCoords && routeData.endCoords && (
                <>
                  <div className="divider" style={{ margin: '0 16px' }} />
                  <div className="section">
                    <div className="section-title">
                      <CloudSun size={13} strokeWidth={2.5} color="#F59E0B" />Weather
                    </div>
                  </div>
                  <WeatherWidget
                    startCoords={routeData.startCoords}
                    endCoords={routeData.endCoords}
                    startLabel={routeData.startAddress}
                    endLabel={routeData.endAddress}
                  />
                </>
              )}

              {/* Elevation Profile */}
              <div className="divider" style={{ margin: '0 16px' }} />
              <div style={{ padding: '0 16px' }}>
                <ElevationProfile routePoints={routePoints} />
              </div>

              {/* Turn-by-Turn Directions */}
              {routeData.steps && routeData.steps.length > 0 && (
                <>
                  <div className="divider" style={{ margin: '0 16px' }} />
                  <div style={{ padding: '0 16px' }}>
                    <DirectionsPanel steps={routeData.steps} />
                  </div>
                </>
              )}

              <div className="divider" style={{ margin: '0 16px' }} />
            </>
          )}

          {hasBreaks && (
            <>
              <div className="section">
                <div className="section-title">
                  <Lightbulb size={13} strokeWidth={2.5} color="#F59E0B" />Smart Suggestions
                </div>
              </div>
              <BreakSuggestions
                suggestions={routeData.breakSuggestions}
                onSuggestFilter={handleSuggestFilter}
              />
              <div className="divider" style={{ margin: '0 16px' }} />
            </>
          )}

          <div className="section">
            <div className="section-title">
              <SlidersHorizontal size={13} strokeWidth={2.5} color="var(--text-muted)" />Filters
            </div>
          </div>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            disabled={!routeData || stopsLoading}
          />

          <div className="divider" />

          <StopList
            stops={stops}
            category={filters.category}
            loading={stopsLoading}
            selectedStop={selectedStop}
            onSelectStop={setSelectedStop}
            onAddWaypoint={handleAddWaypoint}
            routeData={routeData}
          />
        </div>
      </aside>
    </div>
  );
}
