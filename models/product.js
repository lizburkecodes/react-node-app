const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true,
    },
    quantity: { 
        type: Number, 
        required: true,
        default: 0,
        min: 0,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    image: {
        type: String,
        required: false,
        trim: true,
    }
}, { timestamps: true });

// Performance indexes for filtering and sorting
productSchema.index({ name: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ storeId: 1, name: 1 }); // Composite index for store + search queries

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
