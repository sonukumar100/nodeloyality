import {pool} from '../../db/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';

// Add a new catalog item
export const  addCatalogItem = asyncHandler(async (req, res) => {
    const catalogFile = req.files?.cataLogFile?.[0]?.path;
    const fileName = req.files?.cataLogFile?.[0]?.originalname;
    const uploaded  = await uploadOnCloudinary(catalogFile);
    const url = uploaded?.secure_url || uploaded?.url;
   console.log("File URL: ",url);
    if (!url) {
        return res.status(400).json({ message: 'File upload failed' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO catalog (fileName, url) VALUES (?, ?)',
            [fileName, url ]
        );   
                  res.status(201).json({ message: 'Catalog item added', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Edit an existing catalog item
export const editCatalogItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
        const conn = await pool.getConnection();
        const result = await pool.query('UPDATE catalog SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        conn.release();
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Catalog item not found' });
        }
        res.json({ message: 'Catalog item updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a catalog item
export const deleteCatalogItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const conn = await pool.getConnection();
        const result = await pool.query('DELETE FROM catalog WHERE id = ?', [id]);
        conn.release();
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Catalog item not found' });
        }
        res.json({ message: 'Catalog item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all catalog items
export const listCatalogItems = asyncHandler(async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const rows = await pool.query('SELECT * FROM catalog');
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});