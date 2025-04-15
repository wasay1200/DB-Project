const Menu = require('../models/menuModel');

const MenuController = {
    // Get all menu items
    async getAllMenu(req, res) {
        try {
            const menuItems = await Menu.getAllMenu();
            res.status(200).json({
                success: true,
                data: menuItems
            });
        } catch (error) {
            console.error('Error in getAllMenu controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving menu items',
                error: error.message
            });
        }
    },

    // Get menu items with their ratings
    async getMenuItemsWithRatings(req, res) {
        try {
            const menuItemsWithRatings = await Menu.GetMenuItemsWithRatings();
            res.status(200).json({
                success: true,
                data: menuItemsWithRatings
            });
        } catch (error) {
            console.error('Error in getMenuItemsWithRatings controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving menu items with ratings',
                error: error.message
            });
        }
    }
};

module.exports = MenuController;