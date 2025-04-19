const {sql, poolPromise} = require('../config/db');

const DishReviews = {
    async getAllDishReviews() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Dish_Reviews');
        return result.recordset;
    },
     
    async CreateDishReview(user_id,menu_id,rating,comment) 
    {
        try{
        const pool = await poolPromise;
        const result = await pool.request().input('user_id', sql.Int, user_id).input('menu_id', sql.Int, menu_id).
        input('rating', sql.Int, rating).input('comment', sql.NVarChar,comment).query(`INSERT INTO Dish_Reviews (user_id, menu_id, rating, review_text)
        VALUES (@user_id, @menu_id, @rating, @comment)`);
        return result.recordset;
        }
        catch (err) {
            console.error('SQL error', err);
            return err;
        } 
    },

    async GetDishReviews() {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT 
        dr.*, u.name AS reviewer_name, m.name AS dish_name
        FROM Dish_Reviews dr
        JOIN Users u ON dr.user_id = u.user_id
        JOIN Menu m ON dr.menu_id = m.menu_id`);
        return result.recordset;
    },
     

};

module.exports = DishReviews;