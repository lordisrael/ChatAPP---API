const express = require("express");
const router = express.Router();

const {
  createUser,
  login,
  uploadProfilePicture,
  deleteProfilePicture,
  
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


module.exports = router;
