const { sql, poolPromise } = require('../config/db');
//all the procedures based on users data, reservation data are here
const Reservations = {

    async getAllReservations() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`SELECT 
                r.reservation_id,
                r.user_id,
                r.table_id,
                CONVERT(varchar, r.reservation_date, 23) as reservation_date,
                CONVERT(varchar, r.time_slot, 108) as time_slot,
                r.status,
                u.name AS customer_name,
                u.email 
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
                // Convert from YYYY-MM-DD to UTC date
                const [year, month, day] = date.split('-').map(Number);
                // Create date in UTC to prevent timezone shifts
                sqlDate = new Date(Date.UTC(year, month - 1, day));
                console.log('Converted date string to UTC Date object:', sqlDate);
            }
            
            const pool = await poolPromise;
            const timeString = time.toTimeString().split(' ')[0];
            console.log('Using time string for SQL:', timeString);

            const query = `
                SELECT 
                    t.*,
                    CASE 
                        WHEN t.capacity = @partySize THEN 'Perfect Fit'
                        ELSE CONCAT('Seats ', t.capacity)
                    END AS capacity_display,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 
                            FROM Reservations r 
                            WHERE r.table_id = t.table_id 
                            AND r.reservation_date = @date 
                            AND r.time_slot = @time 
                            AND r.status != 'cancelled'
                        ) THEN 0
                        ELSE 1
                    END as is_available
                FROM Tables t
                WHERE t.capacity >= @partySize
                ORDER BY 
                    is_available DESC,
                    ABS(t.capacity - @partySize) ASC
            `;

            console.log('Executing SQL query with params:', {
                date: sqlDate,
                time: timeString,
                partySize: partySize
            });

            const result = await pool.request()
                .input('date', sql.Date, sqlDate)
                .input('time', sql.Time, timeString)
                .input('partySize', sql.Int, partySize)
                .query(query);

            console.log('SQL query result:', {
                rowCount: result.recordset.length,
                firstRow: result.recordset[0],
                allRows: result.recordset
            });
            
            // Check if any tables are available
            const availableTables = result.recordset.filter(table => table.is_available === 1);
            console.log('Available tables count:', availableTables.length);

            return {
                available: availableTables.length > 0,
                message: availableTables.length > 0 
                    ? `Found ${availableTables.length} available table(s) for your party size`
                    : 'No tables are available for the selected date and time. Please choose a different time slot.',
                tables: result.recordset
            };
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
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT 
                        r.reservation_id,
                        r.user_id,
                        r.table_id,
                        CONVERT(varchar, r.reservation_date, 23) as reservation_date,
                        CONVERT(varchar, r.time_slot, 108) as time_slot,
                        r.status,
                        t.capacity AS table_capacity 
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
                time_slot
            });
            
            // Format date for SQL Server if needed
            let sqlDate = reservation_date;
            if (typeof reservation_date === 'string') {
                // Convert from YYYY-MM-DD to UTC date
                const [year, month, day] = reservation_date.split('-').map(Number);
                // Create date in UTC to prevent timezone shifts
                sqlDate = new Date(Date.UTC(year, month - 1, day));
                console.log('Converted date string to UTC Date object:', sqlDate);
            }

            const pool = await poolPromise;
            
            // First check if a reservation already exists for this table, date, and time
            const checkResult = await pool.request()
                .input('table_id', sql.Int, table_id)
                .input('reservation_date', sql.Date, sqlDate)
                .input('time_slot', sql.Time, time_slot)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM Reservations 
                    WHERE table_id = @table_id 
                    AND reservation_date = @reservation_date 
                    AND time_slot = @time_slot 
                    AND status != 'cancelled'
                `);

            if (checkResult.recordset[0].count > 0) {
                throw new Error('A reservation already exists for this table at the selected date and time');
            }
            
            // If no existing reservation, proceed with creation
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