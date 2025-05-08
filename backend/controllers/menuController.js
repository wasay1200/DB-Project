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
    },

    async getMenuItemsByCategory(req, res) {
        try {
            const { category } = req.params;
            const menuItems = await Menu.getMenuItemsByCategory(category);
            res.status(200).json({
                success: true,
                data: menuItems
            });
        } catch (error) {
            console.error('Error in getMenuItemsByCategory controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving menu items by category',
                error: error.message
            });
        }
    },

    async getAvailableMenuStock(req, res) {
        try {
            const menuStock = await Menu.getAvailableMenuStock();
            res.status(200).json({
                success: true,
                data: menuStock
            });
        } catch (error) {
            console.error('Error in getAvailableMenuStock controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving available menu stock',
                error: error.message
            });
        }
    },

    async updateMenuStock(req, res) {
        try {
            const { menu_id, quantity } = req.body;
            const updatedStock = await Menu.updateMenuStock(menu_id, quantity);
            res.status(200).json({
                success: true,
                data: updatedStock
            });
        } catch (error) {
            console.error('Error in updateMenuStock controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating menu stock',
                error: error.message
            });
        }
    },

    async getMenuStockByMenuId(req, res) {
        try {
            const { menu_id } = req.params;
            const menuStock = await Menu.getMenuStockByMenuId(menu_id);
            res.status(200).json({
                success: true,
                data: menuStock
            });
        } catch (error) {
            console.error('Error in getMenuStockByMenuId controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving menu stock by menu ID',
                error: error.message
            });
        }
    }
};

module.exports = MenuController;