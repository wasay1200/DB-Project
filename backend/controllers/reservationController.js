const Reservations = require('../models/reservationModel');
const { sendReservationConfirmation } = require('../utils/emailService');
const { poolPromise } = require('../config/db');

const ReservationController = {
    // Get all reservations
    async getAllReservations(req, res) {
        try {
            const reservations = await Reservations.getAllReservations();
            res.status(200).json({
                success: true,
                data: reservations
            });
        } catch (error) {
            console.error('Error in getAllReservations controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving reservations',
                error: error.message
            });
        }
    },

    // Get all users
    async getAllUsers(req, res) {
        try {
            const users = await Reservations.getAllUsers();
            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Error in getAllUsers controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving users',
                error: error.message
            });
        }
    },

    // Get user by email
    async getUserByEmail(req, res) {
        try {
            const { email } = req.params;
            const user = await Reservations.getUserByEmail(email);
            
            if (user.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: user[0]
            });
        } catch (error) {
            console.error('Error in getUserByEmail controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user',
                error: error.message
            });
        }
    },

    // Create a new user
    async createUser(req, res) {
        try {
            const { name, email, password, role } = req.body;
            
            // Validate required fields
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide name, email, and password'
                });
            }
            
            // Check if user already exists
            const existingUser = await Reservations.getUserByEmail(email);
            if (existingUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            
            // Default role to 'customer' if not provided
            const userRole = role || 'customer';
            
            const result = await Reservations.CreateUser(name, email, password, userRole);
            res.status(201).json({
                success: true,
                message: 'User created successfully'
            });
        } catch (error) {
            console.error('Error in createUser controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating user',
                error: error.message
            });
        }
    },

    // Get all tables
    async getAllTables(req, res) {
        try {
            const tables = await Reservations.GetAllTables();
            res.status(200).json({
                success: true,
                data: tables
            });
        } catch (error) {
            console.error('Error in getAllTables controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving tables',
                error: error.message
            });
        }
    },

    // Get available tables
    async getAvailableTables(req, res) {
        try {
            const { date, time, partySize } = req.query; 
            // Validate required fields
            if (!date || !time || !partySize) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide date, time, and partySize'
                });
            }
            
            console.log('GetAvailableTables() Params:', { date, time, partySize });
            
            // Convert time string to a proper time object
            const timeParts = time.split(':');
            const timeObject = new Date();
            timeObject.setHours(parseInt(timeParts[0], 10));
            timeObject.setMinutes(parseInt(timeParts[1], 10));
            timeObject.setSeconds(parseInt(timeParts[2] || '0', 10));
            
            console.log('Converted time object:', {
                original: time,
                hours: timeObject.getHours(),
                minutes: timeObject.getMinutes(),
                seconds: timeObject.getSeconds(),
                timeString: timeObject.toTimeString()
            });
            
            const result = await Reservations.GetAvailableTables(date, timeObject, parseInt(partySize, 10));
            console.log('Available tables result:', {
                available: result.available,
                message: result.message,
                tableCount: result.tables ? result.tables.length : 0,
                tables: result.tables
            });
            
            res.status(200).json({
                success: true,
                available: result.available,
                message: result.message,
                data: result.tables
            });
        } catch (error) {
            console.error('Error in getAvailableTables controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving available tables',
                error: error.message
            });
        }
    },

    // Check table availability
    async checkTableAvailability(req, res) {
        try {
            const { table_id, reservation_date, time_slot } = req.query;
            // Validate required fields
            if (!table_id || !reservation_date || !time_slot) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide table_id, reservation_date, and time_slot'
                });
            }
            
            const result = await Reservations.CheckTableAvailability(table_id, reservation_date, time_slot);
            const isAvailable = result[0].reservation_count === 0;
            
            res.status(200).json({
                success: true,
                available: isAvailable
            });
        } catch (error) {
            console.error('Error in checkTableAvailability controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking table availability',
                error: error.message
            });
        }
    },

    // Get reservations by email
    async getReservationsByEmail(req, res) {
        try {
            const { email } = req.params;
            const reservations = await Reservations.GetReservationsByEmail(email);
            
            res.status(200).json({
                success: true,
                data: reservations
            });
        } catch (error) {
            console.error('Error in getReservationsByEmail controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving reservations by email',
                error: error.message
            });
        }
    },

    // Create a new reservation
    async createReservation(req, res) {
        try {
            const { user_id, table_id, reservation_date, time_slot } = req.body;
            
            // Validate required fields
            if (!user_id || !table_id || !reservation_date || !time_slot) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide user_id, table_id, reservation_date, and time_slot'
                });
            }

            // Convert time string to UTC time
            const [hours, minutes, seconds] = time_slot.split(':').map(Number);
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${(seconds || 0).toString().padStart(2, '0')}`;
            
            // Check table availability before proceeding
            const availabilityResult = await Reservations.CheckTableAvailability(table_id, reservation_date, timeString);
            if (availabilityResult[0].reservation_count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This table is already reserved for the selected date and time. Please choose a different table or time slot.'
                });
            }
            
            const result = await Reservations.CreateReservation(user_id, table_id, reservation_date, timeString);
            res.status(201).json({
                success: true,
                message: 'Reservation created successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in createReservation controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating reservation',
                error: error.message
            });
        }
    },

    // Create user (if needed) and reservation - handles frontend form submission
    async createUserAndReservation(req, res) {
        try {
            console.log('createUserAndReservation called with body:', JSON.stringify(req.body, null, 2));
            
            const { name, email, password, table_id, reservation_date, time_slot, special_requests } = req.body;
            
            // Validate required fields
            if (!name || !email || !table_id || !reservation_date || !time_slot) {
                console.log('Missing required fields:', { name, email, table_id, reservation_date, time_slot });
                return res.status(400).json({
                    success: false,
                    message: 'Please provide name, email, table_id, reservation_date, and time_slot'
                });
            }
            
            // Convert time string to UTC time
            const [hours, minutes, seconds] = time_slot.split(':').map(Number);
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${(seconds || 0).toString().padStart(2, '0')}`;
            console.log('Converted time string:', timeString);
            
            // Check table availability before proceeding
            const availabilityResult = await Reservations.CheckTableAvailability(table_id, reservation_date, timeString);
            if (availabilityResult[0].reservation_count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'This table is already reserved for the selected date and time. Please choose a different table or time slot.'
                });
            }

            // Start a transaction to ensure atomicity
            const pool = await poolPromise;
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                console.log('Looking up user with email:', email);
                // Check if user exists
                let user = await Reservations.getUserByEmail(email);
                console.log('User lookup result:', user);
                let user_id;
                
                if (user && user.length > 0) {
                    // User exists
                    user_id = user[0].user_id;
                    console.log('Existing user found, user_id:', user_id);
                } else {
                    // Create new user
                    console.log('Creating new user with:', { name, email });
                    const defaultPassword = password || 'default_password';
                    await Reservations.CreateUser(name, email, defaultPassword, 'customer');
                    
                    // Get the newly created user
                    console.log('Fetching newly created user');
                    user = await Reservations.getUserByEmail(email);
                    if (!user || user.length === 0) {
                        throw new Error('Failed to create user');
                    }
                    user_id = user[0].user_id;
                    console.log('New user created with user_id:', user_id);
                }
                
                // Double-check table availability after user creation
                const recheckAvailability = await Reservations.CheckTableAvailability(table_id, reservation_date, timeString);
                if (recheckAvailability[0].reservation_count > 0) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'This table was just reserved by another user. Please choose a different table or time slot.'
                    });
                }
                
                // Create reservation
                console.log('Creating reservation with:', { user_id, table_id, reservation_date, time: timeString });
                const result = await Reservations.CreateReservation(user_id, table_id, reservation_date, timeString);
                console.log('Reservation created successfully:', result);

                // Get table capacity for the email
                const tableInfo = await Reservations.getTableInfo(table_id);
                const table_capacity = tableInfo ? tableInfo.capacity : 'N/A';
                
                // Commit the transaction
                await transaction.commit();
                
                // Send confirmation email
                try {
                    await sendReservationConfirmation({
                        name,
                        email,
                        reservation_date,
                        time_slot: timeString,
                        table_id,
                        table_capacity,
                        reservation_id: result.reservation_id
                    });
                    console.log('Confirmation email sent successfully');
                } catch (emailError) {
                    console.error('Failed to send confirmation email:', emailError);
                    // Don't fail the reservation if email fails
                }
                
                res.status(201).json({
                    success: true,
                    message: 'Reservation created successfully',
                    data: result
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in createUserAndReservation controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating reservation',
                error: error.message
            });
        }
    },

    // Update reservation status
    async updateReservationStatus(req, res) {
        try {
            const { reservation_id } = req.params;
            const { status } = req.body;
            
            // Validate required fields
            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide status'
                });
            }
            
            // Validate status value
            const validStatuses = ['confirmed', 'cancelled', 'pending'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be one of: confirmed, cancelled, pending'
                });
            }
            
            const result = await Reservations.UpdateReservationStatus(reservation_id, status);
           // console.log("Rows affected:", result.rowsAffected);
            res.status(200).json({
                success: true,
                message: `Reservation status updated to ${status} successfully`
            });
        } catch (error) {
            console.error('Error in updateReservationStatus controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating reservation status',
                error: error.message
            });
        }
    },
    async DeleteReservationByID(req, res) {
        try {
            const { reservation_id } = req.params;
            const resDel = await Reservations.DeleteReservationByID(reservation_id);
            res.status(200).json({
                success: true,
                data: resDel
            });
        } catch (error) {
            console.error('Error in DeleteReservationByID controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting Reservation by ID',
                error: error.message
            });
        }
    }
};

module.exports = ReservationController;