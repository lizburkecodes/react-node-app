const asyncHandler = require('express-async-handler');
const Store = require('../models/store');
const Product = require('../models/product');
const { getPaginationParams, buildPaginatedResponse, parseSortParam } = require('../utils/pagination');
// To prevent abuse, limit the number of stores returned in search results. This is a soft limit
const STORES_LIMIT = 200;

const search = asyncHandler(async (req, res) => {
  // q (keyword), location (text), lat, lng, radiusKm (geo)
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

  // location text filter — $text uses the (name, addressText) text index;
  if (location) {
    locationStoreFilter.$text = { $search: location };
  }

  // geo radius filter
  if (geoFilter) {
    Object.assign(locationStoreFilter, geoFilter);
  }

  const locationStores = await Store.find(locationStoreFilter)
    .select('_id name addressText image geo ownerId')
    .sort({ createdAt: -1 })
    .limit(STORES_LIMIT)
    .lean();

  const locationStoreIds = locationStores.map((s) => s._id);

  // 2) Products: match q AND match location storeIds (if provided)
  const productFilter = {};
  if (q) productFilter.$text = { $search: q };
  if (location || geoFilter) productFilter.storeId = { $in: locationStoreIds };

  // countDocuments and find are independent — run them in parallel
  const [totalProducts, productsRaw] = await Promise.all([
    Product.countDocuments(productFilter),
    Product.find(productFilter)
      .select('_id name quantity image storeId createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // 3) Stores result logic
  let stores = [];

  if (q) {
    // $text cannot appear inside $or, so we run two queries in parallel:
    //   a) stores whose name/addressText matches q via the text index
    //   b) stores that own a product matching q (looked up by ID)
    // then deduplicate the merged results in memory.
    const productStoreIds = [
      ...new Set(productsRaw.map((p) => String(p.storeId))),
    ];

    const storeQueries = [
      Store.find({ $text: { $search: q }, ...(geoFilter || {}) })
        .select('_id name addressText image geo ownerId')
        .sort({ createdAt: -1 })
        .limit(STORES_LIMIT)
        .lean(),
    ];

    if (productStoreIds.length) {
      storeQueries.push(
        Store.find({ _id: { $in: productStoreIds }, ...(geoFilter || {}) })
          .select('_id name addressText image geo ownerId')
          .limit(STORES_LIMIT)
          .lean()
      );
    }

    const storeResults = await Promise.all(storeQueries);

    // Deduplicate: a store can appear in both result sets
    const seenIds = new Set();
    stores = storeResults.flat().filter((s) => {
      const id = String(s._id);
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
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
