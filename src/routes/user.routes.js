import { Router } from "express";
import {
  changeCurrentUserPassword,
  getChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refreshtoken").post(refreshAccessToken);

router
  .route("/change-current-password")
  .post(verifyJwt, changeCurrentUserPassword);
router.route("/currentuser").post(verifyJwt);
router.route("/update-account-details").patch(verifyJwt);
router
  .route("/update- avatar")
  .patch(verifyJwt, upload.single("avatar"), updateAvatar);
router
  .route("/update-coverimage")
  .patch(verifyJwt, upload.single("coverImage"), updateCoverImage);
router.route("/get-channel-profile").get(verifyJwt, getChannelProfile);

router.route("/get-watch-history").get(verifyJwt, getWatchHistory);

export default router;
