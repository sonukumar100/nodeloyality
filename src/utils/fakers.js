// fakers.js
import { faker } from "@faker-js/faker";
import { pool } from "../db/index.js";

export const generateFakeData = (count = 10) => {
  for (let i = 0; i < count; i++) {
    const product_id = faker.string.uuid();
    const productName = faker.commerce.productName();
    const couponCode = faker.string.alphanumeric(10).toUpperCase();
    const remark = faker.lorem.sentence();
    const karigerPoints = faker.number.int({ min: 10, max: 100 });
    const dealerPoints = faker.number.int({ min: 5, max: 50 });
    const flag = faker.number.int({ min: 0, max: 1 });
    const createdAt = new Date();
    const updatedAt = new Date();
    const user = null;
    const created_at = new Date();
    const couponGroup = faker.string.alphanumeric(6).toUpperCase();

    const sql = `
      INSERT INTO coupons 
        (product_id, productName, couponCode, remark, karigerPoints, dealerPoints, flag, createdAt, updatedAt, user, created_at, couponGroup)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      product_id,
      productName,
      couponCode,
      remark,
      karigerPoints,
      dealerPoints,
      flag,
      createdAt,
      updatedAt,
      user,
      created_at,
      couponGroup
    ];

    pool.query(sql, values, (err, result) => {
      if (err) {
        console.error("❌ Insert failed:", err.message);
        return;
      }
      console.log(`✅ Record inserted (ID: ${result.insertId})`);
    });
  }
};

// ✅ Call the function
// Get `count` from terminal argument if provided (e.g., node fakers.js 20)
const count = parseInt(process.argv[2]) || 10;
generateFakeData(count);
