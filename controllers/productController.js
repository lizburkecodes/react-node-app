const mongoose = require('mongoose');
const Product = require('../models/product');
const Store = require('../models/store');
const asyncHandler = require('express-async-handler');
const { AppError } = require('../utils/appError');

const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
});

const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid product ID format', 400, 'VALIDATION_012', true);
    }
    const product = await Product.findById(id);
    if (!product) {
        throw AppError.PRODUCT_NOT_FOUND();
    }
    res.status(200).json(product);
});

// GET /api/products/store/:storeId
const getProductsByStore = asyncHandler(async (req, res) => {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
        throw new AppError('Invalid store ID format', 400, 'VALIDATION_012', true);
    }

    const products = await Product.find({ storeId }).sort({ createdAt: -1 });
    res.status(200).json(products);
});

// POST /api/products/store/:storeId
const createProductForStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    throw new AppError('Invalid store ID format', 400, 'VALIDATION_012', true);
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw AppError.STORE_NOT_FOUND();
  }

  // Owner check
  if (store.ownerId.toString() !== req.user.userId) {
    throw AppError.STORE_NOT_OWNED_BY_USER();
  }

  const { name, quantity, image } = req.validated; // Already validated & sanitized

  const product = await Product.create({
    name,
    quantity,
    image: image || undefined,
    storeId,
  });

  res.status(201).json(product);
});

const createProduct = asyncHandler(async (req, res) => {
    const { name, quantity, image } = req.validated; // Already validated & sanitized
    const product = await Product.create({
      name,
      quantity,
      image: image || undefined,
    });
    res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid product ID format', 400, 'VALIDATION_012', true);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw AppError.PRODUCT_NOT_FOUND();
  }

  const store = await Store.findById(product.storeId);
  if (!store) {
    throw AppError.STORE_NOT_FOUND();
  }

  if (store.ownerId.toString() !== req.user.userId) {
    throw AppError.STORE_NOT_OWNED_BY_USER();
  }

  const { name, quantity, image } = req.validated; // Already validated & sanitized
  
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { name, quantity, image: image || undefined },
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid product ID format', 400, 'VALIDATION_012', true);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw AppError.PRODUCT_NOT_FOUND();
  }

  const store = await Store.findById(product.storeId);
  if (!store) {
    throw AppError.STORE_NOT_FOUND();
  }

  if (store.ownerId.toString() !== req.user.userId) {
    throw AppError.STORE_NOT_OWNED_BY_USER();
  }

  await Product.findByIdAndDelete(id);

  res.status(200).json({ message: 'Product deleted successfully' });
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByStore,
    createProductForStore,
};