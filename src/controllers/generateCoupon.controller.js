// createCoupon.js
import mongoose from 'mongoose';

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Coupon } from '../models/generateCoupon.model.js';
import { v4 as uuidv4 } from 'uuid';


    const generateCoupon = asyncHandler(async (req, res) => {
        const { type, couponPoints, productName, product_id, numberOfCoupons } = req.body;
      console.log(req);
        if (!type) {
          throw new ApiError(400, "Type is required!");
        } else if (!couponPoints) {
          throw new ApiError(400, "couponPoints is required!");
        } else if (!productName) {
          throw new ApiError(400, "productName is required!");
        }
        //  else if (!product_id) {
        //   throw new ApiError(400, "product_id is required!");
        // } 
        else if (!numberOfCoupons) {
          throw new ApiError(400, "numberOfCoupons is required!");
        }
      
        const couponList = [];
      
        for (let i = 0; i < numberOfCoupons; i++) {
          const rawCode = uuidv4().replace(/-/g, '').slice(0, 20); // e.g. "sd343856cec3d4d54bf"
           const couponCode = `SM${rawCode}`; // attach "SM" at the beginning
          const coupon = await Coupon.create({
            type,
            couponPoints,
            productName,
            // product_id: mongoose.Types.ObjectId(product_id),
            flag: false,
            couponCode,
          });
      
          couponList.push(coupon);
        }
      
        return res
          .status(201)
          .json(new ApiResponse(201, couponList, "Coupons generated successfully!"));
      });
    const getAllCoupons = asyncHandler(async (req, res) => { 
        const coupons = await Coupon.find();
        return res
          .status(200)
          .json(new ApiResponse(200, coupons, "Coupons fetched successfully!"));
      }
    );
    // controller/couponController.js


 const scanCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    throw new ApiError(400, "Coupon code is required");
  }

  // Find the coupon
  const coupon = await Coupon.findOne({ couponCode });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (coupon.flag === true) {
    throw new ApiError(400, "Coupon already used");
  }

  // Update flag
  coupon.flag = true;
  coupon.updatedAt = new Date();
  await coupon.save();

  return res.status(200).json(new ApiResponse(200, coupon, "Coupon scanned successfully"));
});

const getFilteredCoupons = asyncHandler(async (req, res) => {
    const { filter } = req.query;
  
    let query = {};
  
    if (filter === "scanned") {
      query.flag = true;
    } else if (filter === "available") {
      query.flag = false;
    } else if (filter && filter !== "scanned" && filter !== "available") {
      throw new ApiError(400, "Invalid filter. Use 'scanned', 'available' or leave it empty.");
    }
  
    const coupons = await Coupon.find(query);
  
    return res
      .status(200)
      .json(new ApiResponse(200, coupons, `${filter || "all"} coupons fetched successfully`));
  });
  
  


    export { generateCoupon,scanCoupon,getFilteredCoupons};

