import {
    UtensilsCrossed, Coffee, Fuel, Zap, Hotel, PlusCircle, Pill,
    Landmark, ParkingCircle, Tent, Theater, Building2, TrainFront,
    ShoppingBag, Church, Star
} from 'lucide-react';


const CATEGORIES = [
    { key: 'restaurant', Icon: UtensilsCrossed, label: 'Food', color: '#F97316' },
    { key: 'cafe', Icon: Coffee, label: 'Cafés', color: '#92400E' },
    { key: 'gas_station', Icon: Fuel, label: 'Fuel', color: '#EF4444' },
    { key: 'ev_charging', Icon: Zap, label: 'EV', color: '#10B981' },
    { key: 'lodging', Icon: Hotel, label: 'Hotels', color: '#6366F1' },
    { key: 'hospital', Icon: PlusCircle, label: 'Hospital', color: '#DC2626' },
    { key: 'pharmacy', Icon: Pill, label: 'Pharma', color: '#7C3AED' },
    { key: 'atm', Icon: Landmark, label: 'ATM', color: '#0EA5E9' },
    { key: 'parking', Icon: ParkingCircle, label: 'Parking', color: '#0284C7' },
    { key: 'tourist', Icon: Tent, label: 'Tourist', color: '#F59E0B' },
    { key: 'things_to_do', Icon: Theater, label: 'Fun', color: '#EC4899' },
    { key: 'museum', Icon: Building2, label: 'Museum', color: '#8B5CF6' },
    { key: 'transit', Icon: TrainFront, label: 'Transit', color: '#14B8A6' },
    { key: 'shopping', Icon: ShoppingBag, label: 'Shop', color: '#F43F5E' },
    { key: 'temple', Icon: Church, label: 'Temple', color: '#A78BFA' },
];

const CORRIDOR_OPTIONS = [
    { label: '500 m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km', value: 2000 },
    { label: '5 km', value: 5000 },
];

export { CATEGORIES };

export default function FilterPanel({ filters, onChange, disabled }) {
    const update = (key, val) => onChange({ ...filters, [key]: val });

    return (
        <div className="filter-panel">
            <div className="section-label">Stop Category</div>
            <div className="category-grid">
                {CATEGORIES.map(({ key, Icon, label, color }) => {
                    const active = filters.category === key;
                    return (
                        <button
                            key={key}
                            className={`category-btn ${active ? 'active' : ''}`}
                            style={active ? { '--cat-color': color } : { '--cat-color': color }}
                            onClick={() => update('category', key)}
                            disabled={disabled}
                        >
                            <span className="cat-icon-wrap" style={{ background: active ? color : `${color}18` }}>
                                <Icon size={15} color={active ? '#fff' : color} strokeWidth={2} />
                            </span>
                            <span className="cat-label">{label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="filter-row">
                <span className="filter-label">
                    <Star size={13} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 4, color: '#F59E0B' }} />
                    Min Rating
                </span>
                <input
                    type="range"
                    min={0} max={5} step={0.5}
                    value={filters.minRating}
                    onChange={(e) => update('minRating', parseFloat(e.target.value))}
                    disabled={disabled}
                />
                <span className="filter-value">
                    {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                </span>
            </div>

            <div className="filter-row">
                <span className="filter-label">Corridor</span>
                <select
                    className="styled-select"
                    value={filters.corridorMeters}
                    onChange={(e) => update('corridorMeters', parseInt(e.target.value))}
                    disabled={disabled}
                >
                    {CORRIDOR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            <div className="filter-row">
                <span className="filter-label">Open Now Only</span>
                <div className="toggle-wrapper">
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={filters.openNow}
                            onChange={(e) => update('openNow', e.target.checked)}
                            disabled={disabled}
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>
        </div>
    );
}
