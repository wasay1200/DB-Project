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
    },

    async GetAllStaff() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`SELECT * FROM Staff`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },
    
    async GetStaffRating(staff_id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('staff_id', sql.Int,staff_id ).query(`SELECT sr.*, u.name AS user_name
         FROM Staff_Ratings sr
         JOIN Users u ON sr.user_id = u.user_id
         WHERE sr.staff_id = @staff_id
         ORDER BY sr.rating_id DESC`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
   
    } ,

    async CreateStaffRatings(staff_id ,user_id ,rating ,feedback ) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('staff_id', sql.Int,staff_id )
            input('user_id', sql.Int,user_id ).input('rating', sql.Int,rating).input('feedback', sql.NVarChar,feedback ).
            query(`INSERT INTO Staff_Ratings (staff_id, user_id, rating, feedback)
            VALUES (@staff_id, @user_id, @rating, @feedback)`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    } 


};

module.exports = StaffRatings;
