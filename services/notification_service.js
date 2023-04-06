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
const sendNotification = async (message) => {
  try {
    if (message.tokens) {
      // message.tokens defined
      // Send message to a multiple devices
      const response = await admin.messaging().sendMulticast(message);
      //   console.log('response:', response);
      removeInvalidToken(message, response);
    } else {
      // message.token defined
      // Send message to a single device
      const response = await admin.messaging().send(message);
      //   console.log('response:', response);
      removeInvalidToken(message, response);
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
