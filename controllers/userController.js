const UserService = require('../services/userService');
const { redisClient } = require('../services/redisService');

class UserController {
  static async getBalance(req, res) {
    console.log('getBalance', req?.body, req?.url, req?.method)
    try {
      const userId = req.params.userId;
      const balance = await UserService.getUserBalance(userId);
      res.json({ balance });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }

  static async updateBalance(req, res) {
    console.log('updateBalance', req?.body, req?.url, req?.method);
    
    try {
      const { userId, amount } = req.body;

      if (!userId || isNaN(amount)) {
        return res.status(400).send('Missing or invalid parameters');
      }

      const cachedBalance = await redisClient.get(`user:${userId}:balance`);
      if (cachedBalance !== null && Number(cachedBalance) === 0 && amount < 0) {
        console.log('Fast reject: Insufficient balance in the cache');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const newBalance = await UserService.updateUserBalance(userId, amount);

      await redisClient.set(`user:${userId}:balance`, newBalance);
      console.log(`Баланс обновлен в Redis: ${newBalance}`);
      
      if (newBalance === 0) {
        console.log('Установка долгосрочного кэша для нулевого баланса');
        await redisClient.expire(`user:${userId}:balance`, 120);
      }
      
      res.json({ balance: newBalance });
      
    } catch (error) {
      console.error('Error updating balance:', error.message);
      if (error.message === 'Insufficient balance') {
        return res.status(400).json({ error: 'Insufficient balance' });
      } else if (error.message === 'Failed to update balance after maximum retries') {
        return res.status(409).json({ error: 'Conflict, please try again' });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
