'use strict';

const { v4: uuidv4 } = require('uuid');

const { Role } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'roles',
      [
        {
          id: uuidv4(),
          type: Role.Manager,
        },
        {
          id: uuidv4(),
          type: Role.Student,
        },
        {
          id: uuidv4(),
          type: Role.Teacher,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
