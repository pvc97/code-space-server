'use strict';
const translate = require('../utils/translate');
const { User, FCMToken } = require('../models');
const sendNotification = require('../services/notification_service');

const testNotification = async (req, res) => {
  sendNotification(
    'Hello!',
    'This is a test notification',
    {
      foo: 'bar',
    },
    [
      '04f66c12-3421-4a71-9985-ed630ee56ad1',
      'c69a7ecd-5638-428d-bf18-a1a448200a2b',
    ]
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

module.exports = {
  testNotification,
  updateFcmToken,
};
