const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

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

// POST product into a specific store
router.post('/store/:storeId', authMiddleware, createProductForStore);

// get all products
router.get('/', getProducts);

// get a single product by ID
router.get('/:id', getProductById);

// create a new product
router.post('/', createProduct);

// update a product by ID
router.put('/:id', authMiddleware, updateProduct);

// delete a product by ID
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;