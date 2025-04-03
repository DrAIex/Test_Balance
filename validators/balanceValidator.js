const Joi = require('joi');

const updateBalanceSchema = Joi.object({
  userId: Joi.number().integer().required().messages({
    'number.base': 'userId должен быть числом',
    'number.integer': 'userId должен быть целым числом',
    'any.required': 'userId обязателен'
  }),
  amount: Joi.number().integer().required().messages({
    'number.base': 'amount должен быть числом',
    'number.integer': 'amount должен быть целым числом',
    'any.required': 'amount обязателен'
  })
});

const validateUpdateBalance = (req, res, next) => {
  const { error } = updateBalanceSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateUpdateBalance
}; 