const { User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../models');

class UserService {
  static async getUserBalance(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user.balance;
  }

  static async updateUserBalance(userId, amount) {
    const [affectedRows] = await User.update(
      {
        balance: sequelize.literal(`balance + ${amount}`)
      },
      {
        where: {
          id: userId,
          [Op.and]: [
            sequelize.literal(`balance + ${amount} >= 0`)
          ]
        },
        returning: true
      }
    );

    if (affectedRows === 0) {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.balance + amount < 0) {
        throw new Error('Insufficient balance');
      }
      
      throw new Error('Failed to update balance');
    }

    const updatedUser = await User.findByPk(userId);
    return updatedUser.balance;
  }
}

module.exports = UserService;
