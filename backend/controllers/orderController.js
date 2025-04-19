const Order = require('../models/orderModel');

const OrderController = {
    // Get all orders
    async getAllOrders(req, res) {
        try {
            const orders = await Order.getAllOrders();
            res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            console.error('Error in getAllOrders controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving orders',
                error: error.message
            });
        }
    },

    // Get all order items
    async getAllOrderItems(req, res) {
        try {
            const orderItems = await Order.GetAllOrderItems();
            res.status(200).json({
                success: true,
                data: orderItems
            });
        } catch (error) {
            console.error('Error in getAllOrderItems controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving order items',
                error: error.message
            });
        }
    },

    // Create a new order
    async createOrder(req, res) {
        try {
            const { user_id, reservation_id, total_price } = req.body;
            
            // Validate required fields
            if (!user_id || !total_price) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide user_id and total_price'
                });
            }
            
            const result = await Order.CreateOrder(user_id, reservation_id, total_price);
            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in createOrder controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating order',
                error: error.message
            });
        }
    },

    // Create a new order item
    async createOrderItem(req, res) {
        try {
            const { order_id, menu_id, quantity } = req.body;
            
            // Validate required fields
            if (!order_id || !menu_id || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide order_id, menu_id, and quantity'
                });
            }
            
            const result = await Order.CreateOrderItem(order_id, menu_id, quantity);
            res.status(201).json({
                success: true,
                message: 'Order item created successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in createOrderItem controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating order item',
                error: error.message
            });
        }
    },

    // Get orders for a specific user
    async getUserOrders(req, res) {
        try {
            const { user_id } = req.params;
            
            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide user_id'
                });
            }
            
            const orders = await Order.GetUserOrders(parseInt(user_id)); //parseInt converts the input string into integer
            res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            console.error('Error in getUserOrders controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user orders',
                error: error.message
            });
        }
    },

    // Get details for a specific order
    async getOrderDetails(req, res) {
        try {
            const { order_id } = req.params;
            
            if (!order_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide order_id'
                });
            }
            
            const orderDetails = await Order.GetOrderDetails(parseInt(order_id));
            
            if (!orderDetails || orderDetails.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: orderDetails[0]
            });
        } catch (error) {
            console.error('Error in getOrderDetails controller:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving order details',
                error: error.message
            });
        }
    }
};

module.exports = OrderController;