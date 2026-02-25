/**
 * Google Encoded Polyline Decoder
 * Decodes an encoded polyline string into an array of {lat, lng} objects.
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Sample points from a decoded polyline at roughly `stepMeters` intervals.
 */
function samplePolyline(points, stepMeters = 5000) {
  if (!points || points.length === 0) return [];
  const sampled = [points[0]];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    accumulated += haversineMeters(points[i - 1], points[i]);
    if (accumulated >= stepMeters) {
      sampled.push(points[i]);
      accumulated = 0;
    }
  }

  // Always include last point
  const last = points[points.length - 1];
  const prev = sampled[sampled.length - 1];
  if (prev.lat !== last.lat || prev.lng !== last.lng) {
    sampled.push(last);
  }

  return sampled;
}

/**
 * Haversine distance between two {lat,lng} points in meters.
 */
function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

module.exports = { decodePolyline, samplePolyline, haversineMeters };
