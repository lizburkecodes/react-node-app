const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Store = require('../models/store'); 

// GET /api/stores
const getStores = asyncHandler(async (req, res) => {
    try {
        // Optional simple filter: /api/stores?search=orlando
        const { search } = req.query;

        const filter = search
            ? { addressText: { $regex: search, $options: 'i' } }
            : {};

        const stores = await Store.find(filter).sort({ createdAt: -1 });
        res.status(200).json(stores);
    } catch (error) {
        throw new Error(error.message);
    }
});

// GET /api/stores/:id
const getStoreById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400);
            throw new Error(`invalid store ID ${id}`);
        }

        const store = await Store.findById(id);
        if (!store) {
            res.status(404);
            throw new Error(`cannot find store with ID ${id}`);
        }

        res.status(200).json(store);
    } catch (error) {
        throw new Error(error.message);
    }
});

// POST /api/stores
const createStore = asyncHandler(async (req, res) => {
    try {
        const { name, addressText, image, geo } = req.body;
        const ownerId = req.user?.userId;

        if (!ownerId) {
            res.status(401);
            throw new Error('Not authorized');
        }

        // Minimal required fields
        if (!name || !addressText) {
            res.status(400);
            throw new Error('name and addressText are required');
        }

        // Optional: validate geo if provided
        if (geo?.coordinates && (!Array.isArray(geo.coordinates) || geo.coordinates.length !== 2)) {
            res.status(400);
            throw new Error('geo.coordinates must be [lng, lat]');
        }

        const store = await Store.create({
            name,
            addressText,
            image,
            geo,
            ownerId,
        });

        res.status(201).json(store);
    } catch (error) {
        throw new Error(error.message);
    }
});

// PUT /api/stores/:id
const updateStore = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { name, addressText, image, geo } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400);
            throw new Error(`invalid store ID ${id}`);
        }

        // Optional: validate geo if provided
        if (geo?.coordinates && (!Array.isArray(geo.coordinates) || geo.coordinates.length !== 2)) {
            res.status(400);
            throw new Error('geo.coordinates must be [lng, lat]');
        }

        const updatedStore = await Store.findByIdAndUpdate(id, {
            name,
            addressText,
            image,
            geo,
        }, {
            new: true,
            runValidators: true,
        });

        if (!updatedStore) {
            res.status(404);
            throw new Error(`cannot find store with ID ${id}`);
        }

        res.status(200).json(updatedStore);
    } catch (error) {
        throw new Error(error.message);
    }
});

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
};
