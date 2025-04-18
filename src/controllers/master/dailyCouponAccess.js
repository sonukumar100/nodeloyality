
/// add accessLimit ///
// import { pool } from "../../config/db.js";
import { pool } from '../../db/index.js';

export const addAccessLimit = async (req, res) => {
  const { accessLimit } = req.body;

  if (!accessLimit) {
    return res.status(400).json({ message: "Access limit is required" });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE dailyaccesslimit SET accessLimit = ?`,
      [accessLimit]
    );
    // const [result] = await pool.execute(
    //     `INSERT INTO dailyaccesslimit (accessLimit) VALUES (?)`,
    //     [accessLimit]
    //   );
    return res.status(200).json({
      message: "Access limit updated successfully for all coupons",
      response: result,
    });
  } catch (error) {
    console.error("Error updating access limit:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getAccessLimit = async (req, res) => {
  try {
    const [result] = await pool.execute(`SELECT * FROM dailyaccesslimit`);
    return res.status(200).json({
      message: "Access limit fetched successfully",
      response: result,
    });
  } catch (error) {
    console.error("Error fetching access limit:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
  
