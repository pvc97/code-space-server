const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');

const {
  updateFcmToken,
  getAllNotifications,
} = require('../controllers/notification_controller');

const notificationRouter = express.Router();

notificationRouter.put('/', authenticate, updateFcmToken);
notificationRouter.get('/', authenticate, getAllNotifications);

module.exports = notificationRouter;
