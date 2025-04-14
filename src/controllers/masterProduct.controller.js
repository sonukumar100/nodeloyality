import {pool} from "../db/index.js";
export const addOrUpdateProduct = async (req, res) => {
    try {
        const { id, productName, karigerPoints, dealerPoints } = req.body;
        if (id) {
            // Update existing product
            await pool.query(
                "UPDATE master_products SET productName = ?, karigerPoints = ?, dealerPoints = ? WHERE id = ?",
                [productName, karigerPoints, dealerPoints, id]
            );
            res.status(200).json({ id, productName, karigerPoints, dealerPoints, message: "Product updated successfully" });
        } else {
            // Insert new product
            const [result] = await pool.query(
                "INSERT INTO master_products (productName, karigerPoints, dealerPoints) VALUES (?, ?, ?)",
                [productName, karigerPoints, dealerPoints]
            );
            res.status(201).json({ id: result.insertId, productName, karigerPoints, dealerPoints, message: "Product added successfully" });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM master_products WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllMasterProducts = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const offset = (page - 1) * perPage;

        // Count total matching rows
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM master_products WHERE productName LIKE ?`,
            [`%${search}%`]
        );
        const totalDocuments = countResult[0].total;

        // Fetch paginated rows
        const [rows] = await pool.query(
            `SELECT * FROM master_products WHERE productName LIKE ? LIMIT ? OFFSET ?`,
            [`%${search}%`, perPage, offset]
        );

        const totalPages = Math.ceil(totalDocuments / perPage);
        const nextPage = page < totalPages ? page + 1 : null;
        const prevPage = page > 1 ? page - 1 : null;

        res.status(200).json({
            data: rows,
            pagination: {
                totalDocuments,
                perPage,
                currentPage: page,
                nextPage,
                prevPage,
                page,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
