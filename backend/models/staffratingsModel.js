const {sql, poolPromise} = require('../config/db');

const StaffRatings = {
    async displayAllStaffRatings() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM Staff_Ratings');
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    }
};

module.exports = StaffRatings;
