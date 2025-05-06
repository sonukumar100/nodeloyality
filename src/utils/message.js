import { pool } from '../db/index.js';


export const getMessagesByRoomId = async (roomId) => {
    const sql = `
      SELECT * FROM messages
      WHERE room_id = ?
      ORDER BY created_at DESC
    `;  
    const [results] = await pool.query(sql, [roomId]);
    return results;
  };
