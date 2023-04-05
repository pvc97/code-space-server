const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');

const {
  sendNotification,
  updateFcmToken,
} = require('../controllers/notification_controller');

const notificationRouter = express.Router();

// Only teacher can get all languages
notificationRouter.get('/', sendNotification);
notificationRouter.put('/', authenticate, updateFcmToken);

module.exports = notificationRouter;
