import { useEffect, useState, useRef } from 'react';

// Sample route points at regular intervals for elevation
function samplePoints(routePoints, count = 50) {
    if (!routePoints || routePoints.length < 2) return [];
    const step = Math.max(1, Math.floor(routePoints.length / count));
    const sampled = [];
    for (let i = 0; i < routePoints.length; i += step) {
        sampled.push(routePoints[i]);
    }
    // Always include last point
    if (sampled[sampled.length - 1] !== routePoints[routePoints.length - 1]) {
        sampled.push(routePoints[routePoints.length - 1]);
    }
    return sampled;
}

// Calculate distance between two lat/lng points in km (Haversine)
function haversine(p1, p2) {
    const R = 6371;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ElevationProfile({ routePoints }) {
    const [elevationData, setElevationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [hoverIdx, setHoverIdx] = useState(-1);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!routePoints || routePoints.length < 2) return;

        const fetchElevation = async () => {
            setLoading(true);
            try {
                const sampled = samplePoints(routePoints, 60);
                const lats = sampled.map(p => p.lat);
                const lngs = sampled.map(p => p.lng);

                const res = await fetch(
                    `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lngs.join(',')}`
                );
                const data = await res.json();

                if (data.elevation) {
                    // Calculate cumulative distance
                    let cumDist = 0;
                    const points = data.elevation.map((elev, i) => {
                        if (i > 0) cumDist += haversine(sampled[i - 1], sampled[i]);
                        return { distance: cumDist, elevation: elev, lat: sampled[i].lat, lng: sampled[i].lng };
                    });
                    setElevationData(points);
                }
            } catch (err) {
                console.error('Elevation fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchElevation();
    }, [routePoints]);

    // Draw chart on canvas
    useEffect(() => {
        if (!elevationData || !canvasRef.current || !expanded) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const W = canvas.width = canvas.offsetWidth * 2;
        const H = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        const w = W / 2;
        const h = H / 2;

        const padding = { top: 18, right: 12, bottom: 28, left: 40 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        const elevs = elevationData.map(p => p.elevation);
        const dists = elevationData.map(p => p.distance);
        const minE = Math.min(...elevs) - 20;
        const maxE = Math.max(...elevs) + 20;
        const maxD = Math.max(...dists);

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(128,128,128,0.15)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH * i) / 4;
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
        }

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        gradient.addColorStop(0, 'rgba(66, 133, 244, 0.35)');
        gradient.addColorStop(1, 'rgba(66, 133, 244, 0.02)');

        const xScale = (d) => padding.left + (d / maxD) * chartW;
        const yScale = (e) => padding.top + chartH - ((e - minE) / (maxE - minE)) * chartH;

        // Fill area
        ctx.beginPath();
        ctx.moveTo(xScale(dists[0]), h - padding.bottom);
        elevationData.forEach(p => ctx.lineTo(xScale(p.distance), yScale(p.elevation)));
        ctx.lineTo(xScale(dists[dists.length - 1]), h - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(xScale(dists[0]), yScale(elevs[0]));
        elevationData.forEach(p => ctx.lineTo(xScale(p.distance), yScale(p.elevation)));
        ctx.strokeStyle = '#4285F4';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#9AA0A6';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const elev = minE + ((maxE - minE) * (4 - i)) / 4;
            const y = padding.top + (chartH * i) / 4;
            ctx.fillText(`${Math.round(elev)}m`, padding.left - 4, y + 3);
        }

        // X-axis labels
        ctx.textAlign = 'center';
        for (let i = 0; i <= 4; i++) {
            const dist = (maxD * i) / 4;
            const x = xScale(dist);
            ctx.fillText(`${Math.round(dist)}km`, x, h - padding.bottom + 14);
        }

        // Hover point
        if (hoverIdx >= 0 && hoverIdx < elevationData.length) {
            const p = elevationData[hoverIdx];
            const x = xScale(p.distance);
            const y = yScale(p.elevation);

            // Vertical line
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, h - padding.bottom);
            ctx.strokeStyle = 'rgba(66, 133, 244, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#4285F4'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

            // Tooltip
            ctx.fillStyle = '#202124';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(p.elevation)}m`, x, y - 10);
        }
    }, [elevationData, expanded, hoverIdx]);

    const handleMouseMove = (e) => {
        if (!elevationData || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        const idx = Math.min(Math.max(0, Math.round(ratio * (elevationData.length - 1))), elevationData.length - 1);
        setHoverIdx(idx);
    };

    if (!routePoints || routePoints.length < 2) return null;

    const stats = elevationData ? {
        min: Math.round(Math.min(...elevationData.map(p => p.elevation))),
        max: Math.round(Math.max(...elevationData.map(p => p.elevation))),
        gain: Math.round(
            elevationData.reduce((acc, p, i) => {
                if (i === 0) return 0;
                const diff = p.elevation - elevationData[i - 1].elevation;
                return acc + (diff > 0 ? diff : 0);
            }, 0)
        ),
    } : null;

    return (
        <div className="elevation-panel">
            <div className="elevation-header" onClick={() => setExpanded(!expanded)}>
                <span className="elevation-title">📊 Elevation Profile</span>
                <span className="directions-toggle">{expanded ? '▼' : '▶'}</span>
            </div>
            {expanded && (
                <>
                    {loading && <div className="elevation-loading">Loading elevation data…</div>}
                    {elevationData && (
                        <>
                            <div className="elevation-stats">
                                <div className="elev-stat">
                                    <span className="elev-stat-label">Min</span>
                                    <span className="elev-stat-value">{stats.min}m</span>
                                </div>
                                <div className="elev-stat">
                                    <span className="elev-stat-label">Max</span>
                                    <span className="elev-stat-value">{stats.max}m</span>
                                </div>
                                <div className="elev-stat">
                                    <span className="elev-stat-label">Gain</span>
                                    <span className="elev-stat-value">+{stats.gain}m</span>
                                </div>
                            </div>
                            <canvas
                                ref={canvasRef}
                                className="elevation-canvas"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setHoverIdx(-1)}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
