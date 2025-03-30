const {sql, poolPromise} = require('../config/db');

const DishReviews = {
    async getAllDishReviews() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Dish_Reviews');
        return result.recordset;
    }
};

module.exports = DishReviews;