// db.js - MySQL database connection
const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Ken2005613@',  // ⚠️ 改成你的 MySQL root 密码
    database: 'fwdd_game',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper: run a query and return rows
async function query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

// Helper: get one row (or null)
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

// Helper: insert a row and return the new ID
async function insert(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
}

module.exports = { pool, query, queryOne, insert };
