// createCoupon.js

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/index.js';
import { Transform, Readable } from 'stream';



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
    const uuidCouponGroup = uuidv4().replace(/-/g, "").slice(0, 5);
    const couponGroup = `SM${uuidCouponGroup}`;
    console.log("Coupon Group:", couponGroup);


    // 2. Insert coupons
    for (let i = 0; i < couponCount; i++) {
      const rawCode = uuidv4().replace(/-/g, "").slice(0, 20);
      const couponCode = `SM${rawCode}`;

      await pool.execute(
        `INSERT INTO coupons (productName, product_id, couponCode,remark,karigerPoints,dealerPoints,couponGroup,flag, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?,?,?, NOW(), NOW())`,
        [ productName, product_id, couponCode,remark,karigerPoints,dealerPoints,couponGroup, false]
      );
      couponList.push({ productName, product_id, couponCode,remark,karigerPoints,dealerPoints,couponGroup,flag: false });
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

    const [userRows] = await pool.execute(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [user_id]
    );

    const user = userRows[0];

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [scanCountRows] = await pool.execute(
      `SELECT COUNT(*) as scanCount FROM coupons 
       WHERE JSON_EXTRACT(user, '$.id') = ? AND flag = 1 AND updatedAt >= ?`,
      [user.id, todayStart.toISOString()]
    );

    const scanCount = scanCountRows[0].scanCount;

    const [limitRows] = await pool.execute(
      "SELECT accessLimit FROM dailyaccesslimit LIMIT 1"
    );

    const accessLimit = limitRows[0]?.accessLimit;
    if (scanCount >= accessLimit) {
      return res.status(400).json(
        new ApiResponse(400, null, "Daily scan limit of 5 coupons reached.")
      );
    }

    let newKarigerPoints = user.karigerPoints || 0;
    let newDealerPoints = user.dealerPoints || 0;

    let earnedPoints = 0;

    if (user.type === "kariger") {
      earnedPoints = coupon.karigerPoints || 0;
      newKarigerPoints += earnedPoints;
    } else if (coupon.type === "dealer") {
      earnedPoints = coupon.dealerPoints || 0;
      newDealerPoints += earnedPoints;
    }

    await pool.execute(
      "UPDATE users SET karigerPoints = ?, dealerPoints = ?, updatedAt = NOW() WHERE id = ?",
      [newKarigerPoints, newDealerPoints, user_id]
    );

    await pool.execute(
      "UPDATE coupons SET flag = 1, updatedAt = NOW(), user = ? WHERE id = ?",
      [
        JSON.stringify({
          ...user,
        }),
        coupon.id
      ]
    );

    const [updatedUser] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [user_id]
    );

    return res.status(200).json(
      new ApiResponse(200, {
        updatedUser: updatedUser[0],
        earnedPoints,
      }, `Coupon scanned. ${earnedPoints} points added successfully.`)
    );
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
});
const getFilteredCoupons = asyncHandler(async (req, res) => {
  const { filter, couponGroup, userId } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let filterCondition = " WHERE 1=1";
  let queryParams = [];
  let fetchCoupons = true;

  if (filter === "scanned") {
    filterCondition += " AND flag = 1";

    if (userId) {
      filterCondition += " AND JSON_EXTRACT(user, '$.id') = ?";
      queryParams.push(userId);
    }
  } else if (filter === "available") {
    filterCondition += " AND flag = 0";
  } else if (filter === "group") {
    if (couponGroup) {
      filterCondition += " AND couponGroup = ?";
      queryParams.push(couponGroup);
    } else {
      fetchCoupons = false;
    }
  } else if (filter) {
    throw new ApiError(400, "Invalid filter. Use 'scanned', 'available', 'group', or leave it empty.");
  }

  try {
    let parsedCoupons = [];
    let total = 0;
    let totalPages = 0;

    if (fetchCoupons) {
      const [coupons] = await pool.execute(
        `SELECT * FROM coupons${filterCondition} LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      parsedCoupons = await Promise.all(
        coupons.map(async (coupon) => {
          let user = null;
          try {
            user = coupon.user ? JSON.parse(coupon.user) : null;
          } catch {
            user = null;
          }

          let product = null;
          if (coupon.product_id) {
            const [productRows] = await pool.execute(
              `SELECT * FROM master_products WHERE id = ? LIMIT 1`,
              [coupon.product_id]
            );
            product = productRows[0] || null;
          }

          return {
            ...coupon,
            user,
            product,
          };
        })
      );

      const [totalRes] = await pool.execute(
        `SELECT COUNT(*) as total FROM coupons${filterCondition}`,
        queryParams
      );
      total = totalRes[0].total;
      totalPages = Math.ceil(total / limit);
    }

    const [[{ totalScanned }]] = await pool.execute(`SELECT COUNT(*) as totalScanned FROM coupons WHERE flag = 1`);
    const [[{ totalAvailable }]] = await pool.execute(`SELECT COUNT(*) as totalAvailable FROM coupons WHERE flag = 0`);

    let groupInfo = null;

    if (filter === "group") {
      if (couponGroup) {
        const [groupResult] = await pool.execute(
          `SELECT 
            COUNT(*) AS totalInGroup, 
            MIN(couponCode) AS firstCouponCode, 
            MAX(couponCode) AS lastCouponCode 
           FROM coupons 
           WHERE couponGroup = ?`,
          [couponGroup]
        );

        groupInfo = {
          couponGroup,
          totalInGroup: groupResult[0].totalInGroup,
          firstCouponCode: groupResult[0].firstCouponCode,
          lastCouponCode: groupResult[0].lastCouponCode,
        };
      } else {
        const [groups] = await pool.execute(`
          SELECT 
            couponGroup, 
            COUNT(*) AS totalInGroup, 
            MIN(couponCode) AS firstCouponCode, 
            MAX(couponCode) AS lastCouponCode 
          FROM coupons 
          WHERE couponGroup IS NOT NULL AND couponGroup != ''
          GROUP BY couponGroup
        `);

        groupInfo = groups.map(group => ({
          couponGroup: group.couponGroup,
          totalInGroup: group.totalInGroup,
          firstCouponCode: group.firstCouponCode,
          lastCouponCode: group.lastCouponCode,
        }));
      }
    }

    // Build response
    let response = {
      statusCode: 200,
      message: `${filter || "all"} coupons fetched successfully`,
    };

    if (filter === "group" && !couponGroup) {
      response.data = groupInfo || [];
    } else {
      response.data = parsedCoupons;

      if (groupInfo) {
        response.data = {
          coupons: parsedCoupons,
          groupInfo
        };
      }

      response.pagination = {
        total,
        page,
        limit,
        totalPages,
        totalScanned,
        totalAvailable
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
});
const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("ID:", req.params);
  if (!id) {
    throw new ApiError(400, "Coupon ID is required");
  }
  try {
    // Check if the coupon exists
    const [couponRows] = await pool.execute(
      "SELECT * FROM coupons WHERE id = ? LIMIT 1",
      [id]
    );
    const coupon = couponRows[0];
    if (!coupon) {
      return res.status(404).json(new ApiResponse(404, null, "Coupon not found"));
    }
    // Delete the coupon
    await pool.execute("DELETE FROM coupons WHERE id = ?", [id]);
    return res.status(200).json(new ApiResponse(200, null, "Coupon deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
}
);
const updateCoupon = asyncHandler(async (req, res) => {
  const { product_id, remark,id } = req.body;
  if (!id) {
    throw new ApiError(400, "Coupon ID is required");
  }
  if (!product_id) {
    throw new ApiError(400, "Product ID is required");
  }
  // if (!couponCode) {
  //   throw new ApiError(400, "Coupon code is required");
  // }
  if (!remark) {
    throw new ApiError(400, "Remark is required");
  }
  try {
    // Check if the coupon exists
    const [couponRows] = await pool.execute(
      "SELECT * FROM coupons WHERE id = ? LIMIT 1",
      [id]
    );
    const coupon = couponRows[0];
    if (!coupon) {
      return res.status(404).json(new ApiResponse(404, null, "Coupon not found"));
    }
    // Update the coupon  
    await pool.execute(
      "UPDATE coupons SET product_id = ?, remark = ?, updatedAt = NOW() WHERE id = ?",
      [product_id, remark, id]
    );
    return res.status(200).json(new ApiResponse(200, null, "Coupon updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
}
);
// ✅ Generate 100,000 dummy rows
const generateDummyData = (count = 10000000) => {
  const data = [];
  for (let i = 1; i <= count; i++) {
    data.push({
      id: i,
      name: `User${i}`,
      email: `user${i}@example.com`,
    });
  }
  return data;
};

function convertToCSV(data) {
  const headers = Object.keys(data[0]).join(',') + '\n';
  const rows = data.map(row => Object.values(row).join(',')).join('\n') + '\n';
  return headers + rows;
}

// Transform to uppercase (demo purpose)
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  },
});

export const downloadCsv = asyncHandler(async (req, res) => {
  const data = generateDummyData(100000); // ✅ Generate 100k rows
  const csvData = convertToCSV(data);
  const readable = Readable.from([csvData]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=data.csv');

  readable
    .pipe(upperCaseTransform)
    .pipe(res)
    .on('finish', () => res.end());
});
export { generateCoupon,scanCoupon,getFilteredCoupons,deleteCoupon,updateCoupon};

