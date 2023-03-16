'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const problem = await queryInterface.sequelize.query(
      `SELECT * FROM Problems LIMIT 1`
    );
    const problemId = problem[0][0].id;

    const submission = await queryInterface.sequelize.query(
      `SELECT * FROM Submissions WHERE problemId = '${problemId}' LIMIT 1`
    );
    const submissionId = submission[0][0].id;

    const testCase = await queryInterface.sequelize.query(
      `SELECT * FROM TestCases WHERE problemId = '${problemId}' LIMIT 1`
    );
    const testCaseId = testCase[0][0].id;

    await queryInterface.bulkInsert(
      'SubmissionResults',
      [
        {
          id: uuidv4(),
          testCaseId: testCaseId,
          submissionId: submissionId,
          output: null,
          correct: true,
          judgeToken: uuidv4(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubmissionResults', null, {});
  },
};
