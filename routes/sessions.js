const express = require('express');
const router = express.Router();
const sessionController = require("../controllers/sessionController");

router.get('/statistic', sessionController.getSessionStatistic);
router.get('/film/:id', sessionController.getFilmSessions);

module.exports = router;