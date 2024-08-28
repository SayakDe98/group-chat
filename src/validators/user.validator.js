const joi = require('joi');

const createUserValidator = () => joi.object({
    username: joi.string().required(),
    password: joi.string().required(),
    isAdmin: joi.boolean()
});

module.exports = createUserValidator;