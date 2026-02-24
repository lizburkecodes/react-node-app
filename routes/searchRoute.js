const express = require('express');
const router = express.Router();
const { validateQuery } = require('../middleware/validationMiddleware');
const { searchLimiter } = require('../middleware/rateLimitMiddleware');

const { searchSchema } = require('../schemas/storeSchemas');

const { search } = require('../controllers/searchController');

// GET /api/search?q=milk&location=orlando with rate limiting
router.get('/', searchLimiter, validateQuery(searchSchema), search);

module.exports = router;
