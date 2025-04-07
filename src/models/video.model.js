import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Define a Schema
const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String  },
    description: { type: String  },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Add other fields as needed
});
export const Video = mongoose.model('Video', videoSchema);