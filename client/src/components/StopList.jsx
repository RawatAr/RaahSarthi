import { Star, MapPin, Eye, Plus, Navigation } from 'lucide-react';
import { CATEGORIES } from './FilterPanel';

const CAT_LABELS = {
    restaurant: 'Restaurant', cafe: 'Café', gas_station: 'Petrol Pump',
    ev_charging: 'EV Charging', lodging: 'Hotel', hospital: 'Hospital',
    pharmacy: 'Pharmacy', atm: 'ATM / Bank', parking: 'Parking',
    tourist: 'Attraction', things_to_do: 'Things to Do', museum: 'Museum',
    transit: 'Transit', shopping: 'Shopping', temple: 'Temple',
};

function StarRating({ rating }) {
    return (
        <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={11}
                    strokeWidth={1.5}
                    className={s <= Math.round(rating) ? 'star filled' : 'star empty'}
                    style={{ fill: s <= Math.round(rating) ? '#F59E0B' : 'none', color: s <= Math.round(rating) ? '#F59E0B' : '#D1D5DB' }}
                />
            ))}
        </div>
    );
}

function openStreetView(lat, lng) {
    window.open(
        `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`,
        '_blank'
    );
}

function getCatInfo(category) {
    return CATEGORIES.find(c => c.key === category) || { color: '#6B7280' };
}

export default function StopList({ stops, category, loading, selectedStop, onSelectStop, onAddWaypoint, routeData }) {
    if (loading) {
        return (
            <div className="empty-state fade-in">
                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                <div className="empty-state-title">Searching along route…</div>
                <div className="empty-state-desc">Filtering places within your corridor</div>
            </div>
        );
    }

    if (!routeData) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon-wrap">
                    <Navigation size={28} color="#9AA0A6" strokeWidth={1.5} />
                </div>
                <div className="empty-state-title">No route yet</div>
                <div className="empty-state-desc">Enter your origin and destination above to discover stops along your journey.</div>
            </div>
        );
    }

    if (!stops || stops.length === 0) {
        return (
            <div className="empty-state fade-in">
                <div className="empty-state-icon-wrap">
                    <MapPin size={28} color="#9AA0A6" strokeWidth={1.5} />
                </div>
                <div className="empty-state-title">No {CAT_LABELS[category] || 'stops'} found</div>
                <div className="empty-state-desc">Try increasing the corridor radius or lowering the minimum rating filter.</div>
            </div>
        );
    }

    const catInfo = getCatInfo(category);
    const CatIcon = catInfo.Icon;

    return (
        <div>
            <div className="stop-list-header">
                <div className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {CatIcon && <CatIcon size={14} color={catInfo.color} strokeWidth={2} />}
                    {CAT_LABELS[category] || 'Stops'}
                </div>
                <span className="stop-count">{stops.length} found</span>
            </div>

            <div className="stop-list">
                {stops.map((stop) => (
                    <div
                        key={stop.place_id}
                        className={`stop-card fade-in ${selectedStop?.place_id === stop.place_id ? 'selected' : ''}`}
                        onClick={() => onSelectStop(stop)}
                    >
                        <div className="stop-card-accent" style={{ background: catInfo.color }} />

                        <div className="stop-header">
                            <div className="stop-name">{stop.name}</div>
                            <div className="stop-badges">
                                {stop.open_now === true && <span className="badge badge-open">Open</span>}
                                {stop.open_now === false && <span className="badge badge-closed">Closed</span>}
                            </div>
                        </div>

                        {stop.rating && (
                            <div className="stop-meta">
                                <span className="rating-text">{stop.rating.toFixed(1)}</span>
                                <StarRating rating={stop.rating} />
                                <span className="rating-count">({stop.user_ratings_total?.toLocaleString()})</span>
                            </div>
                        )}

                        {stop.vicinity && (
                            <div className="stop-vicinity">
                                <MapPin size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
                                {stop.vicinity}
                            </div>
                        )}

                        <div className="stop-actions">
                            <button
                                className="btn btn-sm btn-street-view"
                                onClick={(e) => { e.stopPropagation(); openStreetView(stop.lat, stop.lng); }}
                                title="Open in Google Street View"
                            >
                                <Eye size={13} strokeWidth={2} />
                                Street View
                            </button>
                            <button
                                className="btn btn-sm btn-success"
                                onClick={(e) => { e.stopPropagation(); onAddWaypoint(stop); }}
                            >
                                <Plus size={13} strokeWidth={2.5} />
                                Add to Route
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
