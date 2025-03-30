const {sql, poolPromise} = require('../config/db');

const Menu = {
    async getAllMenu() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Menu');
        return result.recordset;
    }
};
module.exports = Menu;