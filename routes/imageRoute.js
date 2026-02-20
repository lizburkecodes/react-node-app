const express = require('express');
const router = express.Router();
const { suggestImage } = require('../controllers/imageController');

router.get('/suggest', suggestImage);

module.exports = router;