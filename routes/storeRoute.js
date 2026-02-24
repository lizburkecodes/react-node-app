const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { validateBody, validateParams } = require('../middleware/validationMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');
const {
  createStoreLimiter,
  updateStoreLimiter,
  createProductLimiter,
} = require('../middleware/rateLimitMiddleware');

const {
  createStoreSchema,
  updateStoreSchema,
  storeIdSchema,
} = require('../schemas/storeSchemas');

const {
  createProductSchema,
} = require('../schemas/productSchemas');

const {
  getStores,
  getStoreById,
  createStore,
  updateStore,
} = require('../controllers/storeController');

const {
  getProductsByStore,
  createProductForStore,
} = require('../controllers/productController');

// store -> products (public for now)
router.get('/:storeId/products', getProductsByStore);
router.post('/:storeId/products', authMiddleware, csrfProtection, createProductLimiter, validateBody(createProductSchema), auditLog('PRODUCT_CREATE', 'Product'), createProductForStore);

// get all stores
router.get('/', getStores);

// create store with CSRF, rate limit, validation, and audit log
router.post('/', authMiddleware, csrfProtection, createStoreLimiter, validateBody(createStoreSchema), auditLog('STORE_CREATE', 'Store'), createStore);

// update store with CSRF, rate limit, validation, and audit log
router.put('/:id', authMiddleware, csrfProtection, updateStoreLimiter, validateBody(updateStoreSchema), auditLog('STORE_UPDATE', 'Store'), updateStore);

// get one store (keep last)
router.get('/:id', getStoreById);

module.exports = router;
