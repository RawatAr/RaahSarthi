import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from 'lucide-react';

const WMO_CODES = {
    0: { desc: 'Clear sky', Icon: Sun, color: '#F59E0B' },
    1: { desc: 'Mainly clear', Icon: Sun, color: '#FBBF24' },
    2: { desc: 'Partly cloudy', Icon: Cloud, color: '#9CA3AF' },
    3: { desc: 'Overcast', Icon: Cloud, color: '#6B7280' },
    45: { desc: 'Foggy', Icon: Cloud, color: '#9CA3AF' },
    48: { desc: 'Rime fog', Icon: Cloud, color: '#9CA3AF' },
    51: { desc: 'Light drizzle', Icon: CloudRain, color: '#60A5FA' },
    53: { desc: 'Drizzle', Icon: CloudRain, color: '#3B82F6' },
    55: { desc: 'Heavy drizzle', Icon: CloudRain, color: '#1D4ED8' },
    61: { desc: 'Light rain', Icon: CloudRain, color: '#60A5FA' },
    63: { desc: 'Rain', Icon: CloudRain, color: '#3B82F6' },
    65: { desc: 'Heavy rain', Icon: CloudRain, color: '#1D4ED8' },
    71: { desc: 'Light snow', Icon: CloudSnow, color: '#BAE6FD' },
    73: { desc: 'Snow', Icon: CloudSnow, color: '#93C5FD' },
    75: { desc: 'Heavy snow', Icon: CloudSnow, color: '#60A5FA' },
    80: { desc: 'Rain showers', Icon: CloudRain, color: '#3B82F6' },
    81: { desc: 'Rain showers', Icon: CloudRain, color: '#2563EB' },
    82: { desc: 'Heavy showers', Icon: CloudLightning, color: '#7C3AED' },
    95: { desc: 'Thunderstorm', Icon: CloudLightning, color: '#7C3AED' },
    96: { desc: 'Thunderstorm', Icon: CloudLightning, color: '#6D28D9' },
    99: { desc: 'Hailstorm', Icon: CloudLightning, color: '#5B21B6' },
};

function getWeatherInfo(code) {
    return WMO_CODES[code] || { desc: 'Unknown', Icon: Thermometer, color: '#9AA0A6' };
}

async function fetchWeather(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    return data.current;
}

function shortLabel(label) {
    if (!label) return '';
    return label.split(',')[0].trim();
}

function WeatherCard({ label, data, dotColor }) {
    const info = getWeatherInfo(data.weather_code);
    const { Icon, color } = info;

    return (
        <div className="weather-card">
            <div className="weather-header">
                <span className="weather-dot" style={{ background: dotColor }} />
                <span className="weather-label">{label}</span>
            </div>
            <div className="weather-body">
                <div className="weather-main">
                    <div className="weather-icon-circle" style={{ background: `${color}18` }}>
                        <Icon size={22} color={color} strokeWidth={1.5} />
                    </div>
                    <span className="weather-temp">{Math.round(data.temperature_2m)}°C</span>
                </div>
                <div className="weather-details">
                    <span>{info.desc}</span>
                    <span>
                        <Wind size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        {data.wind_speed_10m} km/h
                    </span>
                    <span>
                        <Droplets size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        {data.relative_humidity_2m}%
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function WeatherWidget({ startCoords, endCoords, startLabel, endLabel }) {
    const [startWeather, setStartWeather] = useState(null);
    const [endWeather, setEndWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!startCoords || !endCoords) return;
        setLoading(true);
        Promise.all([
            fetchWeather(startCoords.lat, startCoords.lng),
            fetchWeather(endCoords.lat, endCoords.lng),
        ]).then(([s, e]) => {
            setStartWeather(s);
            setEndWeather(e);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [startCoords?.lat, startCoords?.lng, endCoords?.lat, endCoords?.lng]);

    if (loading) {
        return (
            <div className="weather-widget">
                <div className="weather-loading">
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span style={{ fontSize: 12 }}>Loading weather…</span>
                </div>
            </div>
        );
    }

    if (!startWeather && !endWeather) return null;

    return (
        <div className="weather-widget">
            {startWeather && <WeatherCard label={shortLabel(startLabel) || 'Origin'} data={startWeather} dotColor="var(--success)" />}
            {endWeather && <WeatherCard label={shortLabel(endLabel) || 'Destination'} data={endWeather} dotColor="var(--danger)" />}
        </div>
    );
}
