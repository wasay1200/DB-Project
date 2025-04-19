const { sql, poolPromise } = require('../config/db');

const Order = {
    async getAllOrders() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`SELECT * FROM Orders`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async GetAllOrderItems() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`SELECT * from Order_Items`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async CreateOrder(user_id, reservation_id, total_price) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('user_id', sql.Int, user_id).input('reservation_id', sql.Int, reservation_id)
                .input('total_price', sql.Decimal, total_price).query(`INSERT INTO Orders (user_id, reservation_id, total_price)
             VALUES (@user_id, @reservation_id, @total_price)`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async CreateOrderItem(order_id, menu_id, quantity) {
        try {
            const pool = await poolPromise;

            const result = await pool.request().input('order_id', sql.Int, order_id).input('menu_id', sql.Int, menu_id)
                .input('quantity', sql.Int, quantity).query(`INSERT INTO Order_Items (order_id, menu_id, quantity)
                VALUES (@order_id, @menu_id, @quantity)`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },
    async GetUserOrders(user_id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('user_id', sql.Int, user_id)
                .query(`SELECT 
                        o.order_id, o.total_price,
                        COUNT(oi.order_item_id) AS item_count
                        FROM Orders o
                        JOIN Order_Items oi ON o.order_id = oi.order_id
                        WHERE o.user_id = @user_id
                        GROUP BY o.order_id, o.total_price`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async GetOrderDetails(order_id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('order_id', sql.Int, order_id)
                .query(`SELECT 
                o.*, u.name AS customer_name, u.email AS customer_email
                FROM Orders o
                JOIN Users u ON o.user_id = u.user_id
                WHERE o.order_id = @order_id`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    }
}

module.exports = Order;