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
            m.menu_id, m.name, m.price, m.category,
           COALESCE(AVG(dr.rating), 0) AS average_rating,
           COUNT(dr.review_id) AS review_count
           FROM Menu m
           LEFT JOIN Dish_Reviews dr ON m.menu_id = dr.menu_id
           GROUP BY m.menu_id, m.name, m.price, m.category
           ORDER BY m.name;`);
           return result.recordset;
        }
        catch (err) {
            console.error('SQL error', err);
            return err;
        }  
        
    },

    async getMenuItemsByCategory(category) {
        const pool = await poolPromise;
        const result = await pool.request().input('category', sql.VarChar, category).query(`SELECT * FROM Menu WHERE category = @category`);
        return result.recordset;
    },

    async getAvailableMenuStock() {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM Menu_Stock`);
        return result.recordset;
    },

    async updateMenuStock(menu_id, quantity) {
        const pool = await poolPromise;
        const result = await pool.request().input('menu_id', sql.Int, menu_id).input('quantity', sql.Int, quantity)
        .query(`UPDATE Menu_Stock SET quantity_in_stock = @quantity WHERE menu_id = @menu_id`);
        return result.recordset;
    },
    
    async getMenuStockByMenuId(menu_id) {
        const pool = await poolPromise;
        const result = await pool.request().input('menu_id', sql.Int, menu_id).query(`SELECT * FROM Menu_Stock WHERE menu_id = @menu_id`);
        return result.recordset;
    },

    
    
};
module.exports = Menu;