const express = require('express');
const router = express.Router();
const DishReviewsController = require('../controllers/dishreviewsController');

// Get all dish reviews (basic)
router.get('/', DishReviewsController.getAllDishReviews);

// Get dish reviews with detailed information
router.get('/detailed', DishReviewsController.getDishReviews);

// Create a new dish review
router.post('/', DishReviewsController.createDishReview);

module.exports = router;