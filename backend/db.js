const sql = require("mssql/msnodesqlv8");
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    driver: "msnodesqlv8",
    options: {
        enableArithAbort: true,
        trustServerCertificate: true,
    },
    port: parseInt(process.env.DB_PORT)
};


const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to database');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed: ', err);
        throw err; 
    });

module.exports = {
    sql,
    poolPromise
};
