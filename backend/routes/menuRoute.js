const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

// Get all menu items
router.get('/', MenuController.getAllMenu);

// Get menu items with ratings
router.get('/with-ratings', MenuController.getMenuItemsWithRatings);

module.exports = router;