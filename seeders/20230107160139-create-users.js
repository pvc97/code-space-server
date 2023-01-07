'use strict';

const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcryptjs.hash('123456', 10);
    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: uuidv4(),
          username: 'cuongpv222',
          name: 'Phạm Văn Cường',
          email: 'cuongpv229799@gmail.com',
          password: hashedPassword,
          roleId: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
