const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validateBody, validateParams } = require('../middleware/validationMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');
const { csrfProtection } = require('../middleware/csrfMiddleware');
const {
  createProductLimiter,
  updateProductLimiter,
  deleteProductLimiter,
} = require('../middleware/rateLimitMiddleware');

const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} = require('../schemas/productSchemas');

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByStore,
  createProductForStore,
} = require('../controllers/productController');

// GET products for a specific store
router.get('/store/:storeId', getProductsByStore);

// POST product into a specific store with CSRF, rate limit, validation, and audit log
router.post('/store/:storeId', authMiddleware, csrfProtection, createProductLimiter, validateBody(createProductSchema), auditLog('PRODUCT_CREATE', 'Product'), createProductForStore);

// get all products
router.get('/', getProducts);

// get a single product by ID
router.get('/:id', getProductById);

// create a new product with CSRF, rate limit, validation, and audit log
router.post('/', csrfProtection, createProductLimiter, validateBody(createProductSchema), auditLog('PRODUCT_CREATE', 'Product'), createProduct);

// update a product by ID with CSRF, rate limit, validation, and audit log
router.put('/:id', authMiddleware, csrfProtection, updateProductLimiter, validateBody(updateProductSchema), auditLog('PRODUCT_UPDATE', 'Product'), updateProduct);

// delete a product by ID with CSRF, rate limit and audit log
router.delete('/:id', authMiddleware, csrfProtection, deleteProductLimiter, auditLog('PRODUCT_DELETE', 'Product'), deleteProduct);

module.exports = router;