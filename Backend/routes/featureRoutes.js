const express = require('express');
const featureController = require('./../controllers/featureController');
const router = express();

router.post('/createQuiz', featureController.createQuiz);

module.exports = router;
