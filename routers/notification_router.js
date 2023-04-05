const express = require('express');
const { sendNotification } = require('../controllers/notification_controller');

const notificationRouter = express.Router();

// Only teacher can get all languages
notificationRouter.get('/', sendNotification);

module.exports = notificationRouter;
