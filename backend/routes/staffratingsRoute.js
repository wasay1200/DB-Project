const express = require('express');
const router = express.Router();
const StaffRatingsController = require('../controllers/staffratingsController');

// Get all staff ratings
router.get('/', StaffRatingsController.getAllStaffRatings);
router.get('/staff', StaffRatingsController.getAllStaff);
router.get('/staff/:staff_id', StaffRatingsController.getStaffRating);
router.post('/', StaffRatingsController.createStaffRatings);    

module.exports = router;