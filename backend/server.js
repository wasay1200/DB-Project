const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {sql, poolPromise} = require('./db.js');
const PORT = 5000;
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`Use path /data for query results!`);
});

app.get('/data', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Users');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});