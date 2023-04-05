const express = require('express');
const {
  sendNotification,
  updateFcmToken,
} = require('../controllers/notification_controller');

const notificationRouter = express.Router();

// Only teacher can get all languages
notificationRouter.get('/', sendNotification);
notificationRouter.put('/notifications', updateFcmToken);

module.exports = notificationRouter;
