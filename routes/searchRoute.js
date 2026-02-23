const express = require('express');
const router = express.Router();
const { validateSearchRequest } = require('../middleware/validationMiddleware');
const { searchLimiter } = require('../middleware/rateLimitMiddleware');

const { search } = require('../controllers/searchController');

// GET /api/search?q=milk&location=orlando with rate limiting
router.get('/', searchLimiter, validateSearchRequest, search);

module.exports = router;
