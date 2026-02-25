require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authApi = require('./routes/authApi');
const routeApi = require('./routes/routeApi');
const placesApi = require('./routes/placesApi');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins for the Vercel deployment
        callback(null, true);
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authApi);
app.use('/api/route', routeApi);
app.use('/api/places', placesApi);


// Geocode proxy (avoids CORS issues with Nominatim from browser)
app.get('/api/geocode', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const axios = require('axios');
        const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: { q, format: 'json', limit: 5, addressdetails: 1 },
            headers: { 'User-Agent': 'RouteAssist/1.0' },
            timeout: 5000,
        });
        res.json(data.map(r => ({
            display_name: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
        })));
    } catch (err) {
        console.error('[geocode] Error:', err.message);
        res.json([]);
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB connection (optional – app works without it)
if (process.env.MONGODB_URI) {
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected'))
        .catch((err) => console.warn('⚠️  MongoDB not available (continuing without DB):', err.message));
}

app.listen(PORT, () => {
    console.log(`\n🚀 RouteAssist Server running on http://localhost:${PORT}\n`);
});
