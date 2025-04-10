import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendOtp, sendOtp, updateAccountDetails, updateUserAvatar, updateUserCoverImage, verifyOtp } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getFilteredCoupons } from "../controllers/generateCoupon.controller.js";
import { scanCoupon } from "../controllers/generateCoupon.controller.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "aadhaarBack",
      maxCount: 1,
    },
    {
      name: "aadhaarFront",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route('/login').post(loginUser);
router.route('/logout').get(verifyJwt, logoutUser);
router.route('/refresh-token').get(verifyJwt, refreshAccessToken);
router.route('/change-password').patch(verifyJwt, changeCurrentPassword);
router.route('/get-current-user').get(verifyJwt, getCurrentUser);
router.route('/update-account').patch(verifyJwt, updateAccountDetails);
router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router.route('/update-cover-image').patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);
router.route('/send-otp').post(sendOtp);
router.route('/verify-otp').post(verifyOtp);
router.route('/resend-otp').post(resendOtp);
router.route('/scan-qr-code').post(scanCoupon)
router.route("/coupon/list").get(getFilteredCoupons);



export default router;