const { User } = require('../models');
const redisService = require('./redisService');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../models');

class UserService {
  static async createInitialUser() {
    const [user, created] = await User.findOrCreate({
      where: { id: 1 },
      defaults: { balance: 10000, version: 0 }
    });

    if (created) {
      console.log('Initial user created with balance 10000');
    } else {
      if (user.balance !== 10000) {
        await user.update({ balance: 10000 });
        console.log('User balance reset to 10000');
      } else {
        console.log('User already exists with balance 10000');
      }
    }

    await redisService.redisClient.set(`user:1:balance`, 10000);
    return user;
  }

  static async getUserBalance(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user.balance;
  }

  static async updateUserBalance(userId, amount) {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const [affectedRows] = await User.update(
          {
            balance: sequelize.literal(`balance + ${amount}`),
            version: sequelize.literal('version + 1')
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
          
          retries++;
          if (retries === maxRetries) {
            throw new Error('Failed to update balance after maximum retries');
          }
          
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          continue;
        }

        const updatedUser = await User.findByPk(userId);
        return updatedUser.balance;
        
      } catch (error) {
        if (error.message === 'Insufficient balance') {
          throw error;
        }
        console.error('Error in updateUserBalance:', error);
        retries++;
        if (retries === maxRetries) {
          throw new Error('Failed to update balance after maximum retries');
        }
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      }
    }

    throw new Error('Failed to update balance after maximum retries');
  }
}

module.exports = UserService;
