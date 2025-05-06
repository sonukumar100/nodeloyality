

/// get messages by room id
import { asyncHandler } from '../../utils/asyncHandler.js';
import { pool } from '../../db/index.js';
export const getMsg = asyncHandler(async (req, res) => {
    try {
    const sql = `
      SELECT * FROM messages
      WHERE room_id =?
      ORDER BY created_at ASC
    `;

    const [results] = await pool.query(sql, ["room_user_42_admin"]);
    // console.log('Messages retrieved from DB:', results);
    return results; 

  }
  catch (err) {
    console.error('Query error:', err);
    // return callback(err, null); 
  }
});
//// get unique  sender id data give response //
export const getUniqueSenderId = asyncHandler(async (req, res) => {
    try {
      const sql = `
        SELECT DISTINCT u.* 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
      `;
  
      const [results] = await pool.query(sql);
      res.status(200).json({ data: results });
  
    } catch (err) {
      console.error('Query error:', err);
      res.status(500).json({ error: 'Database query failed' });
    }
  });


  /// get all details by sender id //
  export const getDetailsForMsg = asyncHandler(async (req, res) => {
    console.log('req.params.sender_id', req.query)
    const sender_id = req.query.sender_id;
    try {
      const sql = `
        SELECT * FROM messages
        WHERE sender_id = ?
      `;

      const [results] = await pool.query(sql, [sender_id]);
      res.status(200).json({ data: results });
    } catch (err) {
      console.error('Query error:', err);
      res.status(500).json({ error: 'Database query failed' });
    }
  })
  
  