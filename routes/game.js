// routes/game.js - Quiz, scoring, leaderboard (MySQL version)
const express = require('express');
const router = express.Router();
const { query, queryOne, insert } = require('../db');
const { requireRoom, sessionRooms } = require('./auth');

// Helper: get the current session_player record for the logged-in user
async function getCurrentSessionPlayer(req) {
    const roomCode = sessionRooms[req.sessionToken];
    if (!roomCode) return null;
    const room = await queryOne('SELECT * FROM game_sessions WHERE room_code = ?', [roomCode]);
    if (!room) return null;
    return await queryOne(
        'SELECT * FROM session_players WHERE session_id = ? AND user_id = ?',
        [room.session_id, req.user.user_id]
    );
}

// --- Dashboard (user home after login) ---
router.get('/dashboard', async (req, res) => {
    if (!req.user) return res.redirect('/login');

    try {
        // Get user's stats
        const stats = await queryOne(
            `SELECT 
                COUNT(pa.answer_id) as answered_count,
                SUM(pa.is_correct) as correct_count,
                SUM(pa.points_awarded) as total_score
             FROM player_answers pa
             JOIN session_players sp ON pa.session_player_id = sp.session_player_id
             WHERE sp.user_id = ?`,
            [req.user.user_id]
        );

        res.render('dashboard', {
            title: 'Dashboard',
            user: req.user,
            totalScore: stats.total_score || 0,
            answeredCount: stats.answered_count || 0,
            correctCount: stats.correct_count || 0
        });
    } catch (err) {
        console.error(err);
        res.render('dashboard', { title: 'Dashboard', user: req.user, totalScore: 0, answeredCount: 0, correctCount: 0 });
    }
});

// --- Quiz list page: normally players get questions via QR code, not a list ---
router.get('/quiz', requireRoom, async (req, res) => {
    if (!req.query.test) {
        return res.redirect('/scan');
    }
    const questions = await query('SELECT * FROM questions ORDER BY question_id');
    res.render('quiz_list', { title: 'Quiz (Test Mode)', questions: questions });
});

// --- Single question page (must be in a room) ---
router.get('/quiz/:id', requireRoom, async (req, res) => {
    const questionId = parseInt(req.params.id);
    const q = await queryOne('SELECT * FROM questions WHERE question_id = ?', [questionId]);
    if (!q) return res.redirect('/quiz');

    // Get options for this question (only if MCQ mode)
    const options = q.answer_mode === 'mcq'
        ? await query('SELECT * FROM answer_options WHERE question_id = ? ORDER BY option_label', [questionId])
        : null;

    res.render('quiz_question', { title: 'Question', q: q, options: options });
});

// --- Submit answer (must be in a room) ---
router.post('/quiz/:id/answer', requireRoom, async (req, res) => {
    const questionId = parseInt(req.params.id);

    try {
        const q = await queryOne('SELECT * FROM questions WHERE question_id = ?', [questionId]);
        if (!q) return res.redirect('/quiz');

        // Get current session_player record
        const sp = await getCurrentSessionPlayer(req);
        if (!sp) return res.redirect('/join-room');

        let isCorrect = false;
        let selectedOptionId = null;
        let typedAnswer = null;

        if (q.answer_mode === 'mcq') {
            const selectedLabel = req.body.answer;
            const selectedOpt = await queryOne(
                'SELECT * FROM answer_options WHERE question_id = ? AND option_label = ?',
                [questionId, selectedLabel]
            );
            selectedOptionId = selectedOpt ? selectedOpt.option_id : null;
            isCorrect = selectedOpt ? selectedOpt.is_correct : false;
        } else {
            typedAnswer = (req.body.typed_answer || '').trim();
            // Normalize: collapse multiple spaces, case-insensitive
            const normalizedInput = typedAnswer.replace(/\s+/g, ' ').toLowerCase();
            const normalizedAnswer = (q.correct_answer || '').trim().replace(/\s+/g, ' ').toLowerCase();
            isCorrect = normalizedInput === normalizedAnswer;
        }

        const pointsAwarded = isCorrect ? q.points : 0;

        // 1. Save answer record
        await insert(
            `INSERT INTO player_answers 
             (session_player_id, question_id, selected_option_id, typed_answer, is_correct, points_awarded)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sp.session_player_id, questionId, selectedOptionId, typedAnswer, isCorrect, pointsAwarded]
        );

        // 2. Update player's total score
        await query(
            'UPDATE session_players SET total_score = total_score + ? WHERE session_player_id = ?',
            [pointsAwarded, sp.session_player_id]
        );

        // Find the correct option (for MCQ mode) to display in result page
        let correctOptionText = null;
        if (q.answer_mode === 'mcq') {
            const correctOpt = await queryOne(
                'SELECT * FROM answer_options WHERE question_id = ? AND is_correct = 1',
                [questionId]
            );
            if (correctOpt) {
                correctOptionText = correctOpt.option_label + '. ' + correctOpt.option_text;
            }
        }

        // Show result page
        res.render('quiz_result', {
            title: 'Result',
            q: q,
            selectedLabel: q.answer_mode === 'mcq' ? req.body.answer : null,
            typedAnswer: typedAnswer,
            isCorrect: isCorrect,
            pointsAwarded: pointsAwarded,
            correctOptionText: correctOptionText
        });
    } catch (err) {
        console.error(err);
        res.redirect('/quiz');
    }
});

// --- Leaderboard ---
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await query(
            `SELECT 
                u.full_name as name,
                COALESCE((
                    SELECT SUM(sp2.total_score) 
                    FROM session_players sp2 
                    WHERE sp2.user_id = u.user_id
                ), 0) as totalScore,
                COALESCE((
                    SELECT COUNT(pa.answer_id) 
                    FROM player_answers pa
                    JOIN session_players sp3 ON pa.session_player_id = sp3.session_player_id
                    WHERE sp3.user_id = u.user_id
                ), 0) as answered,
                COALESCE((
                    SELECT SUM(pa.is_correct) 
                    FROM player_answers pa
                    JOIN session_players sp3 ON pa.session_player_id = sp3.session_player_id
                    WHERE sp3.user_id = u.user_id
                ), 0) as correct
             FROM users u
             ORDER BY totalScore DESC`
        );

        res.render('leaderboard', { title: 'Leaderboard', leaderboard: leaderboard });
    } catch (err) {
        console.error(err);
        res.render('leaderboard', { title: 'Leaderboard', leaderboard: [] });
    }
});

module.exports = router;
