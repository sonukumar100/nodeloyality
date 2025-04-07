import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

export const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies.refreshToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
            throw new ApiError(409, "Unauthorized request!");    
        }
    
        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid access token!");
        }
    
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }

})
/// generate token ///
export const generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id }, "1234", { expiresIn: "1d" });
}
/// generate refresh token ///

