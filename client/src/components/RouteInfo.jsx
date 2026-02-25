import { useRef } from 'react';
import { GripVertical, Printer, Share2, X, Ruler, Clock } from 'lucide-react';

export default function RouteInfo({ routeData, waypoints, onRemoveWaypoint, onReorderWaypoints }) {
    if (!routeData) return null;

    const handlePrint = () => {
        const wpsText = waypoints.length
            ? `\n\nWaypoints:\n${waypoints.map((w, i) => `  ${i + 1}. ${w.name}`).join('\n')}`
            : '';

        const win = window.open('', '_blank', 'width=600,height=500');
        win.document.write(`
            <html><head><title>RaahSarthi Route</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; color: #202124; line-height: 1.7; }
                h1 { color: #1B5FAA; font-size: 22px; margin-bottom: 4px; font-weight: 800; }
                .sub { color: #F7941D; font-size: 13px; margin-bottom: 20px; font-weight: 600; }
                .stats { display: flex; gap: 12px; margin-bottom: 16px; }
                .stat { background: #f8f9fa; border-radius: 12px; padding: 14px 18px; flex: 1; }
                .stat-label { color: #70757a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-value { font-size: 20px; color: #1A73E8; font-weight: 700; margin-top: 4px; }
                .addr { display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 13px; }
                .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
                .wp { background: #FEF7E0; padding: 8px 12px; border-radius: 8px; margin: 4px 0; font-size: 13px; }
                .footer { color: #9AA0A6; font-size: 11px; margin-top: 30px; text-align: center; }
            </style></head><body>
            <h1>🗺️ RaahSarthi Route</h1>
            <div class="sub">Smart stops. Smarter journeys.</div>
            <div class="stats">
                <div class="stat"><div class="stat-label">📏 Distance</div><div class="stat-value">${routeData.distance.text}</div></div>
                <div class="stat"><div class="stat-label">⏱ Duration</div><div class="stat-value">${routeData.duration.text}</div></div>
            </div>
            <div class="addr"><div class="dot" style="background:#10B981"></div><span>${routeData.startAddress}</span></div>
            <div class="addr"><div class="dot" style="background:#EF4444"></div><span>${routeData.endAddress}</span></div>
            ${waypoints.length ? `<h3 style="margin-top:16px">🛑 Waypoints</h3>${waypoints.map((w, i) => `<div class="wp">Stop ${i + 1}: ${w.name}</div>`).join('')}` : ''}
            <div class="footer">Generated on ${new Date().toLocaleString()} by RaahSarthi</div>
            </body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    };

    const handleShare = async () => {
        const text = `📍 ${routeData.startAddress} → 🏁 ${routeData.endAddress}\n📏 ${routeData.distance.text} · ⏱ ${routeData.duration.text}\n\nPlanned with RaahSarthi`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'RaahSarthi Route', text });
            } else {
                await navigator.clipboard.writeText(text);
                alert('Route copied to clipboard!');
            }
        } catch {
            try { await navigator.clipboard.writeText(text); alert('Route copied to clipboard!'); } catch { /* ignore */ }
        }
    };

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (idx) => { dragItem.current = idx; };
    const handleDragEnter = (idx) => { dragOverItem.current = idx; };
    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
        const reordered = [...waypoints];
        const [removed] = reordered.splice(dragItem.current, 1);
        reordered.splice(dragOverItem.current, 0, removed);
        dragItem.current = null;
        dragOverItem.current = null;
        onReorderWaypoints(reordered);
    };

    return (
        <div className="fade-in">
            <div className="route-info">
                <div className="info-card accent-blue">
                    <div className="info-label">
                        <Ruler size={12} strokeWidth={2.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Distance
                    </div>
                    <div className="info-value">{routeData.distance.text}</div>
                </div>
                <div className="info-card accent-purple">
                    <div className="info-label">
                        <Clock size={12} strokeWidth={2.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Duration
                    </div>
                    <div className="info-value">{routeData.duration.text}</div>
                </div>
            </div>

            <div className="route-addresses">
                <div className="address-item">
                    <div className="address-dot start" />
                    <span>{routeData.startAddress}</span>
                </div>
                <div className="address-item">
                    <div className="address-dot end" />
                    <span>{routeData.endAddress}</span>
                </div>
            </div>

            {/* Action buttons */}
            <div className="route-actions">
                <button className="btn btn-sm btn-route-action" onClick={handlePrint} title="Print route">
                    <Printer size={13} strokeWidth={2} />
                    Print
                </button>
                <button className="btn btn-sm btn-route-action" onClick={handleShare} title="Share route">
                    <Share2 size={13} strokeWidth={2} />
                    Share
                </button>
            </div>

            {waypoints.length > 0 && (
                <div className="waypoints-section">
                    <div className="section-title">Waypoints <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(drag to reorder)</span></div>
                    {waypoints.map((wp, i) => (
                        <div
                            key={i}
                            className="waypoint-item"
                            draggable
                            onDragStart={() => handleDragStart(i)}
                            onDragEnter={() => handleDragEnter(i)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <GripVertical size={14} strokeWidth={2} color="var(--text-muted)" className="waypoint-drag-handle" />
                            <span className="waypoint-tag">Stop {i + 1}</span>
                            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {wp.name}
                            </span>
                            <button
                                className="waypoint-remove"
                                onClick={() => onRemoveWaypoint(i)}
                                title="Remove waypoint"
                            >
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
