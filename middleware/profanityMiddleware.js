const { profanity } = require('@2toad/profanity');

/**
 * Profanity filter middleware factory
 * Returns middleware that checks a specific req.body field for inappropriate language.
 * Should be placed after validateBody so the input is already normalized.
 *
 * @param {string} field - The req.body field to check (e.g. 'name', 'displayName')
 * @param {string} label - Human-readable label used in the error message
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/products', validateBody(schema), profanityFilter('name', 'Product name'), createProduct);
 */
const profanityFilter = (field = 'name', label = 'This field') => (req, res, next) => {
  const value = req.body?.[field];

  if (typeof value === 'string' && profanity.exists(value)) {
    return res.status(400).json({
      message: `${label} contains inappropriate language`,
    });
  }

  next();
};

module.exports = { profanityFilter };
