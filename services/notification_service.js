const admin = require('firebase-admin');
const serviceAccount = require('../config/fb_fcm_key.json');
const { FCMToken } = require('../models');

/*
Example message payload:

    - If you want to send a message to a single device,
    - In the message payload, I should use token instead of tokens
    - then use send() method instead of sendMulticast()

    - Message payload must less than 4KB
    - https://stackoverflow.com/questions/70575492/firebase-admin-sdk-sendmulticast
    - So if there are a lot of tokens, we should split them into multiple requests

    - Note: A multicast message containing up to 500 tokens.
    - How to split tokens into multiple requests?
    - https://anonystick.com/blog-developer/sendmulticast-firebase-500-tokens-2021090696569871

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

*/

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://XXXX.firebaseio.com',
  // databaseURL property is for the Firebase Realtime Database,
  // it is an optional configuration option,
  // and is only required if I need to access the Firebase Realtime Database
});

// Send a message to multiple devices
const sendNotification = async (title, body, data, userIds) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
    };

    const tokens = await FCMToken.findAll({
      where: { userId: userIds },
      attributes: ['token'],
    });

    if (tokens.length === 0) return;

    // I don't check tokens.length == 1 to send a message to a single device with send() method
    // because if token is invalid, send() method will throw an error instead of return a response
    if (tokens.length <= 500) {
      // Send message to a multiple devices
      message.tokens = tokens.map((token) => token.token);
      const response = await admin.messaging().sendMulticast(message);
      removeInvalidToken(message, response);
    } else {
      // Send message to a 500 devices each time
      const chunkSize = 500;
      for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);

        message.tokens = chunk.map((token) => token.token);
        const response = await admin.messaging().sendMulticast(message);

        removeInvalidToken(message, response);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// Send a message to a single device
const removeInvalidToken = async (message, response) => {
  const tokensToRemove = [];
  response.responses.forEach((result, index) => {
    const error = result.error;
    if (error) {
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-argument'
      ) {
        tokensToRemove.push(message.tokens[index]);
      }
    }
  });
  console.log('tokensToRemove:', tokensToRemove);
  if (tokensToRemove.length > 0) {
    await FCMToken.destroy({ where: { token: tokensToRemove } });
  }
};

module.exports = sendNotification;
