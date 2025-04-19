const { sql, poolPromise } = require('../config/db');
//all the procedures based on users data, reservation data are here
const Reservations = {

    async getAllReservations() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`SELECT r.*, u.name AS customer_name, u.email 
                                                        FROM Reservations r
                                                        JOIN Users u ON r.user_id = u.user_id
                                                        ORDER BY r.reservation_date DESC, r.time_slot DESC`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async getAllUsers() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM Users');
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async getUserByEmail(email) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('email', sql.NVarChar, email).query('SELECT * FROM Users WHERE email=@email');
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async CreateUser(name, email, password, role) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('name', sql.NVarChar, name).input('email',
                sql.NVarChar, email).input('password', sql.NVarChar, password).input('role', sql.NVarChar,
                    role).query(`INSERT INTO Users (name, email, password, role) VALUES (@name, @email, @password, @role);
                        `);
            return result;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async GetAllTables() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT * FROM Tables');
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async GetAvailableTables(date, time, partySize) {
        try { 
            const pool = await poolPromise;
            const result = await pool.request().input('date', sql.NVarChar, date)
            .input('time', sql.Time, time)
                .input('partySize', sql.Int, partySize)
                .query(`SELECT 
                    t.*,
                    CASE 
                        WHEN t.capacity = @partySize THEN 'Perfect Fit'
                        ELSE CONCAT('Seats ', t.capacity)
                    END AS capacity_display
                FROM Tables t
                WHERE t.capacity >= @partySize
                AND t.table_id NOT IN (
                    SELECT r.table_id FROM Reservations r
                    WHERE r.reservation_date = @date
                    AND r.time_slot = @time
                    AND r.status != 'cancelled'
                )
                ORDER BY ABS(t.capacity - @partySize) ASC`);

            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async CheckTableAvailability(table_id, reservation_date, time_slot) {
        try {
            console.log('tableid:',table_id,'date:',reservation_date,'time:',time_slot);
            const pool = await poolPromise;
            const result = await pool.request().
            input('table_id', sql.Int, table_id).
            input('reservation_date', sql.Date, reservation_date)
           .input('time_slot', sql.Time.time_slot).query(`SELECT COUNT(*) AS reservation_count FROM Reservations 
                        WHERE table_id = @table_id 
                        AND reservation_date = @reservation_date 
                        AND time_slot = @time_slot 
                        AND status != 'cancelled'`);

            return result.recordset;

        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async GetReservationsByEmail(email) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('email', sql.NVarChar, email).query(`SELECT r.*, t.capacity AS table_capacity 
                                                                                            FROM Reservations r
                                                                                            JOIN Users u ON r.user_id = u.user_id
                                                                                            JOIN Tables t ON r.table_id = t.table_id
                                                                                            WHERE u.email = @email
                                                                                            ORDER BY r.reservation_date DESC, r.time_slot DESC`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }
    },

    async CreateReservation(user_id, table_id, reservation_date, time_slot) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('user_id', sql.Int, user_id)
                .input('table_id', sql.Int, table_id)
                .input('reservation_date', sql.Date, reservation_date)
                .input('time_slot', sql.Time, time_slot)
                .query(`
                    INSERT INTO Reservations (user_id, table_id, reservation_date, time_slot, status)
                    VALUES (@user_id, @table_id, @reservation_date, @time_slot, 'confirmed');
    
                    SELECT SCOPE_IDENTITY() AS reservation_id;
                `);
    
            const reservation_id = result.recordset[0].reservation_id;
    
            return {
                reservation_id,
                user_id,
                table_id,
                reservation_date,
                time_slot,
                status: 'confirmed'
            };
        } catch (err) {
            console.error('SQL error', err);
            throw err;
        }
    },    

    async  UpdateReservationStatus(reservation_id,status )
    {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('reservation_id', sql.Int, parseInt(reservation_id))
            .input('status',sql.NVarChar,status)
            .query(`    UPDATE Reservations SET status = @status WHERE reservation_id = @reservation_id`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }  
    }

};

module.exports = Reservations;