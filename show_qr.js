const mysql = require('mysql2/promise');

async function showQR() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Ken2005613@',
        database: 'fwdd_game'
    });

    console.log('=== All questions (12) ===');
    const [questions] = await pool.execute('SELECT * FROM questions ORDER BY question_id');
    questions.forEach(q => {
        console.log(`Q${q.question_id}: [${q.concept_type}] ${q.question_text.substring(0, 60)}... | points=${q.points} | mode=${q.answer_mode}`);
    });

    console.log('\n=== answer_options for MCQ questions ===');
    const [opts] = await pool.execute(`
        SELECT ao.*, q.question_text 
        FROM answer_options ao
        JOIN questions q ON ao.question_id = q.question_id
        ORDER BY ao.question_id, ao.option_label
    `);
    opts.forEach(o => {
        console.log(`Q${o.question_id} ${o.option_label}. ${o.option_text} ${o.is_correct ? '✓' : ''}`);
    });

    console.log('\n=== player_answers (who answered what) ===');
    const [answers] = await pool.execute(`
        SELECT pa.*, u.full_name, q.question_text
        FROM player_answers pa
        JOIN session_players sp ON pa.session_player_id = sp.session_player_id
        JOIN users u ON sp.user_id = u.user_id
        JOIN questions q ON pa.question_id = q.question_id
        ORDER BY pa.answer_id DESC
        LIMIT 10
    `);
    console.table(answers);

    await pool.end();
}

showQR().catch(err => console.error(err));
