const express = require('express');
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.post('/confirm', bookingController.confirmBooking);
router.get('/confirmation', bookingController.getConfirmationPage);
router.get('/:id', bookingController.getBookingPage);

module.exports = router;