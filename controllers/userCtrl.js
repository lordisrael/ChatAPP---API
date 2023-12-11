const User = require('../models/user')
const asyncHandler = require("express-async-handler");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");


const createUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userAlreadyExist = await User.findOne({ email });
  if (!userAlreadyExist) {
    const user = await User.create(req.body);
    const token = createJWT(user._id, user.firstname);
    res.status(StatusCodes.CREATED).json({ user, token: token });
  } else {
    throw new BadRequestError("Email already exist");
  }
});

module.exports = {
    createUser
}
