import { asyncHandler } from '../../utils/asyncHandler.js';
import { pool } from '../../db/index.js';
import {io}  from '../../index.js';
// import { io } from '../server.js'; // import io instance from serveimport { io } from '../server.js'; // import io instance from server


export const RedeemRequest = asyncHandler(async (req, res) => {
  function doubleParse(jsonStr, fallback = []) {
    try {
      const once = JSON.parse(jsonStr);
      return Array.isArray(once) ? once : JSON.parse(once);
    } catch (err) {
      console.warn('Failed to double-parse JSON:', jsonStr);
      return fallback;
    }
  }

  const {
    otp,
    shipping_address,
    user_id,
    offer_id,
    gift_id,
    bank_name,
    account_number,
    ifsc_code,
    description,
    gift_type,
    account_holder_name
  } = req.body;

//  get userdata
  console.log("sss",user_id);
  const userData = await pool.query(
    `SELECT * FROM users WHERE id = ?`,
    [user_id]
  ); 
  const user = userData[0][0];
  console.log("ddd",user);

  if(user .otp !== otp){
    return res.status(400).json({ message: "Invalid OTP" });
  }
  // Basic required fields
  if (
    !otp ||
    !user_id ||
    !offer_id ||
    !gift_id ||
    !gift_type
  ) {
    return res.status(400).json({ error: "OTP, user ID, offer ID, gift ID and gift type are required." });
  }

  // Require shipping address only if gift_type is 'Gift'
  if (gift_type === 'Gift' && !shipping_address) {
    return res.status(400).json({ error: "Shipping address is required for gift-type redemptions." });
  }

  // Optional: require bank info if gift_type is 'Cash'
  // if (gift_type === 'Cash' && (!bank_name || !account_number || !ifsc_code)) {
  //   return res.status(400).json({ error: "Bank details are required for cash-type redemptions." });
  // }

  try {
    const [result] =  await pool.execute(
  `INSERT INTO redeemrequest (
    otp, shipping_address, user_id, offer_id, gift_id, bank_name,
    account_number, ifsc_code, description, gift_type,account_holder_name
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    otp ?? null,
    gift_type === 'Gift' ? shipping_address : "",
    user_id ?? null,
    offer_id ?? null,
    gift_id ?? null,
    bank_name ?? null,
    account_number ?? null,
    ifsc_code ?? null,
    description ?? null,
    gift_type ?? null,
    account_holder_name ?? null
  ]
);

    // Step 2: Generate the request_id like "R0000001"
   


    const insertedId = result.insertId;
    const requestId = `R${String(insertedId).padStart(7, "0")}`;

    await pool.execute(
      `UPDATE redeemrequest SET request_id = ? WHERE id = ?`,
      [requestId, insertedId]
    );

    // Deduct points only if not a cancellation
    const is_cancellation = false;

    if (!is_cancellation) {
      const [offerResult] = await pool.query(
        `SELECT gifts FROM offers WHERE id = ?`,
        [offer_id]
      );

      if (offerResult.length === 0) {
        return res.status(404).json({ error: "Offer not found" });
      }

      const giftsArray = doubleParse(offerResult[0].gifts);
      const gift = giftsArray.find((g) => g.id == gift_id);

      if (!gift) {
        return res.status(404).json({ error: "Gift not found in this offer" });
      }

      const [userResult] = await pool.query(
        `SELECT karigerPoints FROM users WHERE id = ?`,
        [user_id]
      );

      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPoints = userResult[0].karigerPoints;

      if (currentPoints < gift?.points) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      await pool.execute(
        `UPDATE users SET karigerPoints = karigerPoints - ? WHERE id = ?`,
        [gift?.points, user_id]
      );
      console.log("userDetail",user);
      io.emit('redeemStatusUpdated', { requestId,user,gift})
    }
   
    res.status(201).json({
      message: "Redeem request created, points deducted",
      request_id: requestId,
      id: insertedId,
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});



// get redeem request list
export const getRedeemRequestList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status; // Read status from query
  const offset = (page - 1) * limit;

  try {
    // Prepare filter condition if status is passed
    let statusCondition = '';
    let queryParams = [];

    if (status !== undefined) {
      statusCondition = 'WHERE rr.redeem_req_status = ?';
      queryParams.push(status);
    }

    // Pagination params
    queryParams.push(limit, offset);

    // Fetch redeem requests
    const [redeemRequests] = await pool.query(
      `SELECT rr.*, 
              u.email AS email, u.karigerPoints AS karigerPoints, u.state AS state, u.city AS city,
              o.id AS offer_id, o.end_date AS offer_end_date,
              g.id AS gift_id, g.giftTitle AS gift_name, g.giftType AS gift_type, g.points AS points
       FROM redeemrequest rr
       LEFT JOIN users u ON rr.user_id = u.id
       LEFT JOIN offers o ON rr.offer_id = o.id
       LEFT JOIN gifts g ON rr.gift_id = g.id
       ${statusCondition}
       ORDER BY rr.id DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    // Get total counts (global, not affected by filter)
    const [[counts]] = await pool.query(
      `SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN redeem_req_status = 0 THEN 1 ELSE 0 END) AS total_pending,
          SUM(CASE WHEN redeem_req_status = 1 THEN 1 ELSE 0 END) AS total_approved,
          SUM(CASE WHEN redeem_req_status = 2 THEN 1 ELSE 0 END) AS total_rejected
       FROM redeemrequest`
    );

    res.status(200).json({
      data: redeemRequests.map((item) => ({
        ...item,
        user: {
          id: item.user_id,
          name: item.fullName,
          email: item.email,
          karigerPoints: item.karikerPoints,
          state: item.state,
          district: item.city,
          account_status: item.account_status || null,
        },
        offer: {
          id: item.offer_id,
          end_date: item.offer_end_date,
        },
        gift: {
          id: item.gift_id,
          gift_name: item.gift_name,
          type: item.gift_type,
          points: item.points,
        },
      })),
      pagination: {
        page,
        limit,
        total: counts.total,
        totalPages: Math.ceil(counts.total / limit),
        pending: counts.total_pending,
        approved: counts.total_approved,
        rejected: counts.total_rejected,
      },
     
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// total read_flag total unread flag
export const getRedeemRequestCount = asyncHandler(async (req, res) => {
  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) AS total FROM redeemrequest`
    );
    const [unread] = await pool.query(
      `SELECT COUNT(*) AS unread FROM redeemrequest WHERE read_flag = 0`
    );
    res.status(200).json({
      total: total[0].total,
      unread: unread[0].unread,   
    })
  }
  catch (err) {
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
// update redeem  Status 
export const updateRedeemStatus = asyncHandler(async (req, res) => {
  const { id, newStatus } = req.body; // Example: id = 5, newStatus = 1 (Approved)

  await pool.query('UPDATE redeemrequest SET redeem_req_status = ? WHERE id = ?', [newStatus, id]);
  res.status(200).json({ message: "Redeem status updated successfully." });
});





