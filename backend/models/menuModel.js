const {sql, poolPromise} = require('../config/db');

const Menu = {
    async getAllMenu() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Menu');
        return result.recordset;
    },
    async GetMenuItemsWithRatings() {
        try
        {
           const pool = await poolPromise;
           const result = await pool.request().query(`SELECT 
           m.*,
           COALESCE(AVG(dr.rating), 0) AS average_rating,
           COUNT(dr.review_id) AS review_count
           FROM Menu m
           LEFT JOIN Dish_Reviews dr ON m.menu_id = dr.menu_id
           GROUP BY m.menu_id, m.name
           ORDER BY m.category, m.name;`);
        }
        catch (err) {
            console.error('SQL error', err);
            return err;
        }  
        return result.recordset;
    }
    
};
module.exports = Menu;