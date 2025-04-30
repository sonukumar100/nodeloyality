import { Router } from "express";
import { changeCurrentPassword, deleteUser, getAllUsers, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendOtp, sendOtp, updateAccountDetails, updateUserAvatar, updateUserCoverImage, verifyOtp, verifyUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getFilteredCoupons } from "../controllers/generateCoupon.controller.js";
import { scanCoupon } from "../controllers/generateCoupon.controller.js";
import { cancelRedeemRequest, RedeemRequest } from "../controllers/redeemRequest/redeem.controller.js";
import { pushNotification } from "../controllers/pushNotifications-controller.js";
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
router.route('/get-users').get(getAllUsers);
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
router.route('/redeem-request').post(RedeemRequest);
router.route('/redeem-request/cancel').post(cancelRedeemRequest);
router.route('/verify-user/:id').put(verifyUser);
router.route('/delete-user/:id').delete(deleteUser);
router.route('/send-notification').post(pushNotification);







export default router;