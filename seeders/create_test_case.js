'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const problem = await queryInterface.sequelize.query(
      `SELECT * FROM problems LIMIT 1`
    );
    const problemId = problem[0][0].id;

    await queryInterface.bulkInsert(
      'TestCases',
      [
        {
          id: uuidv4(),
          stdin: '1 1',
          expectedOutput: '2',
          problemId: problemId,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          stdin: '1 2',
          expectedOutput: '3',
          problemId: problemId,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          stdin: '2 2',
          expectedOutput: '4',
          problemId: problemId,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TestCases', null, {});
  },
};
