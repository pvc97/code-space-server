'use strict';
const translate = require('../utils/translate');
const {
  User,
  FCMToken,
  UserNotification,
  Notification,
  sequelize,
} = require('../models');
const { DEFAULT_LIMIT, DEFAULT_PAGE } = require('../constants/constants');
const sendNotification = require('../services/notification_service');

const testNotification = async (req, res) => {
  sendNotification(
    'Hello!',
    'This is a test notification',
    {
      foo: 'bar',
    },
    ['3ee85d57-a284-4dce-b1e0-8b314f4bcabc']
  );
  return res.sendStatus(204);
};

const updateFcmToken = async (req, res) => {
  try {
    const fcmToken = req.body.fcmToken;
    const userId = req.user.id;

    if (!fcmToken) {
      return res
        .status(403)
        .send({ error: translate('token_required', req.hl) });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res
        .status(404)
        .send({ error: translate('user_not_found', req.hl) });
    }

    const fcmTokenModel = await FCMToken.findOne({
      where: {
        token: fcmToken,
      },
    });

    const current = new Date();
    // Create expiresAt is 30 days from now
    const expiresAt = current.setDate(current.getDate() + 30);

    if (!fcmTokenModel) {
      // When user login for the first time in a new device,

      await FCMToken.create({
        token: fcmToken,
        userId: userId,
        expiresAt: expiresAt,
      });
    } else {
      // User open app again in the same device
      // or user logout and login again in the same device
      // or user logout and login another account in the same device
      // => update userId
      // => update expiresAt

      await FCMToken.update(
        {
          userId: userId,
          userId: userId,
          expiresAt: expiresAt,
        },
        {
          where: {
            token: fcmToken,
          },
        }
      );
    }

    return res.sendStatus(204);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const limit = req.query.limit * 1 || DEFAULT_LIMIT;
    // if req.query.limit is text => req.query.limit * 1 = NaN => limit = DEFAULT_LIMIT
    const page = req.query.page * 1 || DEFAULT_PAGE;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Get all notifications of user
    // through UserNotification table
    const notifications = await UserNotification.findAll({
      where: {
        userId: userId,
      },
      attributes: [
        [sequelize.literal('notification.id'), 'id'],
        [sequelize.literal('notification.title'), 'title'],
        [sequelize.literal('notification.body'), 'body'],
        [sequelize.literal('notification.data'), 'data'],
        [sequelize.literal('notification.createdAt'), 'createdAt'],
      ],
      include: [
        {
          model: Notification,
          as: 'notification',
          attributes: [],
        },
      ],
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).send({ notifications });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  updateFcmToken,
  getAllNotifications,
  testNotification,
};
