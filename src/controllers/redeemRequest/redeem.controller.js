import { asyncHandler } from '../../utils/asyncHandler.js';
import { pool } from '../../db/index.js';


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
    // Step 1: Insert redeem request without request_id
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

    const insertedId = result.insertId;

    // Step 2: Generate the request_id like "R0000001"
    const requestId = `R${String(insertedId).padStart(7, "0")}`;

    // Step 3: Update the request_id in the database immediately after insert
    await conn.execute(
      `UPDATE redeemRequest SET request_id = ? WHERE id = ?`,
      [requestId, insertedId]
    );

    // Step 4: Deduct points if not a cancellation
    if (!is_cancellation) {
      const [userResult] = await conn.query(
        `SELECT karigerPoints FROM users WHERE id = ?`,
        [user_id]
      );

      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPoints = userResult[0].karigerPoints;
      const pointsToDeduct = 10;

      if (currentPoints < pointsToDeduct) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      await conn.execute(
        `UPDATE users SET karigerPoints = karigerPoints - ? WHERE id = ?`,
        [pointsToDeduct, user_id]
      );
    }

    res.status(201).json({
      message: "Redeem request created, points deducted",
      request_id: requestId, // Returning the generated request_id
      id: insertedId,
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  } finally {
    conn.release();
  }
});


// get redeem request list
export const getRedeemRequestList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Fetch redeem requests along with associated user data
    const [redeemRequests] = await pool.query(
      `SELECT rr.*,  u.email as email, u.karigerPoints as karigerPoints, u.state as state, u.city as city
       FROM redeemrequest rr
       LEFT JOIN users u ON rr.user_id = u.id
       ORDER BY rr.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count for pagination
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM redeemrequest`
    );

    res.status(200).json({
      data: redeemRequests.map((item) => ({
        ...item,
        user: {
          id: item.user_id,
          name: item.fullName,
          email: item.email,
          karigerPoints: item.karigerPoints,
          state: item.state,
          district: item.city,
          account_status: item.account_status || null,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("DB Error:", err);
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
    const [redeemRequest] = await pool.query(
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
    const [userResult] = await pool.query(
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
    await pool.execute(
      `UPDATE users SET karigerPoints  = karigerPoints  + ? WHERE id = ?`,
      [karigerPointsToRefund, request.user_id]
    );

    // Step 5: Mark the redeem request as cancelled
    await pool.execute(
      `UPDATE redeemRequest SET is_cancellation = TRUE WHERE id = ?`,
      [redeemRequestId]
    );

    

    // Step 6: Respond with a success message
    res.status(200).json({
      message: "Redeem request cancelled and karigerPoints  refunded successfully.",
    });
  } catch (err) {
    console.error("DB Error:", err);
    
    res.status(500).json({ error: "Database error" });
  }
});



