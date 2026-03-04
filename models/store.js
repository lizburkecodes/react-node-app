const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // for UI
    addressText: {
      type: String,
      required: true,
      trim: true,
    },

    // for geo searches later
    geo: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [lng, lat]
        validate: {
          validator: function (v) {
            return v == null || v.length === 2;
          },
          message: 'geo.coordinates must be [lng, lat]',
        },
      },
    },

    image: {
      type: String,
      required: false,
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // make req later
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
storeSchema.index({ geo: '2dsphere' });

// Performance indexes for filtering and sorting
storeSchema.index({ ownerId: 1 });
storeSchema.index({ createdAt: -1 });
// Text index: replaces $regex — name weighted higher so keyword hits on store
// names score above incidental addressText matches
storeSchema.index(
  { name: 'text', addressText: 'text' },
  { weights: { name: 10, addressText: 5 }, default_language: 'english' }
);

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;
