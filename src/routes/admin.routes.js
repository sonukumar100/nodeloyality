import { Router } from "express";
// import { about, changeCurrentPassword, getAbout, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendOtp, scanQrCode, sendOtp, updateAccountDetails, updateUserAvatar,  verifyOtp, } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { fileUpload } from "../controllers/file.controller.js";
import { videoUpload } from "../controllers/video.controller.js";
import { deleteCoupon, downloadCsv, generateCoupon, getFilteredCoupons, updateCoupon } from "../controllers/generateCoupon.controller.js";
import { addOrUpdateProduct, deleteProduct, getAllMasterProducts } from "../controllers/masterProduct.controller.js";
import { addAccessLimit, getAccessLimit } from "../controllers/master/dailyCouponAccess.js";
import { addOrUpdateVideo, deleteVideo, getAllVideos } from "../controllers/master/addVideo.controller.js";
import { addCatalogItem, deleteCatalogItem, editCatalogItem, listCatalogItems } from "../controllers/master/catalog.controller.js";
import { createOffer, getOfferGifts, getOffers, updateOffer, updateOfferStatus } from "../controllers/offers/offer.js";
import { addGiftGallery, deleteGift, giftGalleryList, updateGift } from "../controllers/master/addGift.controller.js";
import { getRedeemRequestCount, getRedeemRequestList, updateRedeemStatus, updateShippingStatus } from "../controllers/redeemRequest/redeem.controller.js";
import { getAllUsers, getUserById } from "../controllers/user.controller.js";
import { createFaq, getFaqList } from "../controllers/faq/faq.controller.js";
import { getDetailsForMsg, getMsg, getUniqueSenderId } from "../controllers/Chat/message.controller.js";
import { pushNotification } from "../controllers/pushNotifications-controller.js";

const router = Router();
// router.route('/add-gift').post( upload.fields([
//     {
//       name: "avatar",
//       maxCount: 1,
//     },
    
//   ]),addGiftGallery);

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
router.route('/addMasterProduct').post(addOrUpdateProduct);
router.route('/get-masterProduct').get(getAllMasterProducts);
router.route('/deleteMasterProduct/:id').delete(deleteProduct);
// router.route('/updateMasterProduct/:id').post(updateGift);
router.route('/generate-coupon').post(generateCoupon);
router.route('/coupon/list').get(getFilteredCoupons);
router.route('/delete-coupon/:id').delete(deleteCoupon);
router.route('/update-coupon').put(updateCoupon);
router.route('/daily-access-limit').post(addAccessLimit);
router.route('/get-daily-access-limit').get(getAccessLimit);
router.route('/add-video').post(addOrUpdateVideo);
router.route('/delete-video/:id').delete(deleteVideo);
router.route('/get-video').get(getAllVideos);
router.route('/add-digital-catalog').post(
  upload.fields([
  {
    name: "cataLogFile",
    maxCount: 1,
  },
]),addCatalogItem);
router.route('/delete-catalog/:id').delete(deleteCatalogItem);
router.route('/edit-catalog/:id').post(editCatalogItem);
router.route('/get-digital-catalog').get(listCatalogItems);
router.route('/add-offer').post( 
  upload.fields([
    {
      name: "offerImage",
      maxCount: 1,
    },
  ]),createOffer);
router.route('/get-offers').get(getOffers); 
router.route('/update-offer-status').put(updateOfferStatus);
router.route('/offers/:id/gifts').get(getOfferGifts);
router.route('/update-offer/:id').post(
  // upload.fields([
  //   {
  //     name: "avatar",
  //     maxCount: 1,
  //   },
  // ]),
  updateOffer
);
router.route('/add-gift-gallery').post(
  upload.fields([
    {
      name: "giftImage",
      maxCount: 1,
    },
  ]),
  addGiftGallery
);
router.route('/update-gift-gallery').post( upload.fields([
  {
    name: "giftImage",
    maxCount: 1,
  },
]),updateGift);
router.route('/delete-gift-gallery/:id').delete(deleteGift);
router.route('/gift-gallery-list').get(giftGalleryList);

/// redeem request routes///
router.route('/redeem-request-list').get(getRedeemRequestList)
router.route('/get-all-users').get(getAllUsers)
router.route('/get-all-users/:id').get(getUserById);
router.route('/update-redeem-status').post(updateRedeemStatus);
router.route('/get-all-redeem-req-count').get(getRedeemRequestCount);
router.route('/shipped/status').post(updateShippingStatus);
router.route('/create/faq').post(createFaq);
router.route('/get/faq').get(getFaqList);
router.route('/get/msg').get(getMsg);
router.route('/get-msg-unique-data').get(getUniqueSenderId)
router.route('/get-details/msg').get(getDetailsForMsg);
router.route('/push-notification').post(pushNotification);
router.route('/download-csv').get(downloadCsv);





export default router;