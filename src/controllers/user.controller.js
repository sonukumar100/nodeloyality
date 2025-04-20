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
  const {
    type,
   
    full_name,
    state,
    city,
    address,
    whatsapp,
    dateOfBirth,
    referralCode,
    mobile_number,
    zipcode,
    isTrue,
    email,
  } = req.body;

  if ([email, full_name].some((field) => field?.trim() === "")) {
    return res.status(400).send("All fields are required!");
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length === 0) {
      return res.status(409).send("User with email does not exist!");
    }

    const aadhaarBackPath = req.files?.aadhaarBack?.[0]?.path;
    const aadhaarFrontPath = req.files?.aadhaarFront?.[0]?.path;

    const backImg = await uploadOnCloudinary(aadhaarBackPath);
    const frontImg = await uploadOnCloudinary(aadhaarFrontPath);

    let coverImageUrl = null;
    if (req.files?.coverImage?.[0]?.path) {
      const cover = await uploadOnCloudinary(req.files.coverImage[0].path);
      coverImageUrl = cover?.url;
    }

    await pool.query(
      `UPDATE users SET 
        type = ?, full_name = ?, state = ?, city = ?, address = ?, whatsapp = ?, 
        dateOfBirth = ?, referralCode = ?, zipcode = ?, aadhaarBack = ?, isTrue = ?, aadhaarFront = ?, 
        coverImage = ?, mobile_number = ?, updatedAt = NOW()
      WHERE email = ?`,
      [
        type,
        full_name,
        state,
        city,
        address,
        whatsapp,
        dateOfBirth,
        referralCode,
        zipcode,
        backImg?.url,
        1, // <-- isTrue is always set to 1
        frontImg?.url,
        coverImageUrl,
        mobile_number,
        email,
      ]
    );
    

    const [updatedUser] = await pool.query(
      "SELECT *  FROM users WHERE email = ?",
      [email]
    );
    

    const token = generateAccessToken(updatedUser[0]);

    return res
      .status(201)
      .json(new ApiResponse(200, updatedUser[0], { token }, "User registered successfully"));
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).send(
      `<pre>Error: Something went wrong during registration.<br>${error.stack.replace(/\n/g, "<br>").replace(/  /g, "&nbsp;&nbsp;")}</pre>`
    );
  }
});
//// verify users ///
const verifyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("id", id);

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
console.log("rows",rows);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];


    // Optionally check if the user is active
    if (!user.isActive) {
      await pool.query("UPDATE users SET isActive = 1 WHERE id = ?", [user.id]);
      return res.status(200).json(new ApiResponse(200,  "User verified successfully!"));
    }

    res.status(200).json({ message: 'User verified', user });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});
/// delete user ///
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("id", id);
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);  
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = rows[0];
    console.log("user", user);  
    // Optionally check if the user is active
    if (!user.is_deleted) {
      await pool.query("UPDATE users SET is_deleted = 1 WHERE id = ?", [user.id]);
      return res.status(200).json(new ApiResponse(200, "User deleted successfully!"));
    }
    res.status(200).json({ message: 'User deleted', user });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});  
/// get all users ///
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE is_deleted = 0');  
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json({ message: 'Users fetched successfully', users: rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }

});
/// get users by id ///
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("id", id);
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {

      return res.status(404).json({ message: 'User not found' });
    }
    const user = rows[0];
    console.log("user", user);
    res.status(200).json({ message: 'User fetched successfully', user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});








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
  const { full_name, username } = req.body;

  if (!username || !full_name) {
    throw new ApiError(400, "Username or full name is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        full_name,
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
  return res.status(200).json(new ApiResponse(200, email,otp, "OTP sent successfully!"));
} else {
  await pool.execute(
    "INSERT INTO users (email, otp, otpExpireTime) VALUES (?, ?, ?)",
    [email, otp, otpExpireTime]
  );

  console.log("-new user added and otp sent:", otp);
  await sendEmail(email, otp);

  return res.status(200).json(new ApiResponse(200, email,otp, "OTP sent successfully!"));
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
    console.log("user", user);

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
      .json(new ApiResponse(200, {...user,token}, "Otp verified successfully!"));
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
  resendOtp,
  verifyUser,
  deleteUser,
  getAllUsers,
  getUserById,
};