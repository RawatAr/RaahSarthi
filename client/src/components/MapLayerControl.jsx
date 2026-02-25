import { useTheme } from '../context/ThemeContext';

const LAYERS = [
    { id: 'default', label: 'Map', icon: '🗺️' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' },
    { id: 'terrain', label: 'Terrain', icon: '⛰️' },
    { id: 'transit', label: 'Transit', icon: '🚉' },
];

export default function MapLayerControl({ activeLayer, onLayerChange }) {
    const { theme } = useTheme();

    return (
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
    );
}

// Returns tile URL and attribution for each layer
export function getTileConfig(layerId, theme) {
    switch (layerId) {
        case 'satellite':
            return {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: '&copy; Esri, Maxar, Earthstar',
                className: '',
                maxZoom: 18,
            };
        case 'terrain':
            return {
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
                className: theme === 'dark' ? 'dark-tiles' : '',
                maxZoom: 17,
            };
        case 'transit':
            return {
                url: 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38',
                attribution: '&copy; <a href="https://thunderforest.com">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
                className: theme === 'dark' ? 'dark-tiles' : '',
                maxZoom: 19,
            };
        default: // 'default'
            return {
                url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                className: theme === 'dark' ? 'dark-tiles' : '',
                maxZoom: 19,
            };
    }
}
