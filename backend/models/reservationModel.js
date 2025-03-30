const {sql, poolPromise} = require('../config/db');

const Reservations = {

async getAllReservations() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Reservations');
        return result.recordset;
    } catch (err) {
        console.error('SQL error', err);
        return err;
    }
}










};

module.exports = Reservations;