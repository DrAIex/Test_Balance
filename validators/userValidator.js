const { body, param } = require("express-validator");

const validateUserId = param("id")
  .isInt({ min: 1 })
  .withMessage("ID should be a positive number");

const validateBalanceUpdate = [
  body("amount")
    .isNumeric()
    .withMessage("The sum should be a number")
    .custom((value) => value !== 0)
    .withMessage("The sum should be 0"),
];

module.exports = { validateUserId, validateBalanceUpdate };
