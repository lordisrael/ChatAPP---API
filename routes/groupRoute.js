const express = require("express");
const router = express.Router();

const {createGroup, deleteGroup, groupBio, addFriendstoGrp, deleteMsgBySender, sendPICorVID, getAllGroup} = require('../controllers/grpMsgCtrl')
const {
  uploadPhotoOrVideo,
  chatImgResize,
  chatMediaResize,
} = require("../middleware/uploadImageOrVideoMiddleware");

const auth = require("../middleware/authMiddleware");


router.post("/:groupId/users/:userId", auth, addFriendstoGrp);
router.delete("/:groupId/message/:messageId", auth, deleteMsgBySender);
router.post("/create", auth, createGroup);
router.put("/edit-bio/:groupId", auth, groupBio)
router.delete("/delete/:groupId", auth, deleteGroup)
router.get("/get-all-group", auth, getAllGroup)


router.put(
  "/message/upload/:id",
  auth,
  uploadPhotoOrVideo.array("media", 10),
  chatImgResize,
  chatMediaResize,
  sendPICorVID
);


module.exports = router;
