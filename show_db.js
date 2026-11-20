const mysql = require('mysql2/promise');

async function showDB() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'Ken2005613@',
        database: 'fwdd_game'
    });

    console.log('=== Tables in fwdd_game ===');
    const [tables] = await pool.execute('SHOW TABLES');
    tables.forEach(t => console.log('  -', Object.values(t)[0]));

    console.log('\n=== users table (top 5) ===');
    const [users] = await pool.execute('SELECT * FROM users LIMIT 5');
    console.table(users);

    console.log('\n=== questions table (count) ===');
    const [q] = await pool.execute('SELECT COUNT(*) as total FROM questions');
    console.log('Total questions:', q[0].total);

    await pool.end();
}

showDB().catch(err => console.error(err));
