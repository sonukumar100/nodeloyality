import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Define a Schema
const giftSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    expirationDate: { type: Date, required: true },
    offerPoints: { type: Number, required: true },
    isActive: { type: Boolean, default: false },
    avatar: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Add other fields as needed
});
export const Gift = mongoose.model('Gift', giftSchema);