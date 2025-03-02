'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Running migration to add initial user');
    await queryInterface.sequelize.query(`
      INSERT INTO "Users" (id, balance, "createdAt", "updatedAt")
      VALUES (1, 10000, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('User added (if not already exists)');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { id: 1 }, {});
  }
};
