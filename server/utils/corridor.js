const { haversineMeters } = require('./polyline');

/**
 * Calculates the perpendicular distance (in meters) from a point to a line segment.
 */
function pointToSegmentDistance(point, segA, segB) {
    const R = 6371000;

    // Convert to radians and approximate Cartesian for small distances
    const lat = toRad(point.lat);
    const lng = toRad(point.lng);
    const aLat = toRad(segA.lat);
    const aLng = toRad(segA.lng);
    const bLat = toRad(segB.lat);
    const bLng = toRad(segB.lng);

    // Project onto plane relative to segA
    const px = (lng - aLng) * Math.cos((lat + aLat) / 2) * R;
    const py = (lat - aLat) * R;
    const dx = (bLng - aLng) * Math.cos((bLat + aLat) / 2) * R;
    const dy = (bLat - aLat) * R;

    const segLenSq = dx * dx + dy * dy;
    if (segLenSq === 0) return haversineMeters(point, segA);

    let t = (px * dx + py * dy) / segLenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = t * dx;
    const closestY = t * dy;
    const distX = px - closestX;
    const distY = py - closestY;

    return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Returns true if `place` lies within `thresholdMeters` of any segment of the decoded route.
 */
function isWithinCorridor(place, decodedPath, thresholdMeters) {
    const point = { lat: place.geometry.location.lat, lng: place.geometry.location.lng };

    for (let i = 0; i < decodedPath.length - 1; i++) {
        const dist = pointToSegmentDistance(point, decodedPath[i], decodedPath[i + 1]);
        if (dist <= thresholdMeters) return true;
    }
    return false;
}

/**
 * Rule-based intelligent break suggestion.
 * Returns an array of suggestion objects based on route duration.
 */
function suggestBreaks(durationSeconds) {
    const hours = durationSeconds / 3600;
    const suggestions = [];

    if (hours >= 1.5) {
        suggestions.push({
            type: 'restaurant',
            icon: '🍽️',
            title: 'Food Break Recommended',
            reason: `Your journey is ${formatDuration(durationSeconds)} long. A food/tea break is advisable.`,
            category: 'restaurant',
        });
    }

    if (hours >= 3) {
        suggestions.push({
            type: 'gas_station',
            icon: '⛽',
            title: 'Fuel Check Recommended',
            reason: `For journeys over 3 hours, checking fuel levels is strongly advised.`,
            category: 'gas_station',
        });
    }

    if (hours >= 5) {
        suggestions.push({
            type: 'lodging',
            icon: '🏨',
            title: 'Rest Stop / Hotel Suggested',
            reason: `Your journey exceeds 5 hours. Consider an overnight stop or rest point.`,
            category: 'lodging',
        });

        suggestions.push({
            type: 'hospital',
            icon: '🏥',
            title: 'Medical Facility Awareness',
            reason: `For very long journeys, it's wise to note hospitals along the route.`,
            category: 'hospital',
        });
    }

    return suggestions;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
}

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

module.exports = { isWithinCorridor, suggestBreaks, pointToSegmentDistance };
