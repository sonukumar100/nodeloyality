// models/Coupon.js
import mongoose, { Schema } from "mongoose";

const couponSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [1, 2],
    required: true
  },
  couponPoints: {
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





// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// // Define a Schema
// const giftSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     expirationDate: { type: Date, required: true },
//     offerPoints: { type: Number, required: true },
//     isActive: { type: Boolean, default: false },
//     avatar: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
//     // Add other fields as needed
// });
// export const Gift = mongoose.model('Gift', giftSchema);


