import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Gift } from "../models/admin.model.js";
import multer from "multer";
// Set up Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
// fille upload 
export const fileUpload = async (req, res) => {
    try {
      // Check if the "avatar" file is uploaded
      if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        return res.status(400).json({ message: "No avatar file uploaded." });
      }
  
      // Get the uploaded file (there will only be one because of maxCount: 1)
      const avatar = req.files.avatar[0];
  
      // Create a new file document to store metadata in MongoDB
      const newFile = new File({
        filename: avatar.filename,
        originalname: avatar.originalname,
        mimetype: avatar.mimetype,
        size: avatar.size,
        path: avatar.path,
      });
  
      // Save the file metadata to MongoDB
      await newFile.save();
  
      // Send response back to client
      res.status(200).json({
        message: "File uploaded successfully",
        file: newFile,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "An error occurred while uploading the file.",
        error: error.message,
      });
    }
  };
