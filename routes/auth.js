// routes/auth.js - User registration, login, logout (MySQL version)
const express = require('express');
const router = express.Router();
const { query, queryOne, insert } = require('../db');

// Simple in-memory session store (for student project — no extra packages needed)
const sessions = {};
const sessionRooms = {};

// Middleware: check if user is logged in
function isLoggedIn(req, res, next) {
    const token = req.cookies ? req.cookies.sessionToken : null;
    if (token && sessions[token]) {
        req.user = sessions[token];
        req.sessionToken = token;
        req.currentRoomCode = sessionRooms[token] || null;
        res.locals.currentUser = req.user;
        res.locals.currentRoomCode = req.currentRoomCode;
    }
    next();
}

// Middleware: require user to be logged in AND inside a room
function requireRoom(req, res, next) {
    if (!req.user) {
        return res.redirect('/login');
    }
    if (!req.currentRoomCode) {
        return res.redirect('/join-room?next=' + encodeURIComponent(req.originalUrl));
    }
    next();
}

// --- Register page ---
router.get('/register', (req, res) => {
    res.render('register', { error: null, title: 'Register' });
});

router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;

    try {
        // Check if email already exists
        const existing = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.render('register', { error: 'Email already registered. Please login.', title: 'Register' });
        }

        // Insert new user
        const userId = await insert(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            [full_name, email, password]
        );

        // Auto-login after register
        const newUser = { user_id: userId, full_name, email };
        const token = 'token_' + Date.now();
        sessions[token] = newUser;
        res.cookie('sessionToken', token);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Database error. Please try again.', title: 'Register' });
    }
});

// --- Login page ---
router.get('/login', (req, res) => {
    res.render('login', { error: null, title: 'Login' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await queryOne(
            'SELECT * FROM users WHERE email = ? AND password_hash = ?',
            [email, password]
        );
        if (!user) {
            return res.render('login', { error: 'Invalid email or password.', title: 'Login' });
        }

        const token = 'token_' + Date.now();
        sessions[token] = user;
        res.cookie('sessionToken', token);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Database error. Please try again.', title: 'Login' });
    }
});

// --- Logout ---
router.get('/logout', (req, res) => {
    const token = req.cookies ? req.cookies.sessionToken : null;
    if (token) {
        delete sessions[token];
        delete sessionRooms[token];
    }
    res.clearCookie('sessionToken');
    res.redirect('/');
});

module.exports = router;
module.exports.isLoggedIn = isLoggedIn;
module.exports.requireRoom = requireRoom;
module.exports.sessions = sessions;
module.exports.sessionRooms = sessionRooms;
