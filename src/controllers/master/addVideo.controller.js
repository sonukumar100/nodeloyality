import {pool} from "../../db/index.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

export const addOrUpdateVideo = asyncHandler (async (req, res) => {
    const { id, url, description } = req.body;

    if (!url || !description) {
        return res.status(400).json({ message: 'URL and description are required.' });
    }

    try {
        if (id) {
            // Update existing video
            const [result] = await pool.query(
                'UPDATE addVideos SET url = ?, description = ? WHERE id = ?',
                [url, description, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Video not found.' });
            }

            return res.status(200).json({ message: 'Video updated successfully.' });
        } else {
            // Add new video
            const [result] = await pool.query(
                'INSERT INTO addVideos (url, description) VALUES (?, ?)',
                [url, description]
            );

            return res.status(201).json({ message: 'Video added successfully.', id: result.insertId });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}
);
export const deleteVideo = asyncHandler (async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            'DELETE FROM addVideos WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Video not found.' });
        }

        return res.status(200).json({ message: 'Video deleted successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}
);
export const getAllVideos = asyncHandler (async (req, res) => {
    try {
        const [videos] = await pool.query(
            'SELECT * FROM addVideos'
        );

        return res.status(200).json(videos);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}
);