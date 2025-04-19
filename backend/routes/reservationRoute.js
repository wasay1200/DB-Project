const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/reservationController');

// Reservation routes
router.get('/', ReservationController.getAllReservations);

// User routes
router.get('/users', ReservationController.getAllUsers);
router.get('/users/:email', ReservationController.getUserByEmail);
router.post('/users', ReservationController.createUser);

// Table routes
router.get('/tables', ReservationController.getAllTables);
router.get('/available-tables', ReservationController.getAvailableTables);
router.get('/check-availability', ReservationController.checkTableAvailability);

// Reservation management routes 
router.get('/by-email/:email', ReservationController.getReservationsByEmail);
router.post('/', ReservationController.createReservation);
router.put('/:reservation_id/status', ReservationController.updateReservationStatus);

module.exports = router;