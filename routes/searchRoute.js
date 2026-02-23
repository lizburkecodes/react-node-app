const express = require('express');
const router = express.Router();
const { validateSearchRequest } = require('../middleware/validationMiddleware');

const { search } = require('../controllers/searchController');

// GET /api/search?q=milk&location=orlando
router.get('/', validateSearchRequest, search);

module.exports = router;
