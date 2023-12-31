const express = require("express");
const router = express.Router();

const {getAllChat, getAChat, sendPICorVID} = require("../controllers/chatCtrl")
const {uploadPhotoOrVideo, chatImgResize, chatMediaResize} = require('../middleware/uploadImageOrVideoMiddleware')

const auth = require("../middleware/authMiddleware");

router.get("/get-all-chat", auth, getAllChat)
router.get("/get-a-chat/:id", auth, getAChat)



router.put(
  "/upload/:id",
  auth,
  uploadPhotoOrVideo.array("media", 10),
  chatImgResize,
  chatMediaResize,
  sendPICorVID
);


module.exports = router