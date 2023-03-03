'use strict';

const { v4: uuidv4 } = require('uuid');
const { Role } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const student = await queryInterface.sequelize.query(
      `SELECT * FROM users WHERE roleType = '${Role.Student}' LIMIT 1`
    );
    const studentId = student[0][0].id;

    const course = await queryInterface.sequelize.query(
      `SELECT * FROM courses LIMIT 1`
    );
    const courseId = course[0][0].id;

    await queryInterface.bulkInsert(
      'StudentCourses',
      [
        {
          id: uuidv4(),
          studentId: studentId,
          courseId: courseId,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('StudentCourses', null, {});
  },
};
