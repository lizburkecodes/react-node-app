const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { validateStoreRequest, validateProductRequest } = require('../middleware/validationMiddleware');

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
router.post('/:storeId/products', authMiddleware, validateProductRequest, createProductForStore);

// get all stores
router.get('/', getStores);

// create store
router.post('/', authMiddleware, validateStoreRequest, createStore);

// update store
router.put('/:id', authMiddleware, validateStoreRequest, updateStore);

// get one store (keep last)
router.get('/:id', getStoreById);

module.exports = router;
