'use strict';

const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('Seeding users...');
    const hashedPassword = await bcryptjs.hash('123456', 10);

    const managerRole = await queryInterface.sequelize.query(
      `SELECT * FROM roles WHERE type = 'Manager' LIMIT 1`
    );

    const studentRole = await queryInterface.sequelize.query(
      `SELECT * FROM roles WHERE type = 'Student' LIMIT 1`
    );

    const teacherRole = await queryInterface.sequelize.query(
      `SELECT * FROM roles WHERE type = 'Teacher' LIMIT 1`
    );

    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: uuidv4(),
          username: 'cuongpv',
          name: 'Phạm Văn Cường',
          email: 'cuongpv@gmail.com',
          password: hashedPassword,
          roleId: managerRole[0][0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          username: 'cuongpv1',
          name: 'Phạm Student',
          email: 'cuongpv1@gmail.com',
          password: hashedPassword,
          roleId: studentRole[0][0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          username: 'cuongpv2',
          name: 'Phạm Teacher',
          email: 'cuongpv2@gmail.com',
          password: hashedPassword,
          roleId: teacherRole[0][0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
