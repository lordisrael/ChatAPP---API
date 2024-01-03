const express = require("express");
const router = express.Router();

const {
  createUser,
  login,
  uploadProfilePicture,
  deleteProfilePicture,
  editBio,
  sendFriendRequest,
  viewFriendRequests,
  acceptFriendRequest,
  profile,
  displayFriendList,
  
} = require("../controllers/userCtrl");

const auth = require("../middleware/authMiddleware");
const {
  uploadPhoto,
  userImgResize,
} = require("../middleware/uploadImageMiddleware");

router.post("/register", createUser);
router.post("/login", login);
router.put(
  "/upload",
  auth,
  uploadPhoto.single("image"),
  userImgResize,
  uploadProfilePicture
);

router.put(
  "/delete",
  auth,
  deleteProfilePicture
);
router.post("/send-friend-request/:_id", auth, sendFriendRequest);
router.get("/view-friend-requests", auth, viewFriendRequests);
router.put("/accept-friend-request/:requestId", auth, acceptFriendRequest);
router.put( "/editbio", auth, editBio)
router.get("/profile", auth, profile)
router.get("/dispaly-friend-list", auth, displayFriendList)


module.exports = router;
