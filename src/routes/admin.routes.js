import { Router } from "express";
// import { about, changeCurrentPassword, getAbout, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, resendOtp, scanQrCode, sendOtp, updateAccountDetails, updateUserAvatar,  verifyOtp, } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addGift, deleteGift, getGiftList, updateGift } from "../controllers/admin.controller.js";
import { fileUpload } from "../controllers/file.controller.js";
import { videoUpload } from "../controllers/video.controller.js";
import { generateCoupon, getFilteredCoupons } from "../controllers/generateCoupon.controller.js";
import { addOrUpdateProduct, deleteProduct, getAllMasterProducts } from "../controllers/masterProduct.controller.js";
import { addAccessLimit } from "../controllers/master/dailyCouponAccess.js";
import { addOrUpdateVideo, deleteVideo, getAllVideos } from "../controllers/master/addVideo.controller.js";
import { addCatalogItem, deleteCatalogItem, editCatalogItem, listCatalogItems } from "../controllers/master/catalog.controller.js";
import { createOffer, getOfferGifts, getOffers, updateOffer, updateOfferStatus } from "../controllers/offers/offer.js";
import { addGiftGallery, giftGalleryList } from "../controllers/master/addGift.controller.js";

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
router.route('/addMasterProduct').post(addOrUpdateProduct);
router.route('/get-masterProduct').get(getAllMasterProducts);
router.route('/deleteMasterProduct/:id').delete(deleteProduct);
router.route('/updateMasterProduct/:id').post(updateGift);
router.route('/generate-coupon').post(generateCoupon);
router.route('/coupon/list').get(getFilteredCoupons);
router.route('/daily-access-limit').post(addAccessLimit);
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
router.route('/get-gift-gallery').get(giftGalleryList);



export default router;