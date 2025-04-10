import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import { sendEmail } from "../utils/nodemailer.js";
import { generateAccessToken } from "../middlewares/auth.middleware.js";
// const {pool} = require("../db/index.js");
import {pool} from "../db/index.js";
// const { pool } = require('../db/index.js'); // adjust the path as needed

//Generate Access and Refresh Token Controller
const generateAccessAndRefreshToken = async (userId) => {
  try {
console.log("userId",userId);
    const user = await User.findById(userId);
    console.log("userId find",user);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
  
    user.refreshToken = refreshToken;
  
    await user.save({validateBefore: false});

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating access token and refresh token')
  }
  
}


//User Registration Controller
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  const { username, email, password, fullName,state,city,address,whatsapp,datOfBirth,referralCode,zipcode } = req.body;
  if (
    [ email, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  const existedUser = await User.findOne({
    $or: [{ email: email }],
  });
  if (existedUser?.email !== email) {
    throw new ApiError(409, "User with email or username not exists!");
  }
  console.log("state===>",state);
  // if(!state  || !city  || !address || !whatsapp  || !datOfBirth  || !zipcode === ""){
  //   throw new ApiError(400, "All fields are required!");
  // }
  const aadhaarBack = req.files?.aadhaarBack?.[0]?.path;
  const aadhaarFront = req.files?.aadhaarFront?.[0]?.path;


  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }
  // const coverImageLocalPath = req.file.coverImage[ 0 ]?.path
  
  // if (!aadhaarBack) {
  //   throw new ApiError(400, "AadhaarBack image is required!");
  // }
  // if (!aadhaarFront) {
  //   throw new ApiError(400, "AadhaarFront front image is required!");
  // }
  

  const backImg = await uploadOnCloudinary(aadhaarBack);
  const frontImg = await uploadOnCloudinary(aadhaarFront);

  // if (!backImg) {
  //   console.error("backImg upload to Cloudinary failed:", avatar);
  //   throw new ApiError(400, "backImg file is required!");
  // }
  

  const user = await User.findOneAndUpdate(
    { email },  // The condition to find the user
    {
      type,
      fullName,
      state,city,address,whatsapp,datOfBirth,referralCode,zipcode,
      aadhaarBack: backImg.url,
      aadhaarFront: frontImg.url,
      coverImage: coverImage.url,
      state,
      city,
      address,
      whatsapp,
      datOfBirth,
      referralCode,
      zipcode,
      email,
      isTrue: true,
      updatedAt: new Date(),  // Update timestamp if needed
    },
    { new: true }  // Returns the updated document
  );

  // const createdUser = await User.findById(user._id).select(
  //   "-password -refreshToken"
  // );

  // if (!createdUser) {
  //   throw new ApiError(500, "Something went wrong while registering user!");
  // }
 const token  = generateAccessToken(user);
  return res
    .status(201)
    .json(new ApiResponse(200,user,{token:token},  "User registered Successfully"));
})


//User Login Controller
const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie
  const { username, email, password } = req.body;
  // console.log(req.body);
  if (!username && !email) {
    throw new ApiError(403, "username or email is required!");
  }

  const user = await User.findOne({
    $or: [ { username: username }, { email: email } ]
  });

  if (!user) {
    throw new ApiError(403, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(403, "Password is incorrect!");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);
  // console.log(refreshToken, accessToken);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser, refreshToken, accessToken
      },
        "User logged in successfully!"
      )
    )
})


//User Logout Controller
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"))
})


//Refresh Access Token Controller
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
  
    if (!incomingToken) {
      throw new ApiError(403, "Unauthorized request!")
    }
  
    const decodeToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = await User.findById(decodeToken?._id)
  
    if (incomingToken !== user?.refreshToken) {
      throw new ApiError(500, "Access token is used or expired!")
    }
  
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken: accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed successfully!"
        )
      );
    
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token!")
  }
})


