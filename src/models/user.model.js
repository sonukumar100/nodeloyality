import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config()

const userSchema = new Schema(
  {
   
   
    
    email: {
      type: String,
      // required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      // required: true,
    },
    coverImage: {
      type: String, //Cloudinary URL
    },
    refreshToken: {
      type: String, //Cloudinary URL
    },
    otp: {
      type: String,
      // required: true,
    },
    isTrue: {
      type: Boolean,
      default: false,
    },
    otpExpireTime: {
      type: Date,
      // required: true,
    },
    aadhaarBack: {
      type: String,
      // required: true,
    },
    aadhaarFront: {
      type: String,
      // required: true,
    },
    coverImage: {
      type: String,
      // required: true,
    },
    type: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    state: {
      type: String,
      // required: true,
    },
    city: {
      type: String,
      // required: true,
    },
    zipCode: {
      type: String,
      // required: true,
    },
    mobile: {
      type: String,
      // required: true,
    },
    whatsapp: {
      type: String,
      // required: true,
    },
    datOfBirth: {
      type: Date,
      // required: true,
    },
    address: {
      type: String,
      // required: true,
    },
    referralCode: {
      type: String,
      // required: true,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        _id: this._id,
      },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    );
}

export const User = mongoose.model('User', userSchema, 'User');

