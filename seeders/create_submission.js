'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const studentCourse = await queryInterface.sequelize.query(
      `SELECT * FROM StudentCourses LIMIT 1`
    );

    const studentId = studentCourse[0][0].studentId;
    const courseId = studentCourse[0][0].courseId;

    const problem = await queryInterface.sequelize.query(
      `SELECT * FROM Problems WHERE courseId = '${courseId}' LIMIT 1`
    );
    const problemId = problem[0][0].id;

    await queryInterface.bulkInsert(
      'Submissions',
      [
        {
          id: uuidv4(),
          sourceCode: 'print(a + b)',
          // totalPoint: 0,
          createdBy: studentId,
          problemId: problemId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Submissions', null, {});
  },
};
