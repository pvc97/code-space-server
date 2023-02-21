'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const teacherRole = await queryInterface.sequelize.query(
      `SELECT * FROM roles WHERE type = 'Teacher' LIMIT 1`
    );

    const firstTeacherRoleId = teacherRole[0][0].id;

    console.log(firstTeacherRoleId);

    const teacher = await queryInterface.sequelize.query(
      `SELECT * FROM users WHERE roleId = '${firstTeacherRoleId}' LIMIT 1`
    );

    const teacherId = teacher[0][0].id;

    await queryInterface.bulkInsert(
      'courses',
      [
        {
          id: uuidv4(),
          name: 'Nhập môn lập trình',
          code: 'INT1000',
          teacherId: teacherId,
          accessCode: '123456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: 'Lập trình nâng cao',
          code: 'INT1999',
          teacherId: teacherId,
          accessCode: '123456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('courses', null, {});
  },
};
