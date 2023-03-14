'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const course = await queryInterface.sequelize.query(
      `SELECT * FROM Courses LIMIT 1`
    );

    const courseId = course[0][0].id;

    await queryInterface.bulkInsert(
      'Problems',
      [
        {
          id: uuidv4(),
          name: 'Tính tổng 2 số',
          pdfPath: '/problems/INT1000/INT1000_1.pdf',
          pointPerTestCase: 10,
          courseId: courseId,
          active: true,
          languageId: 54,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: 'Tính tổng 3 số',
          pdfPath: '/problems/INT1000/INT1000_2.pdf',
          pointPerTestCase: 10,
          courseId: courseId,
          active: true,
          languageId: 54,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Problems', null, {});
  },
};
