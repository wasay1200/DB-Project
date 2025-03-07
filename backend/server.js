const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {sql, poolPromise} = require('./db.js');
const PORT = 5000;
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(`Use path /api/{tablename} for query results for that table!`);
});

// User routes
app.get('/api/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Users');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Tables routes
app.get('/api/tables', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Tables');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Reservations routes
app.get('/api/reservations', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Reservations');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Menu routes
app.get('/api/menu', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Menu');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Orders routes
app.get('/api/orders', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Orders');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Order Items routes
app.get('/api/order-items', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Order_Items');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Dish Reviews routes
app.get('/api/dish-reviews', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Dish_Reviews');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Staff routes
app.get('/api/staff', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Staff');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// Staff Ratings routes
app.get('/api/staff-ratings', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Staff_Ratings');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

// QR Codes routes
app.get('/api/qr-codes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM QR_Codes');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Database query failed');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});