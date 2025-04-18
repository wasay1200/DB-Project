const StaffRatings = require('../models/staffratingsModel');

const StaffRatingsController = {
    // Get all staff ratings
    async getAllStaffRatings(req, res) {
        try {
            const staffRatings = await StaffRatings.displayAllStaffRatings();
            res.status(200).json({
                success: true,
                data: staffRatings
            });
        } catch (error) {
            console.error('Error in getAllStaffRatings controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving staff ratings',
                error: error.message
            });
        }
    },

    async getAllStaff(req, res) {
        try {
            const staff = await StaffRatings.GetAllStaff();
            res.status(200).json({
                success: true,
                data: staff
            });
        } catch (error) {
            console.error('Error in getAllStaff controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving staff',
                error: error.message
            });
        }
    },

    async getStaffRating(req, res) {
        const staff_id = req.params.staff_id;
        try {
            const staffRatings = await StaffRatings.GetStaffRating(staff_id);
            res.status(200).json({
                success: true,
                data: staffRatings
            });
        } catch (error) {
            console.error('Error in getStaffRating controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving staff ratings',
                error: error.message
            });
        }
    },

    async createStaffRatings(req, res) {
        const { staff_id, user_id, rating, feedback } = req.body;
        try {
            const newRating = await StaffRatings.CreateStaffRatings(staff_id, user_id, rating, feedback);
            res.status(201).json({
                success: true,
                data: newRating
            });
        } catch (error) {
            console.error('Error in createStaffRatings controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating staff rating',
                error: error.message
            });
        }
    }
};

module.exports = StaffRatingsController;