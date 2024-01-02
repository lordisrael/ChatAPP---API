const express = require("express");
const router = express.Router();

const {createGroup} = require('../controllers/grpMsgCtrl')

const auth = require("../middleware/authMiddleware");

router.post("/create", auth, createGroup);

module.exports = router;
