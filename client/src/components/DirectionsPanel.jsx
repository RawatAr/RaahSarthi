import { useState } from 'react';
import {
    Navigation, ArrowUpRight, ArrowUpLeft, ArrowRight, ArrowLeft,
    RotateCcw, Merge, Flag, PlayCircle, ChevronDown, ChevronRight
} from 'lucide-react';

function getManeuverIcon(type, modifier) {
    if (type === 'depart') return <PlayCircle size={15} strokeWidth={2} color="#10B981" />;
    if (type === 'arrive') return <Flag size={15} strokeWidth={2} color="#EF4444" />;
    if (type === 'roundabout' || type === 'rotary') return <RotateCcw size={15} strokeWidth={2} color="#F59E0B" />;
    if (type === 'merge' || type === 'new name') return <Merge size={15} strokeWidth={2} color="#6366F1" />;

    if (modifier?.includes('sharp left') || modifier === 'left') return <ArrowLeft size={15} strokeWidth={2.5} color="#4285F4" />;
    if (modifier?.includes('sharp right') || modifier === 'right') return <ArrowRight size={15} strokeWidth={2.5} color="#4285F4" />;
    if (modifier?.includes('slight left')) return <ArrowUpLeft size={15} strokeWidth={2} color="#4285F4" />;
    if (modifier?.includes('slight right')) return <ArrowUpRight size={15} strokeWidth={2} color="#4285F4" />;
    return <Navigation size={15} strokeWidth={2} color="#9AA0A6" />;
}

function formatStepDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

function formatStepDuration(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
}

function capitalizeModifier(modifier, type) {
    if (type === 'depart') return 'Start driving';
    if (type === 'arrive') return 'You have arrived';
    if (type === 'roundabout' || type === 'rotary') return 'Take the roundabout';
    if (!modifier) {
        if (type === 'new name') return 'Continue';
        if (type === 'merge') return 'Merge';
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Continue';
    }
    return `Turn ${modifier}`;
}

export default function DirectionsPanel({ steps }) {
    const [expanded, setExpanded] = useState(true);

    if (!steps || steps.length === 0) return null;

    return (
        <div className="directions-panel">
            <div className="directions-header" onClick={() => setExpanded(!expanded)}>
                <span className="directions-title">
                    <Navigation size={14} strokeWidth={2.5} color="var(--accent)" />
                    Turn-by-Turn Directions
                </span>
                {expanded
                    ? <ChevronDown size={14} strokeWidth={2} color="var(--text-muted)" />
                    : <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />}
            </div>

            {expanded && (
                <div className="directions-list">
                    {steps.map((step, i) => (
                        <div key={i} className="direction-step">
                            <div className="step-icon-wrap">
                                {getManeuverIcon(step.maneuver?.type, step.maneuver?.modifier)}
                            </div>
                            <div className="step-content">
                                <div className="step-instruction">
                                    {step.name
                                        ? `${capitalizeModifier(step.maneuver?.modifier, step.maneuver?.type)} onto ${step.name}`
                                        : capitalizeModifier(step.maneuver?.modifier, step.maneuver?.type) || 'Continue'}
                                </div>
                                <div className="step-meta">
                                    <span>{formatStepDistance(step.distance)}</span>
                                    <span className="step-dot">·</span>
                                    <span>{formatStepDuration(step.duration)}</span>
                                </div>
                            </div>
                            <div className="step-number">{i + 1}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
