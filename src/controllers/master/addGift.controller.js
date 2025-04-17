import {pool} from "../../db/index.js"; 
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";


export const addGiftGallery = asyncHandler (async(req, res) => {
    const { giftTitle, points, giftType,specifications } = req.body;
    console.log("giftImage", req.files);
    const giftImage = req.files?.giftImage?.[0]?.path;
    // if (!giftImage) {
    //     return res.status(400).json({ message: 'Gift image is required' });
    // }
    const fileName = req.files?.giftImage?.[0]?.originalname;
    const uploaded  = await uploadOnCloudinary(giftImage);
    console.log("File URL:giftType=================> ",giftType);
    try {

        await pool.query(
            `INSERT INTO gifts (giftTitle, points, giftType,specifications, url)
             VALUES (?, ?, ?, ?, ?)`,
            [giftTitle, parseInt(points), giftType,specifications, uploaded?.secure_url || uploaded?.url]
        );

        // await pool.re();

        res.status(200).json({ message: 'Gift added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
export const giftGalleryList = asyncHandler(async (req, res) => {
    const { giftType, points, giftTitle, page = 1, limit = 10 } = req.query;

    try {
        let query = 'SELECT * FROM gifts WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM gifts WHERE 1=1';
        let activeCountQuery = 'SELECT COUNT(*) as totalActive FROM gifts WHERE giftStatus = 1';
        let inactiveCountQuery = 'SELECT COUNT(*) as totalInactive FROM gifts WHERE giftStatus = 0';

        let params = [];
        let countParams = [];

        // Filters
        if (giftType) {
            query += ' AND giftType = ?';
            countQuery += ' AND giftType = ?';
            params.push(giftType);
            countParams.push(giftType);
        }

        if (points) {
            query += ' AND points = ?';
            countQuery += ' AND points = ?';
            params.push(points);
            countParams.push(points);
        }

        if (giftTitle) {
            query += ' AND giftTitle LIKE ?';
            countQuery += ' AND giftTitle LIKE ?';
            params.push(`%${giftTitle}%`);
            countParams.push(`%${giftTitle}%`);
        }

        // Order by newest first
        query += ' ORDER BY id DESC'; // or 'createdAt DESC' if timestamp exists

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        // Fetch gift list
        const [rows] = await pool.query(query, params);

        // Count totals
        const [[{ total }]] = await pool.query(countQuery, countParams);
        const [[{ totalActive }]] = await pool.query(activeCountQuery);
        const [[{ totalInactive }]] = await pool.query(inactiveCountQuery);

        const totalPages = Math.ceil(total / limit);

        // Response
        res.status(200).json({
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalActive,
                totalInactive,
                totalPages,
            },
        });
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
    // const { id } = req.params;
    const { giftTitle, points, giftType,specifications,id, } = req.body;
  
    try {
      let uploadedImageUrl;
  
      // If a new image is uploaded, handle it
      const giftImage = req.files?.giftImage?.[0]?.path;
      if (giftImage) {
        const uploaded = await uploadOnCloudinary(giftImage);
        uploadedImageUrl = uploaded?.secure_url || uploaded?.url;
      }
  
      let query = 'UPDATE gifts SET giftTitle = ?, points = ?, giftType = ?, specifications = ?';
      const queryParams = [giftTitle, parseInt(points), giftType,specifications];
  
      // Append image URL update only if image is uploaded
      if (uploadedImageUrl) {
        query += ', url = ?';
        queryParams.push(uploadedImageUrl);
      }
  
      query += ' WHERE id = ?';
      queryParams.push(id);
  
      const [result] = await pool.query(query, queryParams);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Gift not found' });
      }
  
      res.status(200).json({ message: 'Gift updated successfully' });
    } catch (error) {
      console.error('Error updating gift:', error);
      res.status(500).json({ message: 'Failed to update gift', error });
    }
  });