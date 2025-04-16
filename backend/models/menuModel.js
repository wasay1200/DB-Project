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
            m.name, m.price,
           COALESCE(AVG(dr.rating), 0) AS average_rating,
           COUNT(dr.review_id) AS review_count
           FROM Menu m
           LEFT JOIN Dish_Reviews dr ON m.menu_id = dr.menu_id
           GROUP BY m.name,m.price
           ORDER BY m.name;`);
           return result.recordset;
        }
        catch (err) {
            console.error('SQL error', err);
            return err;
        }  
        
    }
    
};
module.exports = Menu;