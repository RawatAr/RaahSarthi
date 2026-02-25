import { Car, PersonStanding, Bike } from 'lucide-react';

const MODES = [
    { key: 'driving', Icon: Car, label: 'Drive', labelHi: 'कार', color: '#1A73E8' },
    { key: 'walking', Icon: PersonStanding, label: 'Walk', labelHi: 'पैदल', color: '#10B981' },
    { key: 'cycling', Icon: Bike, label: 'Cycle', labelHi: 'साइकिल', color: '#F59E0B' },
];

export { MODES };

export default function TravelModeSelector({ mode, onChange, lang = 'en' }) {
    return (
        <div className="travel-mode-selector">
            {MODES.map(({ key, Icon, label, labelHi, color }) => {
                const active = mode === key;
                return (
                    <button
                        key={key}
                        className={`travel-mode-btn ${active ? 'active' : ''}`}
                        style={active ? { borderColor: color, color } : {}}
                        onClick={() => onChange(key)}
                        title={lang === 'hi' ? labelHi : label}
                    >
                        <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                        <span>{lang === 'hi' ? labelHi : label}</span>
                    </button>
                );
            })}
        </div>
    );
}
