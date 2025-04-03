const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { validateUpdateBalance } = require('../validators/balanceValidator');

router.get('/:userId', UserController.getBalance);
router.patch('/', validateUpdateBalance, UserController.updateBalance);

module.exports = router; 