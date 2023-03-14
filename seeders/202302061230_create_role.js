'use strict';

const { v4: uuidv4 } = require('uuid');

const { Role } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'Roles',
      [
        {
          roleType: Role.Manager,
        },
        {
          roleType: Role.Student,
        },
        {
          roleType: Role.Teacher,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {});
  },
};
