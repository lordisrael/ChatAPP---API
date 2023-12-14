const express = require("express");
const router = express.Router();

const {
  createUser,
  login,
  
} = require("../controllers/userCtrl");

const auth = require("../middleware/authMiddleware");

router.post("/register", createUser);
router.post("/login", login);


module.exports = router;
