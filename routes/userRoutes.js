const express = require('express');
const UserController = require('../controllers/userController');
const validate = require("../middlewares/validate");
const { validateUserId, validateBalanceUpdate } = require("../validators/userValidator");

const router = express.Router();

router.get('/balance/:userId', validateUserId, validateBalanceUpdate, validate, UserController.getBalance);
router.patch('/balance', validateBalanceUpdate, validate, UserController.updateBalance);

module.exports = router;
