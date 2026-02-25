const express = require('express');
const router = express.Router();
const axios = require('axios');
const { suggestBreaks } = require('../utils/corridor');

// POST /api/route
// Body: { origin, destination, waypoints: [] }
router.post('/', async (req, res) => {
    try {
        const { origin, destination, waypoints = [], mode = 'driving' } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required.' });
        }

        // Step 1: Geocode origin and destination using Nominatim (free)
        const [startGeo, endGeo] = await Promise.all([
            geocodeViaNominatim(origin),
            geocodeViaNominatim(destination),
        ]);

        if (!startGeo || !endGeo) {
            return res.status(400).json({ error: 'Could not find one or both locations. Try more specific names.' });
        }

        // Build coords array: start + waypoints + end
        const allCoords = [startGeo];
        for (const wp of waypoints) {
            if (typeof wp === 'string' && wp.includes(',')) {
                const parts = wp.split(',');
                allCoords.push({ lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) });
            } else if (typeof wp === 'object' && wp.lat && wp.lng) {
                allCoords.push(wp);
            }
        }
        allCoords.push(endGeo);

        // Step 2: Get route from OSRM with alternatives
        const osrmProfile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'driving';
        const coordString = allCoords.map(c => `${c.lng},${c.lat}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordString}?overview=full&geometries=geojson&steps=true&alternatives=3`;


        const { data: osrmData } = await axios.get(osrmUrl, { timeout: 15000 });

        if (!osrmData.routes || osrmData.routes.length === 0) {
            return res.status(400).json({ error: 'No route found between these locations.' });
        }

        const bestRoute = osrmData.routes[0];

        // Extract main route polyline
        const routePoints = bestRoute.geometry.coordinates.map(c => ({
            lat: c[1],
            lng: c[0],
        }));

        // Extract alternative routes
        const alternativeRoutes = osrmData.routes.slice(1).map((route, idx) => ({
            id: `alt-${idx}`,
            routePoints: route.geometry.coordinates.map(c => ({
                lat: c[1],
                lng: c[0],
            })),
            distance: { text: formatDistance(Math.round(route.distance)) },
            duration: { text: formatDuration(Math.round(route.duration)), value: Math.round(route.duration) },
        }));

        // Duration & distance
        const durationSeconds = Math.round(bestRoute.duration);
        const distanceMeters = Math.round(bestRoute.distance);

        const durationText = formatDuration(durationSeconds);
        const distanceText = formatDistance(distanceMeters);

        // Break suggestions
        const breakSuggestions = suggestBreaks(durationSeconds);

        // Extract turn-by-turn steps from OSRM
        const steps = [];
        if (bestRoute.legs) {
            bestRoute.legs.forEach(leg => {
                if (leg.steps) {
                    leg.steps.forEach(step => {
                        steps.push({
                            name: step.name || '',
                            distance: Math.round(step.distance),
                            duration: Math.round(step.duration),
                            maneuver: step.maneuver || {},
                        });
                    });
                }
            });
        }

        res.json({
            routePoints,
            alternativeRoutes,
            steps,
            startAddress: startGeo.display_name || origin,
            endAddress: endGeo.display_name || destination,
            startCoords: routePoints[0],
            endCoords: routePoints[routePoints.length - 1],
            distance: { text: distanceText },
            duration: { text: durationText, value: durationSeconds },
            breakSuggestions,
        });
    } catch (err) {
        console.error('[routeApi] Error:', err.message);
        res.status(500).json({
            error: 'Failed to get route. Please check your locations.',
            details: err.message,
        });
    }
});

// Geocode via Nominatim (backend — no CORS issues)
async function geocodeViaNominatim(address) {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: address, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'RaahSarthi/1.0' },
        timeout: 5000,
    });
    if (data && data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            display_name: data[0].display_name,
        };
    }
    return null;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} hr ${mins} min`;
    return `${mins} min`;
}

function formatDistance(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
}

module.exports = router;
