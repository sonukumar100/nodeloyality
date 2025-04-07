import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Gift } from "../models/admin.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


// create api add title and description
const addGift = asyncHandler(async (req, res) => {
  const { title, description,expirationDate,offerPoints,isActive } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required!");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required!");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar",avatar);
  const addGift = await Gift.create({
    title,
    expirationDate,
    offerPoints,
    isActive,
    avatar: avatar.url,
    description,

  });
  return res.status(201).json(new ApiResponse(200, addGift, "About Us created successfully!"));
}
);
// create api update title and description with post method
const updateGift = asyncHandler(async (req, res) => {
  const { title, description, expirationDate, offerPoints, isActive } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required!");
  }
  console.log("id",req.params.id);

  const updateGift = await Gift.findByIdAndUpdate(
    req.params.id,
    {
      title,
      expirationDate,
      offerPoints,
      isActive,
      description,
    },
    { new: true }
  );

  if (!updateGift) {
    throw new ApiError(404, "Gift not found!");
  }

  return res.status(200).json(new ApiResponse(200, updateGift, "About Us updated successfully!"));
}
);
// create api get all gifts
const getGiftList = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, title = "" } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  let query = {};
  if (title) {
      query.title = { $regex: title, $options: "i" }; // Case-insensitive search
  }

  const totalDocuments = await Gift.countDocuments(query);
  const gifts = await Gift.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

  return res.status(200).json(new ApiResponse(200, { page, limit, totalDocuments, response: gifts }, "Gifts fetched successfully!"));
});

// create api delete gift
 const deleteGift = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const gift = await Gift.findByIdAndDelete(id);   
   if (!gift) {
    throw new ApiError(404, "Gift not found!");
   }
   return res.status(200).json(new ApiResponse(200, gift, "Gift deleted successfully!"));
 }    
 );



export {
  addGift,
  updateGift,
  deleteGift,
  getGiftList
}