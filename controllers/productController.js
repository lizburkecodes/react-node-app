const mongoose = require('mongoose');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');

const getProducts = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        throw new Error(error.message);
    }
})

const getProductById = asyncHandler(async (req, res) => {
    try {
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
    } catch (error) {
        throw new Error(error.message);
    }
})

const createProduct = asyncHandler(async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(200).json(product);

    } catch (error) {
        throw new Error(error.message);
    }
})

const updateProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400);
            throw new Error(`invalid product ID ${id}`);
        }
        const product = await Product.findByIdAndUpdate(id, req.body)
        if (!product) {
            res.status(404);
            throw new Error(`cannot find product with ID ${id}`);
        }
        const updatedProduct = await Product.findById(id);
        res.status(200).json(updatedProduct);
    } catch (error) {
        throw new Error(error.message);
    }
})

const deleteProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400);
            throw new Error(`invalid product ID ${id}`);
        }
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            res.status(404);
            throw new Error(`cannot find product with ID ${id}`);
        }
        res.status(200).json(product);
    } catch (error) {
        throw new Error(error.message);
    }
})

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};