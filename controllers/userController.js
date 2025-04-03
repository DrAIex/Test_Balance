const UserService = require('../services/userService');

class UserController {
  static async getBalance(req, res) {
    try {
      const userId = req.params.userId;
      const balance = await UserService.getUserBalance(userId);
      res.json({ balance });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  static async updateBalance(req, res) {
    try {
      const { userId, amount } = req.body;

      if (!userId || isNaN(amount)) {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
      }

      const newBalance = await UserService.updateUserBalance(userId, amount);
      res.json({ balance: newBalance });
    } catch (error) {
      console.error('Error updating balance:', error.message);
      if (error.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      } else if (error.message === 'Insufficient balance') {
        return res.status(400).json({ error: 'Insufficient balance' });
      } else if (error.message === 'Failed to update balance') {
        return res.status(500).json({ error: 'Failed to update balance' });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
