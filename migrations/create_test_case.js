'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TestCases', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      stdin: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      expectedOutput: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      problemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'problems',
          key: 'id',
        },
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TestCases');
  },
};
