'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Roles', {
      roleType: {
        primaryKey: true,
        type: Sequelize.ENUM,
        values: ['manager', 'student', 'teacher'],
        defaultValue: 'student',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Roles');
  },
};
