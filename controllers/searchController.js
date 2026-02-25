const asyncHandler = require('express-async-handler');
const Store = require('../models/store');
const Product = require('../models/product');
const { getPaginationParams, buildPaginatedResponse, parseSortParam } = require('../utils/pagination');

const search = asyncHandler(async (req, res) => {
  const { q, location, lat, lng, radiusKm } = req.validated; // Already validated & sanitized
  const { page, limit, skip } = getPaginationParams(req.query);
  const sort = parseSortParam(req.query.sort);

  let geoFilter = null;

  if (lat && lng && radiusKm) {
    // radiusKm is already in km
    const earthRadiusKm = 6378.1;
    const radiusInRadians = radiusKm / earthRadiusKm;

    geoFilter = {
      geo: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
    };
  }

  // 1) Find "location stores" first (only based on location)
  const locationStoreFilter = {};

  // location text filter
  if (location) {
    locationStoreFilter.addressText = { $regex: location, $options: "i" };
  }

  // geo radius filter
  if (geoFilter) {
    Object.assign(locationStoreFilter, geoFilter);
  }

  const locationStores = await Store.find(locationStoreFilter)
    .select('_id name addressText image geo ownerId')
    .sort({ createdAt: -1 })
    .lean();

  const locationStoreIds = locationStores.map((s) => s._id);

  // 2) Products: match q AND match location storeIds (if provided)
  const productFilter = {};
  if (q) productFilter.name = { $regex: q, $options: 'i' };
  if (location || geoFilter) productFilter.storeId = { $in: locationStoreIds };

  // Get total count before pagination
  const totalProducts = await Product.countDocuments(productFilter);

  const productsRaw = await Product.find(productFilter)
    .select('_id name quantity image storeId createdAt')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // 3) Stores result logic
  let stores = [];

  if (q) {
    const qRegex = { $regex: q, $options: 'i' };

    // Store IDs from matching products
    const productStoreIds = [
      ...new Set(productsRaw.map((p) => String(p.storeId))),
    ];

    const storeFilter = {
      $or: [
        { name: qRegex },
        ...(productStoreIds.length
          ? [{ _id: { $in: productStoreIds } }]
          : []),
      ],
    };

    // If geo filter is present, restrict to those stores
    if (geoFilter) {
      Object.assign(storeFilter, geoFilter);
    }

    stores = await Store.find(storeFilter)
      .select('_id name addressText image geo ownerId')
      .sort({ createdAt: -1 })
      .lean();
  } else {
    // No q → just return location-based stores (or all stores if no location)
    stores = locationStores;
  }

  // 4) Attach store summary to each product
  // We need store info for the products. If location is present, we already have those stores.
  // If location is absent, fetch missing stores for products.
  const storesById = new Map(stores.map((s) => [String(s._id), s]));

  const missingStoreIds = [];
  for (const p of productsRaw) {
    const sid = String(p.storeId);
    if (!storesById.has(sid)) missingStoreIds.push(p.storeId);
  }

  if (missingStoreIds.length) {
    const extraStores = await Store.find({ _id: { $in: missingStoreIds } })
      .select('_id name addressText image')
      .lean();
    for (const s of extraStores) storesById.set(String(s._id), s);
  }

  const products = productsRaw.map((p) => {
    const store = storesById.get(String(p.storeId)) || null;
    return {
      ...p,
      store: store
        ? { _id: store._id, name: store.name, addressText: store.addressText, image: store.image }
        : null,
    };
  });

  const productsResponse = buildPaginatedResponse(products, totalProducts, page, limit);

  res.status(200).json({
    query: { q, location },
    stores,
    ...productsResponse,
  });
});

module.exports = { search };
