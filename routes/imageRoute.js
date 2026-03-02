const express = require('express');
const router = express.Router();
const { suggestImage, upload, uploadImage } = require('../controllers/imageController');
const { imageSuggestionLimiter, imageUploadLimiter } = require('../middleware/rateLimitMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');

router.get('/suggest', imageSuggestionLimiter, suggestImage);
router.post('/upload', authMiddleware, csrfProtection, imageUploadLimiter, upload.single('image'), uploadImage);

module.exports = router;