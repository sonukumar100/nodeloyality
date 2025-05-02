import { asyncHandler } from "../../utils/asyncHandler.js";
import {pool} from "../../db/index.js"; 
export const createFaq = asyncHandler(async (req, res) => {
  const { question, answer } = req.body;
  const [result] = await pool.execute(
    'INSERT INTO faq (question, answer) VALUES (?, ?)', 
    [question, answer]
  );
  res.status(201).json({ id: result.insertId, question, answer });
});
// getFaqList
export const getFaqList = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM faq');
  res.json(rows);
});