import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.join(__dirname, '../.env') });
console.log("Connecting to Cloudinary...",process.env.CLOUDINARY_CLOUD_NAME);
console.log("Connecting to Cloudinary...",process.env.CLOUDINARY_API_KEY);
console.log("Connecting to Cloudinary...",process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: '828351177812162',
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async function (localFilePath) {
    try {
      if (!localFilePath) return null;
      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "raw",
      });
      //File has been successfully uploaded
      console.log("File is uploaded successfully ", response.url);
      fs.unlinkSync(localFilePath);
      return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export { uploadOnCloudinary };