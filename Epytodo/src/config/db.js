const mysql = require('mysql2/promise');
require('dotenv').config({encoding: 'utf-8'});

const port = 3306;

const pool = mysql.createPool({
    port: `${port}`,
    host: `${process.env.MYSQL_HOST}`,
    user: `${process.env.MYSQL_USER}`,
    password: `${process.env.MYSQL_ROOT_PASSWORD}`,
    database: `${process.env.MYSQL_DATABASE}`
});


async function query_database(connection, query, data) {
    try {
        const [rows] = await connection.execute(query, data);
        return rows;
    } catch (err) {
        console.error(`Error: ${err}`);
        return {'msg':`Error: ${err}`};
    }
}

async function connect_to_database() {
    const connection = await pool.getConnection();

    console.log(`Connected to ${process.env.MYSQL_DATABASE} database`);
    return connection;
}

async function disconnect_from_database(connection) {
    connection.release();
    pool.end();
}

module.exports = {
    pool,
    connect_to_database,
    query_database,
    disconnect_from_database,
}
