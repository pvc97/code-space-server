'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SubmissionResults', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      testCaseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'testcases',
          key: 'id',
        },
      },
      output: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      submissionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'submissions',
          key: 'id',
        },
      },
      correct: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SubmissionResults');
  },
};
