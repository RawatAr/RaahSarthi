const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// ── User Schema ──
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    savedRoutes: [{
        origin: String,
        destination: String,
        distance: String,
        duration: String,
        savedAt: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

// Mongoose 9: pre-save must NOT accept `next` param when using async/promise
userSchema.pre('save', function () {
    if (!this.isModified('password')) return Promise.resolve();
    return bcrypt.hash(this.password, 12).then(hash => {
        this.password = hash;
    });
});


const User = mongoose.models.User || mongoose.model('User', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'raahsarthi_dev_secret_2024';

function signToken(user) {
    return jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
}

function safeUser(u) {
    return { id: u._id, name: u.name, email: u.email, savedRoutes: u.savedRoutes };
}

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
    try {
        // Check MongoDB connection
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Please ensure MongoDB is running.' });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

        // Check for existing user first to give a clear message
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });

        const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password });
        res.status(201).json({ token: signToken(user), user: safeUser(user) });
    } catch (err) {
        console.error('[auth/register]', err.message);
        // Handle MongoDB duplicate key error (race condition)
        if (err.code === 11000) {
            return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
        }
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({ error: msg });
        }
        res.status(500).json({ error: 'Account creation failed. Please try again.' });
    }
});


// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
        res.json({ token: signToken(user), user: safeUser(user) });
    } catch (err) {
        console.error('[auth/login]', err.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ── GET /api/auth/me  (verify token) ──
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token.' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: safeUser(user) });
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
});

// ── POST /api/auth/save-route  (cloud saved routes) ──
router.post('/save-route', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Login required.' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const { origin, destination, distance, duration } = req.body;
        const user = await User.findByIdAndUpdate(
            decoded.id,
            { $push: { savedRoutes: { $each: [{ origin, destination, distance, duration }], $position: 0, $slice: 20 } } },
            { new: true }
        ).select('-password');
        res.json({ savedRoutes: user.savedRoutes });
    } catch {
        res.status(401).json({ error: 'Auth failed.' });
    }
});

module.exports = router;
