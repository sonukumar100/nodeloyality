import {pool} from '../../db/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';


export const RedeemRequest = asyncHandler(async (req, res) => {
  const {
    otp,
    same_permanment_address,
    shipping_address,
    cancelation_policy,
    user_id,
    offer_id,
    gift_id,
    is_cancellation,
  } = req.body;

  // Validate all required fields
  if (
    !otp ||
    typeof same_permanment_address !== "boolean" ||
    !shipping_address ||
    !cancelation_policy ||
    !user_id ||
    !offer_id ||
    !gift_id ||
    typeof is_cancellation !== "boolean"
  ) {
    return res.status(400).json({ error: "All fields are required and must be valid." });
  }

  const conn = await pool.getConnection();

  try {
    // Insert the redeem request into the database
    const [result] = await conn.execute(
      `INSERT INTO redeemRequest (
        otp, same_permanment_address, shipping_address, cancelation_policy,
        user_id, offer_id, gift_id, is_cancellation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        otp,
        same_permanment_address,
        shipping_address,
        cancelation_policy,
        user_id,
        offer_id,
        gift_id,
        is_cancellation,
      ]
    );

    // After the redeem request is created, reduce the user's points
    if (!is_cancellation) {
      // Fetch the user's current points
      const [userResult] = await conn.query(`SELECT karigerPoints  FROM users WHERE id = ?`, [user_id]);

      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPoints = userResult[0].points;

      // Assuming each redeem request costs some points (replace with your logic)
      const pointsToDeduct = 10;  // Example: 10 points for each redeem request

      if (currentPoints < pointsToDeduct) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      // Deduct points from the user's account
      await conn.execute(
        `UPDATE users SET karigerPoints  = karigerPoints  - ? WHERE id = ?`,
        [pointsToDeduct, user_id]
      );
    }

    conn.release();

    // Send success response
    res.status(201).json({ message: "Redeem request created, points deducted", id: result.insertId });
  } catch (err) {
    console.error("DB Error:", err);
    conn.release();
    res.status(500).json({ error: "Database error" });
  }
});


export const cancelRedeemRequest = asyncHandler(async (req, res) => {
  const { redeemRequestId } = req.body;

  // Validate the required field
  if (!redeemRequestId) {
    return res.status(400).json({ error: "Redeem request ID is required." });
  }

  const conn = await pool.getConnection();

  try {
    // Step 1: Fetch the redeem request by ID
    const [redeemRequest] = await conn.query(
      `SELECT * FROM redeemRequest WHERE id = ?`,
      [redeemRequestId]
    );

    if (redeemRequest.length === 0) {
      return res.status(404).json({ error: "Redeem request not found." });
    }

    const request = redeemRequest[0];

    // Step 2: Check if it's already cancelled
    if (request.is_cancellation) {
      return res.status(400).json({ error: "This redeem request has already been cancelled." });
    }

    // Step 3: Get the user's karigerPoints  before cancelling the redeem request
    const [userResult] = await conn.query(
      `SELECT karigerPoints  FROM users WHERE id = ?`,
      [request.user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const currentkarigerPoints  = userResult[0].karigerPoints ;

    // Assuming each redeem request costs 10 karigar points (adjust if needed)
    const karigerPointsToRefund = 10;

    // Step 4: Refund karigerPoints  to the user
    await conn.execute(
      `UPDATE users SET karigerPoints  = karigerPoints  + ? WHERE id = ?`,
      [karigerPointsToRefund, request.user_id]
    );

    // Step 5: Mark the redeem request as cancelled
    await conn.execute(
      `UPDATE redeemRequest SET is_cancellation = TRUE WHERE id = ?`,
      [redeemRequestId]
    );

    conn.release();

    // Step 6: Respond with a success message
    res.status(200).json({
      message: "Redeem request cancelled and karigerPoints  refunded successfully.",
    });
  } catch (err) {
    console.error("DB Error:", err);
    conn.release();
    res.status(500).json({ error: "Database error" });
  }
});



