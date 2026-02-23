const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validateProductRequest } = require('../middleware/validationMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');
const {
  createProductLimiter,
  updateProductLimiter,
  deleteProductLimiter,
} = require('../middleware/rateLimitMiddleware');

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

// POST product into a specific store with rate limit, validation, and audit log
router.post('/store/:storeId', authMiddleware, createProductLimiter, validateProductRequest, auditLog('PRODUCT_CREATE', 'Product'), createProductForStore);

// get all products
router.get('/', getProducts);

// get a single product by ID
router.get('/:id', getProductById);

// create a new product with rate limit, validation, and audit log
router.post('/', createProductLimiter, validateProductRequest, auditLog('PRODUCT_CREATE', 'Product'), createProduct);

// update a product by ID with rate limit, validation, and audit log
router.put('/:id', authMiddleware, updateProductLimiter, validateProductRequest, auditLog('PRODUCT_UPDATE', 'Product'), updateProduct);

// delete a product by ID with rate limit and audit log
router.delete('/:id', authMiddleware, deleteProductLimiter, auditLog('PRODUCT_DELETE', 'Product'), deleteProduct);

module.exports = router;