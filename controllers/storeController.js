const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { AppError } = require('../utils/appError');
const { getPaginationParams, buildPaginatedResponse, parseSortParam } = require('../utils/pagination');
const Store = require('../models/store'); 

// GET /api/stores with pagination
const getStores = asyncHandler(async (req, res) => {
    const { search } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query);
    const sort = parseSortParam(req.query.sort);

    const filter = search
        ? { addressText: { $regex: search, $options: 'i' } }
        : {};

    // Get total count for pagination metadata
    const total = await Store.countDocuments(filter);

    const stores = await Store.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

    const response = buildPaginatedResponse(stores, total, page, limit);
    res.status(200).json(response);
});

// GET /api/stores/:id
const getStoreById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid store ID format', 400, 'VALIDATION_012', true);
    }

    const store = await Store.findById(id);
    if (!store) {
        throw AppError.STORE_NOT_FOUND();
    }

    res.status(200).json(store);
});

// POST /api/stores
const createStore = asyncHandler(async (req, res) => {
    const { name, addressText, image, geo } = req.validated; // Already validated & sanitized
    const ownerId = req.user?.userId;

    if (!ownerId) {
      throw AppError.UNAUTHORIZED();
    }

    const store = await Store.create({
      name,
      addressText,
      image,
      geo,
      ownerId,
    });

    res.status(201).json(store);
});

// PUT /api/stores/:id  (owner only)
const updateStore = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid store ID format', 400, 'VALIDATION_012', true);
    }

    const store = await Store.findById(id);
    if (!store) {
      throw AppError.STORE_NOT_FOUND();
    }

    // auth required + owner check
    if (!req.user) {
      throw AppError.UNAUTHORIZED();
    }

    if (String(store.ownerId) !== String(req.user._id)) {
      throw AppError.STORE_NOT_OWNED_BY_USER();
    }

    // allow updating only specific fields
    const { name, addressText, image, geo } = req.validated; // Already validated & sanitized

    if (name != null) store.name = name;
    if (addressText != null) store.addressText = addressText;
    if (image != null) store.image = image;

    // optional geo update (only if provided)
    if (geo?.coordinates) {
      store.geo = {
        type: "Point",
        coordinates: geo.coordinates,
      };
    }

    const updated = await store.save();
    res.status(200).json(updated);
});

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
};
