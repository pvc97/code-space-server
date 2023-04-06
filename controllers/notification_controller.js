'use strict';
const translate = require('../utils/translate');
const { User, FCMToken } = require('../models');
const sendNotification = require('../services/notification_service');

const testNotification = async (req, res) => {
  const message = {
    notification: {
      title: 'Hello!',
      body: 'This is a test notification',
    },
    data: {
      foo: 'bar',
    },
    tokens: [
      'eT8YoM73SB6VGUX80cKLvN:APA91bHb5fo0oLHbh-b7CQqHgrTh858GtrPb2zDKi32Ss6fK8k-EE_5m0sYfnG9uFrZL32aQmUjuoMtUVnM4Y7NmAIH6Qjb_k1RgOigQCX7REYa8eCLgLi0ZfQXDHOoYrT6AUa44xhGn',
      'eT8YoM73SB6VGUX80cKLvN:APA91bHb5fo0oLHbh-b7CQqHgrTh858GtrPb2zDKi32Ss6fK8k-EE_5m0sYfnG9uFrZL32aQmUjuoMtUVnM4Y7NmAIH6Qjb_k1RgOigQCX7REYa8eCLgLe0ZfQXDHOoYrT6AUa44xhGn',
      'cAXubjR-RDmIHYjLJQrjOU:APA91bHqmb0zUNa01HPkYydDgCRSauT1OrUVHPY8sM6JuTOPm5SpdbPp1-cdJUNwXzlYAgYthQtTjOIaXtVdybcNc5OKvzntz8dl-e4O8c_QXSWFyUtiSsadN3e_yZoNIB4mqBxJrieM',
    ],
  };

  sendNotification(message);
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
