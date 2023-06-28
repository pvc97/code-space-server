const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const { Role } = require('../models');

const {
  updateFcmToken,
  testNotification,
  getAllNotifications,
} = require('../controllers/notification_controller');

const notificationRouter = express.Router();

notificationRouter.put('/', authenticate, updateFcmToken);
notificationRouter.get('/', authenticate, getAllNotifications);
notificationRouter.get(
  '/test',
  authenticate,
  authorize([Role.Manager]),
  testNotification
);

module.exports = notificationRouter;
