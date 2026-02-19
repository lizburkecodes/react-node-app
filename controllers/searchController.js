const asyncHandler = require('express-async-handler');
const Store = require('../models/store');
const Product = require('../models/product');

const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const location = (req.query.location || '').trim();

  // 1) Find "location stores" first (only based on location)
  const locationStoreFilter = location
    ? { addressText: { $regex: location, $options: 'i' } }
    : {};

  const locationStores = await Store.find(locationStoreFilter)
    .select('_id name addressText image geo ownerId')
    .sort({ createdAt: -1 })
    .lean();

  const locationStoreIds = locationStores.map((s) => s._id);

  // 2) Products: match q (if provided) AND match location storeIds (if location provided)
  const productFilter = {};
  if (q) productFilter.name = { $regex: q, $options: 'i' };
  if (location) productFilter.storeId = { $in: locationStoreIds };

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
      storeFilter.addressText = { $regex: location, $options: 'i' };
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
