const express = require('express');
const router = express.Router();
const cinemaController = require("../controllers/cinemaController");

router.get('/', cinemaController.getAllCinemas);

// router.get('/add_cinema', cinemaController.getAddCinemaPage);

// router.post('/add_cinema', cinemaController.createCinema);

// router.get('/:id', cinemaController.getCinemaById);

// router.get('/:id/update', cinemaController.getUpdatePage);

// router.put('/update', cinemaController.updateCinema);

// router.delete('/:id/delete', cinemaController.deleteCinema);

module.exports = router;