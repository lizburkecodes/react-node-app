const asyncHandler = require('express-async-handler');
const Store = require('../models/store');
const Product = require('../models/product');

const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const location = (req.query.location || '').trim();

  const lat = req.query.lat;
  const lng = req.query.lng;
  const radiusKm = req.query.radiusKm ?? req.query.radius; // allow either

  let geoFilter = null;

if (lat && lng && radiusKm) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const parsedRadiusKm = Number(radiusKm);

  if ([parsedLat, parsedLng, parsedRadiusKm].some((n) => Number.isNaN(n))) {
    res.status(400);
    throw new Error("lat, lng, and radiusKm must be numbers");
  }

  // radius in radians = distance / earthRadius
  const earthRadiusKm = 6378.1;
  const radiusInRadians = parsedRadiusKm / earthRadiusKm;

  // NOTE: $geoWithin + $centerSphere does not require every doc to have geo,
  // it just excludes ones without valid geo (which is what we want).
  geoFilter = {
    geo: {
      $geoWithin: {
        $centerSphere: [[parsedLng, parsedLat], radiusInRadians],
      },
    },
  };
}

  // 1) Find "location stores" first (only based on location)
  const locationStoreFilter = {};

  // location text
  if (location) {
    locationStoreFilter.addressText = { $regex: location, $options: "i" };
  }

  // geo radius
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

  const productsRaw = await Product.find(productFilter)
    .select('_id name quantity image storeId createdAt')
    .sort({ createdAt: -1 })
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

    // If location is also present, restrict to those stores
    if (location) {
      storeFilter.addressText = { $regex: location, $options: "i" };
    }
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

  res.status(200).json({
    query: { q, location },
    stores,
    products,
  });
});

module.exports = { search };
