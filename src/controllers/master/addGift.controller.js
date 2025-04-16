import {pool} from "../../db/index.js"; 
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";


export const addGiftGallery = asyncHandler (async(req, res) => {
    const { giftTitle, points, giftType } = req.body;
    console.log("giftImage", req.files);
    const giftImage = req.files?.giftImage?.[0]?.path;
    // if (!giftImage) {
    //     return res.status(400).json({ message: 'Gift image is required' });
    // }
    const fileName = req.files?.giftImage?.[0]?.originalname;
    const uploaded  = await uploadOnCloudinary(giftImage);
    try {

        await pool.query(
            `INSERT INTO gifts (giftTitle, points, giftType, url)
             VALUES (?, ?, ?, ?)`,
            [giftTitle, parseInt(points), giftType, uploaded?.secure_url || uploaded?.url]
        );

        // await pool.re();

        res.status(200).json({ message: 'Gift added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
export const giftGalleryList = asyncHandler(async (req, res) => {
    const { giftType, points, giftTitle } = req.query;

    try {
        // Base SQL query
        let query = 'SELECT * FROM gifts WHERE 1=1';
        let params = [];

        // Add filter for giftType if provided
        if (giftType) {
            query += ' AND giftType = ?';
            params.push(giftType);
        }

        // Add filter for points if provided
        if (points) {
            query += ' AND points = ?';
            params.push(points);
        }

        // Add filter for giftTitle if provided
        if (giftTitle) {
            query += ' AND giftTitle LIKE ?';
            params.push(`%${giftTitle}%`);
        }

        // Execute query
        const [rows] = await pool.query(query, params);

        // Return the result
        res.status(200).json({data:rows});
    } catch (error) {
        console.error('Error fetching gift gallery:', error);
        res.status(500).json({ error: 'Something went wrong while fetching gift gallery' });
    }
});
export const deleteGift = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM gifts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Gift not found' });
        }

        res.status(200).json({ message: 'Gift deleted successfully' });
    } catch (error) {
        console.error('Error deleting gift:', error);
        res.status(500).json({ message: 'Failed to delete gift', error });
    }
});
export const updateGift = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { giftTitle, points, giftType } = req.body;
    const giftImage = req.files?.giftImage?.[0]?.path;
    const fileName = req.files?.giftImage?.[0]?.originalname;
    const uploaded  = await uploadOnCloudinary(giftImage);
    try {
        const [result] = await pool.query(
            'UPDATE gifts SET giftTitle = ?, points = ?, giftType = ?, url = ? WHERE id = ?',
            [giftTitle, parseInt(points), giftType, uploaded?.secure_url || uploaded?.url, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Gift not found' });
        }

        res.status(200).json({ message: 'Gift updated successfully' });
    } catch (error) {
        console.error('Error updating gift:', error);
        res.status(500).json({ message: 'Failed to update gift', error });
    }
});