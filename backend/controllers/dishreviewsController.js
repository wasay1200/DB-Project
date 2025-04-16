const DishReviews = require('../models/dishreviewsModel');

const DishReviewsController = {
    // Get all dish reviews
    async getAllDishReviews(req, res) {
        try {
            const dishReviews = await DishReviews.getAllDishReviews();
            res.status(200).json({
                success: true,
                data: dishReviews
            });
        } catch (error) {
            console.error('Error in getAllDishReviews controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving dish reviews',
                error: error.message
            });
        }
    },

    // Create a new dish review
    async createDishReview(req, res) {
        try {
            const { user_id, menu_id, rating, comment } = req.body;
            
            // Validate required fields
            if (!user_id || !menu_id || !rating) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide user_id, menu_id, and rating'
                });
            }
            
            const result = await DishReviews.CreateDishReview(user_id, menu_id, rating, comment);
            res.status(201).json({
                success: true,
                message: 'Dish review created successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in createDishReview controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating dish review',
                error: error.message
            });
        }
    },
    
    // Get dish reviews with detailed information
    async getDishReviews(req, res) {
        try {
            const dishReviews = await DishReviews.GetDishReviews();
            res.status(200).json({
                success: true,
                data: dishReviews
            });
        } catch (error) {
            console.error('Error in getDishReviews controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving detailed dish reviews',
                error: error.message
            });
        }
    }
};

module.exports = DishReviewsController;