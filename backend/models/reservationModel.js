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
            console.log('Creating user in database:', { name, email, role });
            const pool = await poolPromise;
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('password', sql.NVarChar, password)
                .input('role', sql.NVarChar, role)
                .query(`INSERT INTO Users (name, email, password, role) VALUES (@name, @email, @password, @role);`);
            
            console.log('User creation result:', result);
            return result;
        } catch (err) {
            console.error('SQL error in CreateUser:', err);
            // If this is a duplicate key error (user already exists)
            if (err.number === 2627 || err.number === 2601) {
                console.log('User already exists with email:', email);
                // Return the existing user instead of throwing an error
                return this.getUserByEmail(email);
            }
            throw err;
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
            console.log('GetAvailableTables model params:', { 
                date: date, 
                time: time.toTimeString().split(' ')[0],
                partySize: partySize 
            });
            
            // Format date for SQL Server if needed
            let sqlDate = date;
            if (typeof date === 'string') {
                // Convert from YYYY-MM-DD to SQL Server date
                const dateParts = date.split('-');
                if (dateParts.length === 3) {
                    sqlDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    console.log('Converted date string to Date object:', sqlDate);
                }
            }
            
            const pool = await poolPromise;
            const result = await pool.request()
                .input('date', sql.Date, sqlDate)
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

            console.log('SQL query result rows:', result.recordset ? result.recordset.length : 0);
            return result.recordset;
        } catch (err) {
            console.error('SQL error in GetAvailableTables:', err);
            throw err;
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
            console.log('CreateReservation model params:', { 
                user_id, 
                table_id, 
                reservation_date, 
                time_slot: time_slot.toTimeString ? time_slot.toTimeString().split(' ')[0] : time_slot 
            });
            
            // Format date for SQL Server if needed
            let sqlDate = reservation_date;
            if (typeof reservation_date === 'string') {
                // Convert from YYYY-MM-DD to SQL Server date
                const dateParts = reservation_date.split('-');
                if (dateParts.length === 3) {
                    sqlDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    console.log('Converted date string to Date object:', sqlDate);
                }
            }
            
            const pool = await poolPromise;
            const result = await pool.request()
                .input('user_id', sql.Int, user_id)
                .input('table_id', sql.Int, table_id)
                .input('reservation_date', sql.Date, sqlDate)
                .input('time_slot', sql.Time, time_slot)
                .query(`
                    INSERT INTO Reservations (user_id, table_id, reservation_date, time_slot, status)
                    VALUES (@user_id, @table_id, @reservation_date, @time_slot, 'confirmed');
    
                    SELECT SCOPE_IDENTITY() AS reservation_id;
                `);
    
            const reservation_id = result.recordset[0].reservation_id;
            console.log('Created reservation with ID:', reservation_id);
    
            return {
                reservation_id,
                user_id,
                table_id,
                reservation_date,
                time_slot,
                status: 'confirmed'
            };
        } catch (err) {
            console.error('SQL error in CreateReservation:', err);
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
    },

    async  DeleteReservationByID(reservation_id )
    {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input('reservation_id', sql.Int, parseInt(reservation_id))
            .query(` exec delRes @reservation_id`);
            return result.recordset;
        } catch (err) {
            console.error('SQL error', err);
            return err;
        }  
    },

    async getTableInfo(table_id) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('table_id', sql.Int, table_id)
                .query('SELECT * FROM Tables WHERE table_id = @table_id');
            return result.recordset[0];
        } catch (err) {
            console.error('SQL error in getTableInfo:', err);
            return null;
        }
    },

};

module.exports = Reservations;