'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'languages',
      [
        {
          id: 50,
          name: 'C (GCC 9.2.0)',
        },
        {
          id: 54,
          name: 'C++ (GCC 9.2.0)',
        },
        {
          id: 62,
          name: 'Java (OpenJDK 13.0.1)',
        },
        {
          id: 63,
          name: 'JavaScript (Node.js 12.14.0)',
        },
        {
          id: 71,
          name: 'Python (3.8.1)',
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('languages', null, {});
  },
};
