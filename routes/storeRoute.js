const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { validateStoreRequest, validateProductRequest } = require('../middleware/validationMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');
const {
  createStoreLimiter,
  updateStoreLimiter,
  createProductLimiter,
} = require('../middleware/rateLimitMiddleware');

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
router.post('/:storeId/products', authMiddleware, createProductLimiter, validateProductRequest, auditLog('PRODUCT_CREATE', 'Product'), createProductForStore);

// get all stores
router.get('/', getStores);

// create store with rate limit, validation, and audit log
router.post('/', authMiddleware, createStoreLimiter, validateStoreRequest, auditLog('STORE_CREATE', 'Store'), createStore);

// update store with rate limit, validation, and audit log
router.put('/:id', authMiddleware, updateStoreLimiter, validateStoreRequest, auditLog('STORE_UPDATE', 'Store'), updateStore);

// get one store (keep last)
router.get('/:id', getStoreById);

module.exports = router;
