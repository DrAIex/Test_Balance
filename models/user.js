'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10000,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    version: true
  });

  return User;
};
