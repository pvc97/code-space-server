'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'Notifications',
      [
        {
          id: uuidv4(),
          title: 'Hello',
          body: 'Welcome to Code Space',
          // Use JSON.stringify to convert object to string - when accessing data, use JSON.parse to convert string to object
          data: JSON.stringify({
            url: 'http://pvc97.me/code-space',
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          title: 'Hello',
          body: 'Welcome to Code Space',
          data: JSON.stringify({
            url: 'http://pvc97.me/code-space',
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notifications', null, {});
  },
};
