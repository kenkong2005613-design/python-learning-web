// routes/room.js - Multiplayer game rooms (MySQL version)
const express = require('express');
const router = express.Router();
const { query, queryOne, insert } = require('../db');
const { sessionRooms } = require('./auth');

// Generate a random 6-character room code (A-Z, 0-9)
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Available token colours for players
const TOKEN_COLOURS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];

// --- Rooms home page ---
router.get('/rooms', (req, res) => {
    if (!req.user) return res.redirect('/login');
    res.render('rooms', { title: 'Game Rooms', error: null });
});

// --- Create a new room ---
router.post('/rooms/create', async (req, res) => {
    if (!req.user) return res.redirect('/login');

    try {
        const code = generateRoomCode();

        // 1. Create the game session
        const sessionId = await insert(
            'INSERT INTO game_sessions (room_code, host_user_id, status) VALUES (?, ?, ?)',
            [code, req.user.user_id, 'waiting']
        );

        // 2. Add the host as first player in session_players
        await insert(
            `INSERT INTO session_players (session_id, user_id, token_colour, turn_order, board_position, total_score)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sessionId, req.user.user_id, TOKEN_COLOURS[0], 1, 0, 0]
        );

        // Remember which room this user is in
        if (req.sessionToken) {
            sessionRooms[req.sessionToken] = code;
        }

        res.redirect('/rooms/' + code);
    } catch (err) {
        console.error(err);
        res.render('rooms', { title: 'Game Rooms', error: 'Error creating room. Please try again.' });
    }
});

// --- Join a room ---
router.post('/rooms/join', async (req, res) => {
    if (!req.user) return res.redirect('/login');
    const code = req.body.room_code.trim().toUpperCase();

    try {
        const room = await queryOne('SELECT * FROM game_sessions WHERE room_code = ?', [code]);
        if (!room) {
            return res.render('rooms', { title: 'Game Rooms', error: 'Room not found. Check the code.' });
        }

        // Check if player already in this room
        const existing = await queryOne(
            'SELECT * FROM session_players WHERE session_id = ? AND user_id = ?',
            [room.session_id, req.user.user_id]
        );

        if (!existing) {
            // Count players already in this room
            const playersInRoom = await query(
                'SELECT * FROM session_players WHERE session_id = ?',
                [room.session_id]
            );
            
            // Max 6 players per room
            if (playersInRoom.length >= TOKEN_COLOURS.length) {
                return res.render('rooms', { 
                    title: 'Game Rooms', 
                    error: 'This room is full (max 6 players).' 
                });
            }
            
            const nextColourIdx = playersInRoom.length % TOKEN_COLOURS.length;
            const nextTurnOrder = playersInRoom.length + 1;

            await insert(
                `INSERT INTO session_players (session_id, user_id, token_colour, turn_order, board_position, total_score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [room.session_id, req.user.user_id, TOKEN_COLOURS[nextColourIdx], nextTurnOrder, 0, 0]
            );
        }

        // Remember which room this user is in
        if (req.sessionToken) {
            sessionRooms[req.sessionToken] = code;
        }

        const next = req.body.next || '/rooms/' + code;
        res.redirect(next);
    } catch (err) {
        console.error(err);
        res.render('rooms', { title: 'Game Rooms', error: 'Database error. Please try again.' });
    }
});

// --- Room detail page ---
router.get('/rooms/:code', async (req, res) => {
    if (!req.user) return res.redirect('/login');
    const code = req.params.code.toUpperCase();

    try {
        const room = await queryOne('SELECT * FROM game_sessions WHERE room_code = ?', [code]);
        if (!room) {
            return res.render('rooms', { title: 'Game Rooms', error: 'Room not found.' });
        }

        // Get all players in this room, join with user names
        const players = await query(
            `SELECT sp.*, u.full_name as name
             FROM session_players sp
             JOIN users u ON sp.user_id = u.user_id
             WHERE sp.session_id = ?
             ORDER BY sp.total_score DESC`,
            [room.session_id]
        );

        res.render('room', {
            title: 'Room ' + code,
            room: room,
            players: players,
            isHost: room.host_user_id === req.user.user_id,
            currentUserId: req.user.user_id
        });
    } catch (err) {
        console.error(err);
        res.render('rooms', { title: 'Game Rooms', error: 'Database error.' });
    }
});

// --- Join room page (standalone) ---
router.get('/join-room', (req, res) => {
    if (!req.user) return res.redirect('/login');
    const next = req.query.next || '/dashboard';
    res.render('join_room', { title: 'Enter Room Code', error: null, next: next });
});

router.post('/join-room', async (req, res) => {
    if (!req.user) return res.redirect('/login');
    const code = req.body.room_code.trim().toUpperCase();
    const next = req.body.next || '/dashboard';

    try {
        const room = await queryOne('SELECT * FROM game_sessions WHERE room_code = ?', [code]);
        if (!room) {
            return res.render('join_room', { title: 'Enter Room Code', error: 'Room not found. Check the code.', next: next });
        }

        const existing = await queryOne(
            'SELECT * FROM session_players WHERE session_id = ? AND user_id = ?',
            [room.session_id, req.user.user_id]
        );

        if (!existing) {
            const playersInRoom = await query(
                'SELECT * FROM session_players WHERE session_id = ?',
                [room.session_id]
            );
            const nextColourIdx = playersInRoom.length % TOKEN_COLOURS.length;
            const nextTurnOrder = playersInRoom.length + 1;

            await insert(
                `INSERT INTO session_players (session_id, user_id, token_colour, turn_order, board_position, total_score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [room.session_id, req.user.user_id, TOKEN_COLOURS[nextColourIdx], nextTurnOrder, 0, 0]
            );
        }

        if (req.sessionToken) {
            sessionRooms[req.sessionToken] = code;
        }

        res.redirect(next);
    } catch (err) {
        console.error(err);
        res.render('join_room', { title: 'Enter Room Code', error: 'Database error.', next: next });
    }
});

// --- Scan QR code page ---
router.get('/scan', (req, res) => {
    if (!req.user) return res.redirect('/login');
    res.render('scan', { title: 'Scan QR Code' });
});

// --- QR Codes list page ---
router.get('/qrcodes', async (req, res) => {
    if (!req.user) return res.redirect('/login');
    const questions = await query('SELECT * FROM questions ORDER BY question_id');
    const baseUrl = req.protocol + '://' + req.get('host');
    res.render('qrcodes', { title: 'QR Codes', questions: questions, baseUrl: baseUrl });
});

module.exports = router;
