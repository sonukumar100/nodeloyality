import {pool} from "../db/index.js";
export const addProduct = async (req, res) => {
    try {
        const { productName, karigerPoints, dealerPoints } = req.body;
        const [result] = await pool.query(
            "INSERT INTO master_products (productName, karigerPoints, dealerPoints) VALUES (?, ?, ?)",
            [productName, karigerPoints, dealerPoints]
        );
        res.status(201).json({ id: result.insertId, productName, karigerPoints, dealerPoints });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, karigerPoints, dealerPoints } = req.body;
        const [result] = await pool.query(
            "UPDATE master_products SET productName = ?, karigerPoints = ?, dealerPoints = ? WHERE id = ?",
            [productName, karigerPoints, dealerPoints, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ id, productName, karigerPoints, dealerPoints });
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

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM master_products WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllmaster_products = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM master_products");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};