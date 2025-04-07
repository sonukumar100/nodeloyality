// models/File.js
import mongoose, { Schema } from "mongoose";
// Define the file schema
const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true }
}, { timestamps: true });

// Create the File model
export const File = mongoose.model('File', fileSchema);


module.exports = File;
