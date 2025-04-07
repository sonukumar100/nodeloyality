import mongoose, { Schema } from "mongoose";

import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

/// upload video//
export const videoUpload = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
   
    
    const video = req.files?.video?.[0]?.path;
  
  
  
    
    
  
    const videos = await uploadOnCloudinary(video);
  
   console.log("videos", videos);
  
    if (!video) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Error uploading video"));
    }
  
    const VideoRes = await Video.create({
      title:req.body.title,

      video: videos.url,
        description: req.body.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),

    });
  
   
  if (!videos) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Error uploading video"));
  }
    return res
      .status(201)
      .json(new ApiResponse(200,  "User registered Successfully"));
  })
  