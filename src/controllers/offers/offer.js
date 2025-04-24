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

  const parsedGifts = typeof gifts === 'string' ? JSON.parse(gifts) : gifts;
  const parsedStates = typeof states === 'string' ? JSON.parse(states) : states;
  const parsedDistricts = typeof districts === 'string' ? JSON.parse(districts) : districts;

  const insertQuery = `
    INSERT INTO offers (
      user_type, title, offer_code, description, terms_conditions,
      start_date, end_date, states, districts, gifts, url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

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
      JSON.stringify(parsedStates),
      JSON.stringify(parsedDistricts),
      JSON.stringify(parsedGifts),
      url.secure_url || url.url,
    ]);

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

  const offerStatus = req.query.offerStatus; // '0' or '1'
  const isExport = req.query.export === 'true';

  const userId = req.query.user_id;

  let userState = req.query.state?.toLowerCase();
  let userDistrict = req.query.district?.toLowerCase();

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
    // If user_id is provided, fetch user's state and district
    if (userId) {
      const [userResult] = await pool.query(
        `SELECT state, city FROM users WHERE id = ?`,
        [userId]
      );

      const user = userResult[0];
      if (user) {
        userState = user.state
        userDistrict = user.city
      }
    }


    const [offers] = await pool.query(`SELECT * FROM offers ORDER BY offerStatus DESC, created_at DESC`);

    const parsedOffers = offers.map(offer => {
      return {
        ...offer,
        states: doubleParse(offer.states),
        districts: doubleParse(offer.districts),
        gifts: doubleParse(offer.gifts),
      };
    });

    const filteredOffers = parsedOffers.filter(offer => {
      // console.log('Offer:', offer);
      
      console.log('User State:', userState);
      console.log('User District:', userDistrict);
      const stateMatch =
        !userState ||
        offer.states.length === 0 ||
        offer.states.some(stateObj => stateObj.value === userState);

      const districtMatch =
        !userDistrict ||
        offer.districts.length === 0 ||
        offer.districts.some(distObj => distObj.value === userDistrict);

      const statusMatch =
        offerStatus === undefined || String(offer.offerStatus) === offerStatus;

      return stateMatch && districtMatch && statusMatch;
    });


    // Add redeemCount for each gift
    for (const offer of filteredOffers) {
      if (!Array.isArray(offer.gifts)) offer.gifts = [];

      for (const gift of offer.gifts) {
        if (!gift?.id) continue;

        const [rows] = await pool.query(
          `SELECT COUNT(*) AS count FROM redeemRequest WHERE offer_id = ? AND gift_id = ? AND is_cancellation = FALSE`,
          [offer.id, gift.id]
        );

        gift.redeemCount = rows[0]?.count || 0;
      }
    }

    const totalActive = parsedOffers.filter(o => o.offerStatus === 1).length;
    const totalInactive = parsedOffers.filter(o => o.offerStatus === 0).length;

    const responseData = isExport
      ? filteredOffers // return all for export
      : filteredOffers.slice(offset, offset + limit); // paginated for normal view

    res.status(200).json({
      data: responseData,
      pagination: {
        total: filteredOffers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOffers.length / limit),
        totalActive,
        totalInactive,
        isExport,
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

    await pool.query(updateQuery, [
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

    await pool.query(updateQuery, [offerStatus, offer_id]);

  
    res.status(200).json({ message: 'Offer status updated successfully.' });

  } catch (error) {
    console.error('Error updating offer status:', error);
    res.status(500).json({ message: 'Failed to update offer status', error });
  }
});


export const getOfferGifts = async (req, res) => {
  const offerId = req.params.id;

  try {
    const [rows] = await pool.query(
      // `SELECT * FROM offers WHERE id = ?`,
      `SELECT id, title, user_type,offer_code,description,start_date,end_date,offerStatus,url, gifts FROM offers WHERE id = ?`,

      [offerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const offer = rows[0];

    let gifts;

    try {
      gifts = doubleParse(offer.gifts || '[]');
      // states = doubleParse(offer.states || '[]');
      // states = doubleParse(offer.states || '[]');

    } catch (jsonError) {
      return res.status(500).json({ message: 'Invalid JSON in gifts field' });
    }

    // Convert array of strings to array of objects
    if (Array.isArray(gifts) && typeof gifts[0] === 'string') {

      gifts = gifts.map((title, index) => ({
        id: index + 1,
        title,
        description: `${title} gift`,
      }));
    }

    // Attach parsed/structured gifts to offer
    offer.gifts = gifts;
    // offer.states = states;

    return res.status(200).json({ offer });
  } catch (error) {
    console.error('Error fetching offer:', error);
    return res.status(500).json({ message: 'Failed to fetch offer', error });
  }
};







  
  
  