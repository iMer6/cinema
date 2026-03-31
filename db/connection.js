require('dotenv').config();

const { Pool } = require('pg');


const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
});

pool.connect((err) => {
    if (err) {
        console.log("Error connecting: " + err.stack);
        return;
    }
    console.log("Success");
});

function runDBCommand(sqlQuery, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sqlQuery, params, (error, results) => {
            error ? reject(error) : resolve(results);
        });
    });
};

module.exports = { runDBCommand };