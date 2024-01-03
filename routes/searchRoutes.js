const express = require("express");
const router = express.Router();

const {
  searchFriends
} = require("../controllers/userCtrl");

const auth = require("../middleware/authMiddleware");

router.get("/", auth, searchFriends);

module.exports = router;
