const express = require("express");
const router = express.Router();

const {createGroup, deleteGroup, groupBio, addFriendstoGrp, deleteMsgBySender} = require('../controllers/grpMsgCtrl')

const auth = require("../middleware/authMiddleware");

router.post("/:groupId/users/:userId", auth, addFriendstoGrp);
router.delete("/:groupId/message/:messageId", auth, deleteMsgBySender);
router.post("/create", auth, createGroup);
router.put("/edit-bio/:groupId", auth, groupBio)
router.delete("/delete/:groupId", auth, deleteGroup)


module.exports = router;
