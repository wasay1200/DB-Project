const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

// Get all menu items
router.get('/', MenuController.getAllMenu);

// Get menu items with ratings
router.get('/with-ratings', MenuController.getMenuItemsWithRatings);

// Get menu items by category
router.get('/category/:category', MenuController.getMenuItemsByCategory);

// Get available menu stock
router.get('/stock', MenuController.getAvailableMenuStock);

// Update menu stock
router.put('/stock', MenuController.updateMenuStock);

// Get menu stock by menu ID
router.get('/stock/:menu_id', MenuController.getMenuStockByMenuId);

module.exports = router;