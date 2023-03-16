'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn('SubmissionResults', 'judgeToken', {
      type: Sequelize.UUID,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('SubmissionResults', 'judgeToken');
  },
};
