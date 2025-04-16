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
    }
};

module.exports = StaffRatingsController;