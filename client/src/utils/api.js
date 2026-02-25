import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function fetchRoute(origin, destination, waypoints = [], mode = 'driving') {
    const { data } = await axios.post(`${BASE}/api/route`, {
        origin,
        destination,
        waypoints,
        mode,
    });
    return data;
}

export async function fetchPlaces({ routePoints, category, minRating, openNow, corridorMeters }) {
    const { data } = await axios.post(`${BASE}/api/places`, {
        routePoints,
        category,
        minRating,
        openNow,
        corridorMeters,
    });
    return data;
}

// Geocode through backend proxy (avoids CORS issues)
export async function geocodeAddress(address) {
    const { data } = await axios.get(`${BASE}/api/geocode`, {
        params: { q: address },
    });
    return data;
}
