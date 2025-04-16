const express = require('express');
const router = express.Router();
const StaffRatingsController = require('../controllers/staffratingsController');

// Get all staff ratings
router.get('/', StaffRatingsController.getAllStaffRatings);

module.exports = router;