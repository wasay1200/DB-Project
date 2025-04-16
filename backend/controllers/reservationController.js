const Reservations = require('../models/reservationModel');

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
            
            const result = await Reservations.GetAvailableTables(date, time, parseInt(partySize));
            if (result.recordset && result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No available tables for the specified criteria'
                });
            }
            
            res.status(200).json({
                success: true,
                data: result.recordset
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
            const { table_id, reservation_date, time_slot } = req.body;
            
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
            
            const result = await Reservations.CreateReservation(user_id, table_id, reservation_date, time_slot);
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
            const validStatuses = ['confirmed', 'cancelled', 'completed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be one of: confirmed, cancelled, completed'
                });
            }
            
            const result = await Reservations.UpdateReservationStatus(reservation_id, status);
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
    }
};

module.exports = ReservationController;