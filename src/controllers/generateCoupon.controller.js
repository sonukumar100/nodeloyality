// createCoupon.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Coupon } from '../models/generateCoupon.model.js';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/index.js';

 const generateCoupon = asyncHandler(async (req, res) => {
  const {  product_id, couponCount,remark } = req.body;

  if (!product_id) throw new ApiError(400, "product_id is required!");
  if (!couponCount) throw new ApiError(400, "couponCount is required!");
  if(!remark) throw new ApiError(400, "remark is required!");
  try {
    // 1. Check if the product exists
    const [productRows] = await pool.execute(
      "SELECT productName, karigerPoints, dealerPoints FROM master_products WHERE id = ? LIMIT 1",
      [product_id]
    );
    
   

    if (productRows.length === 0) {
      throw new ApiError(404, "Product not found with the given ID");
    }

    const productName = productRows[0].productName;
    const karigerPoints = productRows[0].karigerPoints;
    const dealerPoints = productRows[0].dealerPoints;
    const couponList = [];

    // 2. Insert coupons
    for (let i = 0; i < couponCount; i++) {
      const rawCode = uuidv4().replace(/-/g, "").slice(0, 20);
      const couponCode = `SM${rawCode}`;

      await pool.execute(
        `INSERT INTO coupons (productName, product_id, couponCode,remark,karigerPoints,dealerPoints,flag, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?,?, NOW(), NOW())`,
        [ productName, product_id, couponCode,remark,karigerPoints,dealerPoints, false]
      );
      couponList.push({ productName, product_id, couponCode,remark,karigerPoints,dealerPoints,flag: false });
    }

    return res
      .status(201)
      .json(new ApiResponse(201, couponList, "Coupons generated successfully!"));
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
});

   
const scanCoupon = asyncHandler(async (req, res) => {
  const { couponCode, user_id } = req.body;

  if (!couponCode) {
    throw new ApiError(400, "Coupon code is required");
  }

  if (!user_id) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    // 1. Check if the coupon exists
    const [rows] = await pool.execute(
      "SELECT * FROM coupons WHERE couponCode = ? LIMIT 1",
      [couponCode]
    );

    const coupon = rows[0];

    if (!coupon) {
      return res.status(404).json(new ApiResponse(404, null, "Coupon not found"));
    }

    if (coupon.flag === 1) {
      return res.status(400).json(new ApiResponse(400, coupon, "Coupon already used"));
    }

    // 2. Get user
    const [userRows] = await pool.execute(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [user_id]
    );

    const user = userRows[0];

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // 3. Assign points based on coupon type
    let newKarigerPoints = user.karigerPoints || 0;
    let newDealerPoints = user.dealerPoints || 0;

    if (user.type === "kariger") {
      newKarigerPoints += coupon.karigerPoints || 0;
    } else if (coupon.type === "dealer") {
      newDealerPoints += coupon.dealerPoints || 0;
    }

    // 4. Update user points
    await pool.execute(
      "UPDATE users SET karigerPoints = ?, dealerPoints = ?, updatedAt = NOW() WHERE id = ?",
      [newKarigerPoints, newDealerPoints, user_id]
    );

    // 5. Update coupon as used
    await pool.execute(
      "UPDATE coupons SET flag = 1, updatedAt = NOW() WHERE id = ?",
      [coupon.id]
    );

    // 6. Return updated info
    const [updatedUser] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [user_id]
    );

    return res.status(200).json(
      new ApiResponse(200, {
        updatedUser: updatedUser[0],
      }, "Coupon scanned and points updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
});
    

  const getFilteredCoupons = asyncHandler(async (req, res) => {
    const { filter } = req.query;
  
    let sql = "SELECT * FROM coupons";
    let params = [];
  
    // Add WHERE clause based on filter
    if (filter === "scanned") {
      sql += " WHERE flag = 1";
    } else if (filter === "available") {
      sql += " WHERE flag = 0";
    } else if (filter && filter !== "scanned" && filter !== "available") {
      throw new ApiError(400, "Invalid filter. Use 'scanned', 'available' or leave it empty.");
    }
  
    try {
      const [coupons] = await pool.execute(sql, params);
  
      return res.status(200).json(
        new ApiResponse(
          200,
          coupons,
          `${filter || "all"} coupons fetched successfully`
        )
      );
    } catch (error) {
      throw new ApiError(500, "Database error: " + error.message);
    }
  });
    
  
  


    export { generateCoupon,scanCoupon,getFilteredCoupons};

