const mongoose = require('mongoose');
const Product = require('../models/product');
const Store = require('../models/store');
const asyncHandler = require('express-async-handler');

const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
});

const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error(`invalid product ID ${id}`);
    }
    const product = await Product.findById(id);
    if (!product) {
        res.status(404);
        throw new Error(`cannot find product with ID ${id}`);
    }
    res.status(200).json(product);
});

// GET /api/products/store/:storeId
const getProductsByStore = asyncHandler(async (req, res) => {
    const { storeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
        res.status(400);
        throw new Error(`invalid store ID ${storeId}`);
    }

    const products = await Product.find({ storeId }).sort({ createdAt: -1 });
    res.status(200).json(products);
});

// POST /api/products/store/:storeId
const createProductForStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    res.status(400);
    throw new Error(`invalid store ID ${storeId}`);
  }

  const store = await Store.findById(storeId);
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  // Owner check
  if (store.ownerId.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('You are not authorized to add products to this store');
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
    res.status(400);
    throw new Error(`invalid product ID ${id}`);
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error(`cannot find product with ID ${id}`);
  }

  const store = await Store.findById(product.storeId);
  if (!store) {
    res.status(404);
    throw new Error('Store not found for this product');
  }

  if (store.ownerId.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('You are not authorized to update this product');
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
    res.status(400);
    throw new Error(`invalid product ID ${id}`);
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error(`cannot find product with ID ${id}`);
  }

  const store = await Store.findById(product.storeId);
  if (!store) {
    res.status(404);
    throw new Error('Store not found for this product');
  }

  if (store.ownerId.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('You are not authorized to delete this product');
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