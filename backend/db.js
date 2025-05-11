const sql = require("mssql");
require("dotenv").config({ path: __dirname + '/.env' });


//console.log("DB_USER:", process.env.DB_USER);

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


// Establish a direct connection instead of using poolPromise
const poolPromise = sql.connect(config)
    .then(pool => {
        console.log("Connected to database");
        return pool;
    })
    .catch(err => {
        console.error("Database connection failed:", err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};
