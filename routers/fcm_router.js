const express = require('express');
const { sendNotification } = require('../controllers/fcm_controller');

const fcmRouter = express.Router();

// Only teacher can get all languages
fcmRouter.get('/', sendNotification);

module.exports = fcmRouter;
