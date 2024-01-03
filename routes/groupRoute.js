const express = require("express");
const router = express.Router();

const {createGroup, deleteGroup, groupBio} = require('../controllers/grpMsgCtrl')

const auth = require("../middleware/authMiddleware");

router.post("/create", auth, createGroup);
router.put("/edit-bio/:groupId", auth, groupBio)
router.delete("/delete/:groupId", auth, deleteGroup)


module.exports = router;
