'use strict';

const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { PASSWORD_SALT_LENGTH } = require('../constants/constants');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('Seeding users...');
    const hashedPassword = await bcryptjs.hash('123456', PASSWORD_SALT_LENGTH);

    await queryInterface.bulkInsert(
      'Users',
      [
        {
          id: uuidv4(),
          username: 'admin',
          name: 'Phạm Văn Cường',
          email: 'cuongpv@gmail.com',
          password: hashedPassword,
          roleType: 'manager',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          username: 'student',
          name: 'Phạm Student',
          email: 'cuongpv1@gmail.com',
          password: hashedPassword,
          roleType: 'student',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          username: 'teacher',
          name: 'Phạm Teacher',
          email: 'cuongpv2@gmail.com',
          password: hashedPassword,
          roleType: 'teacher',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
