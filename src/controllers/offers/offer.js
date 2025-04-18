import { json } from 'express';
import {pool} from '../../db/index.js';
import { upload } from '../../middlewares/multer.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';
export const createOffer = asyncHandler(async (req, res) => {
  const {
    user_type,
    title,
    offer_code,
    description,
    terms_conditions,
    start_date,
    end_date,
    states,
    districts,
    gifts
  } = req.body;
  const offerImage = req.files?.offerImage?.[0]?.path;
  if (!offerImage) {
      return res.status(400).json({ message: 'offerImage image is required' });
  }
  const url = await uploadOnCloudinary(offerImage);
  if (!url) {
      return res.status(400).json({ message: 'File upload failed' });
  }
  const insertQuery = `
    INSERT INTO offers (
      user_type, title, offer_code, description, terms_conditions,
      start_date, end_date, states, districts, gifts,url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
console.log("File URL: ",url.secure_url || url.url);
  try {
    const conn = await pool.getConnection();

    await conn.query(insertQuery, [
      user_type,
      title,
      offer_code,
      description,
      terms_conditions,
      start_date,
      end_date,
      JSON.stringify(states),
      JSON.stringify(districts),
      JSON.stringify(gifts),
      url.secure_url || url.url,

    ]);

    conn.release();
    res.status(201).json({ message: 'Offer created successfully.' });

  } catch (error) {
    console.error('Error inserting offer:', error);
    res.status(500).json({ message: 'Failed to create offer', error });
  }
});
function doubleParse(jsonStr, fallback = []) {
  try {
    const once = JSON.parse(jsonStr);
    return Array.isArray(once) ? once : JSON.parse(once);
  } catch (err) {
    console.warn('Failed to double-parse JSON:', jsonStr);
    return fallback;
  }
}
export const getOffers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const userState = req.query.state?.toLowerCase();
  const userDistrict = req.query.district?.toLowerCase();
  const offerStatus = req.query.offerStatus; // '0' or '1'

  function safeJsonParse(jsonStr, fallback = []) {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
      console.warn('Failed to parse JSON:', jsonStr);
      return fallback;
    }
  }

  function doubleParse(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : safeJsonParse(parsed);
    } catch (err) {
      return safeJsonParse(jsonStr);
    }
  }

  try {
    const conn = await pool.getConnection();

    const [offers] = await conn.query(`SELECT * FROM offers ORDER BY created_at DESC`);

    const parsedOffers = offers.map(offer => {
      return {
        ...offer,
        states: doubleParse(offer.states),
        districts: doubleParse(offer.districts),
        gifts: doubleParse(offer.gifts),
      };
    });

    const filteredOffers = parsedOffers.filter(offer => {
      const stateMatch =
        !userState ||
        offer.states.length === 0 ||
        offer.states.some(stateObj => stateObj.label?.toLowerCase() === userState);

      const districtMatch =
        !userDistrict ||
        offer.districts.length === 0 ||
        offer.districts.some(distObj => distObj.label?.toLowerCase() === userDistrict);

      const statusMatch =
        offerStatus === undefined || String(offer.offerStatus) === offerStatus;

      return stateMatch && districtMatch && statusMatch;
    });

    // Count redeemRequest for each gift
    for (const offer of filteredOffers) {
      if (!Array.isArray(offer.gifts)) offer.gifts = [];

      for (const gift of offer.gifts) {
        if (!gift?.id) continue;

        const [rows] = await conn.query(
          `SELECT COUNT(*) AS count FROM redeemRequest WHERE offer_id = ? AND gift_id = ? AND is_cancellation = FALSE`,
          [offer.id, gift.id]
        );

        gift.redeemCount = rows[0]?.count || 0;
      }
    }

    conn.release();

    const paginatedOffers = filteredOffers.slice(offset, offset + limit);
    const totalActive = parsedOffers.filter(o => o.offerStatus === 1).length;
    const totalInactive = parsedOffers.filter(o => o.offerStatus === 0).length;

    res.status(200).json({
      data: paginatedOffers,
      pagination: {
        total: filteredOffers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOffers.length / limit),
        totalActive,
        totalInactive,
      },
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ message: 'Failed to fetch offers', error });
  }
};




export const updateOffer = asyncHandler(async (req, res) => {
  const {
    offer_id,
    user_type,
    title,
    offer_code,
    description,
    offerStatus,
    terms_conditions,
    start_date,
    end_date,
    states,
    districts,
    gifts
  } = req.body;

  const updateQuery = `
    UPDATE offers
    SET 
      user_type = ?, 
      title = ?, 
      offer_code = ?, 
      description = ?, 
      offerStatus = ?,
      terms_conditions = ?, 
      start_date = ?, 
      end_date = ?, 
      states = ?, 
      districts = ?, 
      gifts = ?
    WHERE id = ?
  `;

  try {
    const conn = await pool.getConnection();

    await conn.query(updateQuery, [
      user_type,
      title,
      offer_code,
      description,
      offerStatus,
      terms_conditions,
      start_date,
      end_date,
      JSON.stringify(states),
      JSON.stringify(districts),
      JSON.stringify(gifts),
      offer_id
    ]);

    conn.release();
    res.status(200).json({ message: 'Offer updated successfully.' });

  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Failed to update offer', error });
  }
});
// update Offer status
export const updateOfferStatus = asyncHandler(async (req, res) => {
  const { offer_id, offerStatus } = req.body;

  const updateQuery = `
    UPDATE offers
    SET offerStatus = ?
    WHERE id = ?
  `;

  try {
    const conn = await pool.getConnection();

    await conn.query(updateQuery, [offerStatus, offer_id]);

    conn.release();
    res.status(200).json({ message: 'Offer status updated successfully.' });

  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ message: 'Failed to update offer status', error });
  }
});


export const getOfferGifts = async (req, res) => {
  const offerId = req.params.id

  try {
    const conn = await pool.getConnection()

    const [rows] = await conn.query(
      `SELECT gifts FROM offers WHERE id = ?`,
      [offerId]
    )

    conn.release()

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Offer not found' })
    }

    let gifts = JSON.parse(rows[0].gifts || '[]')

    // If it's an array of strings, convert them to objects
    if (Array.isArray(gifts) && typeof gifts[0] === 'string') {
      gifts = gifts.map((title, index) => ({
        id: index + 1,
        title,
        description: `${title} gift`, // or customize description
      }))
    }

    res.status(200).json({ gifts })
  } catch (error) {
    console.error('Error fetching offer gifts:', error)
    res.status(500).json({ message: 'Failed to fetch gifts', error })
  }
}





  
  
  