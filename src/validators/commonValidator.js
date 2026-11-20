const { param } = require('express-validator');
const validate = require('../middlewares/validateMiddleware');

/**
 * @desc    Reusable factory middleware to validate MongoDB ObjectId in route params
 * @param   {string} paramName - Name of the route parameter (defaults to 'id')
 */
exports.validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`),

    validate,
];