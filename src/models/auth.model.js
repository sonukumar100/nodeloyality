import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Define a Schema
const generateSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
//   mobile: { type: String, required: true },
  otp: { type: String, required: true },
});
export const GenerateOtp = mongoose.model('GenerateOtp', generateSchema);
