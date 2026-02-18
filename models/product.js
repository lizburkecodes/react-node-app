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
      index: true,
    },
    image: {
        type: String,
        required: false,
        trim: true,
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
