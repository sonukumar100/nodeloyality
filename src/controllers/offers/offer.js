import {pool} from '../../db/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
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

  const insertQuery = `
    INSERT INTO offers (
      user_type, title, offer_code, description, terms_conditions,
      start_date, end_date, states, districts, gifts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(states),
      JSON.stringify(districts),
      JSON.stringify(gifts),
    ]);

    conn.release();
    res.status(201).json({ message: 'Offer created successfully.' });

  } catch (error) {
    console.error('Error inserting offer:', error);
    res.status(500).json({ message: 'Failed to create offer', error });
  }
});
export const getOffers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const userState = req.query.state?.toLowerCase();
  const userDistrict = req.query.district?.toLowerCase();

  try {
    const conn = await pool.getConnection();

    const [offers] = await conn.query(`SELECT * FROM offers ORDER BY start_date DESC`);

    // Parse JSON fields
    const parsedOffers = offers.map(offer => ({
      ...offer,
      states: JSON.parse(offer.states || '[]'),
      districts: JSON.parse(offer.districts || '[]'),
      gifts: JSON.parse(offer.gifts || '[]'),
    }));

    // Filter based on state and district
    const filteredOffers = (userState && userDistrict)
      ? parsedOffers.filter(offer => {
          const stateMatch =
            offer.states.length === 0 ||
            offer.states.some(stateObj => stateObj.name?.toLowerCase() === userState);

          const districtMatch =
            offer.districts.length === 0 ||
            offer.districts.some(distObj => distObj.name?.toLowerCase() === userDistrict);

          return stateMatch && districtMatch;
        })
      : parsedOffers;

    // Count redeemRequest for each gift
    for (const offer of filteredOffers) {
      for (const gift of offer.gifts) {
        const [countResult] = await conn.query(
          `SELECT COUNT(*) AS count FROM redeemRequest WHERE offer_id = ? AND gift_id = ? AND is_cancellation = FALSE`,
          [offer.id, gift.id]
        );
        gift.redeemCount = countResult[0].count;
      }
    }

    conn.release();

    // Paginate
    const paginatedOffers = filteredOffers.slice(offset, offset + limit);

    res.status(200).json({
      data: paginatedOffers,
      pagination: {
        total: filteredOffers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredOffers.length / limit),
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




  
  
  