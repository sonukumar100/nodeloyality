import { Router } from "express";
// import { about, changeCurrentPassword, getAbout, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendOtp, scanQrCode, sendOtp, updateAccountDetails, updateUserAvatar,  verifyOtp, } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addGift, deleteGift, getGiftList, updateGift } from "../controllers/admin.controller.js";
import { fileUpload } from "../controllers/file.controller.js";
import { videoUpload } from "../controllers/video.controller.js";
import { generateCoupon, getFilteredCoupons } from "../controllers/generateCoupon.controller.js";
import { addProduct } from "../controllers/masterProduct.controller.js";
import { addAccessLimit } from "../controllers/master/dailyCouponAccess.js";

const router = Router();
router.route('/add-gift').post( upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    
  ]),addGift);
router.route('/update-gift/:id').post(updateGift);
router.route('/delete-gift/:id').delete(deleteGift);
router.route('/gift-list').get(verifyJwt,getGiftList);
router.route('/file-upload').post(fileUpload)
router.route("/video-upload").post(
  upload.fields([ 
    {
      name: "video",
      maxCount: 1,
    },
   
  ]),
  videoUpload
);  
router.route('/addMasterProduct').post(addProduct);
router.route('/updateMasterProduct/:id').post(updateGift);
router.route('/generate-coupon').post(generateCoupon);
router.route('/coupon/list').get(getFilteredCoupons);
router.route('/daily-access-limit').post(addAccessLimit);


export default router;