const express = require('express');
const router = express.Router();
const axios = require('axios');
const { isWithinCorridor } = require('../utils/corridor');

// Category keyword mapping for SerpAPI Google Maps search
const CATEGORY_MAP = {
    restaurant: 'restaurants food',
    cafe: 'cafe coffee shop',
    gas_station: 'petrol pump gas station',
    ev_charging: 'ev charging station',
    lodging: 'hotels lodging',
    hospital: 'hospitals clinics',
    pharmacy: 'pharmacy medical store',
    atm: 'atm bank',
    parking: 'parking lot',
    tourist: 'tourist attraction landmark',
    things_to_do: 'things to do activities entertainment',
    museum: 'museum art gallery heritage',
    transit: 'railway station bus stop metro station',
    shopping: 'shopping mall market bazaar',
    temple: 'temple mandir gurudwara mosque church',
};

// POST /api/places
// Body: { routePoints, category, minRating, openNow, corridorMeters }
router.post('/', async (req, res) => {
    try {
        const {
            routePoints,
            category = 'restaurant',
            minRating = 0,
            openNow = false,
            corridorMeters = 2000,
        } = req.body;

        if (!routePoints || routePoints.length < 2) {
            return res.status(400).json({ error: 'Route points are required.' });
        }

        const apiKey = process.env.SERPAPI_KEY;
        const searchQuery = CATEGORY_MAP[category] || 'restaurant';

        // Sample search points every ~50km along route
        const searchPoints = sampleAtInterval(routePoints, 50000);
        // Limit to avoid burning SerpAPI credits
        const limited = searchPoints.slice(0, 5);

        const seen = new Set();
        const allPlaces = [];

        // Fetch places for each search point using SerpAPI Google Maps
        const fetchPromises = limited.map(async (point) => {
            try {
                const params = {
                    engine: 'google_maps',
                    q: searchQuery,
                    ll: `@${point.lat},${point.lng},14z`,
                    type: 'search',
                    api_key: apiKey,
                };

                const { data } = await axios.get('https://serpapi.com/search.json', { params });

                if (data.local_results) {
                    return data.local_results;
                }
                return [];
            } catch (err) {
                console.warn('[placesApi] Search point failed:', err.message);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);

        for (const batch of results) {
            for (const place of batch) {
                const id = place.place_id || place.data_id || place.title;
                if (!seen.has(id)) {
                    seen.add(id);
                    allPlaces.push(place);
                }
            }
        }

        // Normalize place data and filter by corridor
        const normalized = allPlaces
            .filter((p) => p.gps_coordinates)
            .map((p) => ({
                place_id: p.place_id || p.data_id || p.title,
                name: p.title || p.name || 'Unknown',
                rating: p.rating || null,
                user_ratings_total: p.reviews || 0,
                vicinity: p.address || '',
                open_now: p.open_state
                    ? (p.open_state.toLowerCase().includes('open') ? true :
                        p.open_state.toLowerCase().includes('close') ? false : null)
                    : null,
                lat: p.gps_coordinates.latitude,
                lng: p.gps_coordinates.longitude,
                types: p.type ? [p.type] : [],
                thumbnail: p.thumbnail || null,
                geometry: {
                    location: {
                        lat: p.gps_coordinates.latitude,
                        lng: p.gps_coordinates.longitude,
                    }
                }
            }));

        // Filter by corridor
        const corridorFiltered = normalized.filter((place) =>
            isWithinCorridor(place, routePoints, corridorMeters)
        );

        // Filter by rating
        const ratingFiltered = corridorFiltered.filter(
            (p) => (p.rating || 0) >= minRating
        );

        // Filter by open now
        const openFiltered = openNow
            ? ratingFiltered.filter((p) => p.open_now === true)
            : ratingFiltered;

        // Sort by rating descending
        openFiltered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        // Clean response (remove geometry helper)
        const result = openFiltered.map(({ geometry, ...rest }) => rest);

        res.json({ places: result, total: result.length });
    } catch (err) {
        console.error('[placesApi] Error:', err.message);
        res.status(500).json({ error: 'Failed to search places.', details: err.message });
    }
});

function sampleAtInterval(points, intervalMeters) {
    if (!points.length) return [];
    const sampled = [points[0]];
    let accum = 0;

    for (let i = 1; i < points.length; i++) {
        accum += haversineMeters(points[i - 1], points[i]);
        if (accum >= intervalMeters) {
            sampled.push(points[i]);
            accum = 0;
        }
    }

    const last = points[points.length - 1];
    const prev = sampled[sampled.length - 1];
    if (Math.abs(prev.lat - last.lat) > 0.0001 || Math.abs(prev.lng - last.lng) > 0.0001) {
        sampled.push(last);
    }

    // Always include at least the midpoint
    if (sampled.length < 2 && points.length >= 2) {
        sampled.push(points[Math.floor(points.length / 2)]);
        sampled.push(points[points.length - 1]);
    }

    return sampled;
}

function haversineMeters(a, b) {
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const x = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

module.exports = router;
