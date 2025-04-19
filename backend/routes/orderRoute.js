const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');

// Get all orders
router.get('/', OrderController.getAllOrders);

// Get all order items
router.get('/items', OrderController.getAllOrderItems);

// Create a new order
router.post('/', OrderController.createOrder);

// Create a new order item
router.post('/items', OrderController.createOrderItem);

// Get orders for a specific user
router.get('/user/:user_id', OrderController.getUserOrders);

// Get details for a specific order
router.get('/:order_id', OrderController.getOrderDetails);


module.exports = router;