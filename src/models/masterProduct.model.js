const mongoose = require('mongoose');

const masterProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    karigerPoints: {
        type: Number,
        required: true
    },
    dealerPoints: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const MasterProduct = mongoose.model('MasterProduct', masterProductSchema);

module.exports = MasterProduct;