//Change Current Password Controller
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // console.log(req.cookies);

  if (oldPassword === newPassword) {
    throw new ApiError(401, "Old and new password should not be same!")
  }

  const refreshToken = req.cookies.refreshToken;

  const decodeToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodeToken?._id);
    // console.log(user);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const correctPassword = await user.isPasswordCorrect(oldPassword);

  if (!correctPassword) {
    throw new ApiError(401, "Password does not match");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiError(200, {}, "Password updated successfully!"));

})


//Get Current User Controller
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  // console.log(user);

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      user,
      "User fetched successfully!"
    ));
})


//Update Account Details Controller
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;

  if (!username || !fullName) {
    throw new ApiError(400, "Username or full name is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        username: username.toLowerCase()
      }
    }
  )

  const updatedUser = await User.findById(user?._id).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account updated successfully!"));
});


//Update User Avatar Controller
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  // console.log(avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  );

  const updatedUser = await User.findById(user?._id).select("-password");

  res.status(201).json(new ApiResponse(200, updatedUser, "Avatar updated successfully!"))

})

//Update Cover Image Controller
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log(coverImageLocalPath);

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image not found!")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(404, 'Error while uploading cover image')
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
      coverImage: coverImage.url
    }
    }, {
      new: true
    }
  )

  const updatedUser = await User.findById(user?._id);

  res.status(201).json(new ApiResponse(200, updatedUser, "Successfully updated cover image!"))
})

      const sendOtp = asyncHandler(async (req, res) => {
        const { email } = req.body;
        if (!email) {
          throw new ApiError(400, "Email required!");
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpireTime = Date.now() + 10 * 60 * 1000;
      //  const conn = await pool.getConnection();
      const [results] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
if (results.length > 0) {
  const userId = results[0].id;
  await pool.execute(
    "UPDATE users SET otp = ?, otpExpireTime = ? WHERE id = ?",
    [otp, otpExpireTime, userId]
  );
  await sendEmail(email, otp);
  return res.status(200).json(new ApiResponse(200, email, "OTP sent successfully!"));
} else {
  await pool.execute(
    "INSERT INTO users (email, otp, otpExpireTime) VALUES (?, ?, ?)",
    [email, otp, otpExpireTime]
  );

  console.log("-new user added and otp sent:", otp);
  await sendEmail(email, otp);

  return res.status(200).json(new ApiResponse(200, email, "OTP sent successfully!"));
}
      });
/// verify otp ///


const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!otp || !email) {
    throw new ApiError(400, "Otp and email are required!");
  }

  try {
    const [results] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    const user = results[0];

    if (!user) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    console.log("verify", user, user.otp, otp);

    if (user.otp !== otp) {
      throw new ApiError(400, "Invalid or expired OTP");
    }
    if (user.otpExpireTime < Date.now()) {
      throw new ApiError(400, "OTP expired!");
    }
    const token = generateAccessToken(user);
    return res
      .status(200)
      .json(new ApiResponse(200, user, { token }, "Otp verified successfully!"));
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }
});

/// resend otp ///
const resendOtp = asyncHandler(async (req, res) => {
  const {email} = req.body
  if (!email ) {
    throw new ApiError(400, "Email required!");
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  const existedUser = await User.findOne({
    $or: [{ email: email }],
  });   
  // if (!existedUser) {
  //   throw new ApiError(409, "User with email or phone number does not exist!");
  // }
  console.log(otp);
  const otpExpireTime = Date.now() + 10 * 60 * 1000; // 10 minutes
  if(existedUser?.email === email){
    await User.findByIdAndUpdate(existedUser._id, {
      $set: {
        otp: otp,
        otpExpireTime: otpExpireTime
      }
    })
    await sendEmail(email, otp)
    return res
    .status(200)
    .json(new ApiResponse(200, "Otp send successfully!"));
  }
})



export {
  generateAccessAndRefreshToken,
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  sendOtp,
  verifyOtp,
  resendOtp
};