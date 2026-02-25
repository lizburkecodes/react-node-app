const express = require('express');
const router = express.Router();
const { validateQuery } = require('../middleware/validationMiddleware');
const { searchLimiter } = require('../middleware/rateLimitMiddleware');

const { searchSchema } = require('../schemas/storeSchemas');

const { search } = require('../controllers/searchController');

// GET /api/search?q=milk&lat=28.6&lng=-81.3&radiusKm=10 with rate limiting
router.get('/', searchLimiter, validateQuery(searchSchema), search);

module.exports = router;
