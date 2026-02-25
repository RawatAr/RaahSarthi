import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Trash2, ChevronDown, ChevronRight, Route, Plus } from 'lucide-react';

const STORAGE_KEY = 'raahsarthi_saved_routes';

function loadSavedRoutes() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function persistRoutes(routes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function SavedRoutes({ routeData, onLoadRoute }) {
    const [saved, setSaved] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    useEffect(() => { setSaved(loadSavedRoutes()); }, []);

    const handleSave = () => {
        if (!routeData) return;
        const entry = {
            id: Date.now(),
            origin: routeData.startAddress,
            destination: routeData.endAddress,
            distance: routeData.distance?.text,
            duration: routeData.duration?.text,
            savedAt: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            originStr: routeData.startAddress,
            destStr: routeData.endAddress,
        };
        const updated = [entry, ...saved].slice(0, 10);
        setSaved(updated);
        persistRoutes(updated);
        setJustSaved(true);
        setExpanded(true);
        setTimeout(() => setJustSaved(false), 2000);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        const updated = saved.filter(r => r.id !== id);
        setSaved(updated);
        persistRoutes(updated);
    };

    const handleLoad = (route) => {
        onLoadRoute(route.originStr, route.destStr);
    };

    return (
        <div className="saved-routes-panel">
            <div className="saved-routes-header" onClick={() => setExpanded(!expanded)}>
                <span className="saved-routes-title">
                    <Route size={13} strokeWidth={2.5} color="var(--accent)" />
                    Saved Routes {saved.length > 0 && <span className="saved-count-badge">{saved.length}</span>}
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {routeData && (
                        <button
                            className="btn-save-route"
                            onClick={(e) => { e.stopPropagation(); handleSave(); }}
                            title="Save current route"
                        >
                            {justSaved
                                ? <><BookmarkCheck size={12} strokeWidth={2.5} /> Saved!</>
                                : <><Plus size={12} strokeWidth={2.5} /> Save</>}
                        </button>
                    )}
                    {expanded
                        ? <ChevronDown size={13} strokeWidth={2} color="var(--text-muted)" />
                        : <ChevronRight size={13} strokeWidth={2} color="var(--text-muted)" />}
                </div>
            </div>

            {expanded && (
                <div className="saved-routes-list">
                    {saved.length === 0 ? (
                        <div className="saved-routes-empty">
                            <Bookmark size={20} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 6px', display: 'block' }} />
                            No saved routes yet. Search a route and click "Save".
                        </div>
                    ) : (
                        saved.map(route => (
                            <div key={route.id} className="saved-route-card" onClick={() => handleLoad(route)}>
                                <div className="saved-route-dot start" />
                                <div className="saved-route-info">
                                    <div className="saved-route-endpoints">
                                        <span className="saved-route-from">{truncate(route.origin, 28)}</span>
                                        <span className="saved-route-arrow">→</span>
                                        <span className="saved-route-to">{truncate(route.destination, 28)}</span>
                                    </div>
                                    <div className="saved-route-meta">
                                        {route.distance} · {route.duration} · {route.savedAt}
                                    </div>
                                </div>
                                <button
                                    className="saved-route-delete"
                                    onClick={(e) => handleDelete(route.id, e)}
                                    title="Delete"
                                >
                                    <Trash2 size={13} strokeWidth={2} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
