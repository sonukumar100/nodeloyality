// models/Coupon.js
import mongoose, { Schema } from "mongoose";

const couponSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [1, 2],
    required: true
  },
  couponCount: {
    type: Number,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    // required: true
  },
  // numberOfCoupons: {  
  //   type: Number,
  //   required: true
  // },
  couponCode: {
    type: String,
    required: true,
    unique: true
  },
  flag: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export const Coupon = mongoose.model('Coupon', couponSchema);





