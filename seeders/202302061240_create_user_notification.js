'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const user = await queryInterface.sequelize.query(
      `SELECT * FROM Users LIMIT 1`
    );
    const userId = user[0][0].id;

    const notification = await queryInterface.sequelize.query(
      `SELECT * FROM Notifications LIMIT 1`
    );
    const notificationId = notification[0][0].id;

    await queryInterface.bulkInsert(
      'UserNotifications',
      [
        {
          id: uuidv4(),
          userId: userId,
          notificationId: notificationId,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserNotifications', null, {});
  },
};
