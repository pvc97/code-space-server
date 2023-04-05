'use strict';
const translate = require('../utils/translate');
const admin = require('firebase-admin');
const serviceAccount = require('../config/fb_fcm_key.json');
const { User, FCMToken } = require('../models');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://XXXX.firebaseio.com',
  // databaseURL property is for the Firebase Realtime Database,
  // it is an optional configuration option,
  // and is only required if I need to access the Firebase Realtime Database
});

const sendNotification = async (req, res) => {
  // message payload must less than 4KB
  // https://stackoverflow.com/questions/70575492/firebase-admin-sdk-sendmulticast
  // So if there are a lot of tokens, we should split them into multiple requests
  const message = {
    notification: {
      title: 'Hello!',
      body: 'This is a test notification',
    },
    data: {
      foo: 'bar',
    },
    tokens: [
      'cu27-QPwRE2sj__4jBFrHK:APA91bHHPA_AXINhHeRWy3MRHxVk6ElsJJvd-EK93yBTcdGwugE_Suf55XLf5vMp479tS0beO1kmRSz_dCpSlLGvkBeBrDb5lPpxlYJB8jcXQ4B5YpVk7NweibrIB6zvxzRpolYoxHbM',
    ],
  };

  // If I want to send a message to a single device,
  // In the message payload, I should use token instead of tokens
  // then use send() method instead of sendMulticast()

  try {
    // Note: A multicast message containing up to 500 tokens.
    // How to split tokens into multiple requests?
    // https://anonystick.com/blog-developer/sendmulticast-firebase-500-tokens-2021090696569871
    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent message:', response);

    return res.status(200).send({ data: response });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
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
  sendNotification,
  updateFcmToken,
};
