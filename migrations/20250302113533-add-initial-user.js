'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.bulkInsert('Users', [{
      id: 1,
      balance: 10000,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down({ context: queryInterface }) {
    await queryInterface.bulkDelete('Users', { id: 1 }, {});
  }
};
