const { Pool } = require('pg');

// const pool = new Pool({
//     user: '',
//     host: '',
//     database: '',
//     password: '',
//     port: ,
// });

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