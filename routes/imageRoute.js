const express = require('express');
const router = express.Router();
const { suggestImage } = require('../controllers/imageController');
const { imageSuggestionLimiter } = require('../middleware/rateLimitMiddleware');

router.get('/suggest', imageSuggestionLimiter, suggestImage);

module.exports = router;