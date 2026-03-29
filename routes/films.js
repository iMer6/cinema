const express = require('express');
const router = express.Router();
const filmController = require("../controllers/filmController");

router.get('/', filmController.getAllFilms);

router.get('/add_film', filmController.getAddFilmPage);

router.post('/add_film', filmController.createFilm);

router.get('/statistic', filmController.getFilmStatistic);

router.get('/:id', filmController.getFilmById);

router.get('/:id/update', filmController.getUpdatePage);

router.put('/update', filmController.updateFilm);

router.delete('/:id/delete', filmController.deleteFilm);

module.exports = router;