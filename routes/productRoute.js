const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

const Product = require('../models/productModel');

// get all products
router.get('/', getProducts);

// get a single product by ID
router.get('/:id', getProductById);

// create a new product
router.post('/', createProduct)

// update a product by ID
router.put('/:id', updateProduct);

// delete a product by ID
router.delete('/:id', deleteProduct);

module.exports = router;