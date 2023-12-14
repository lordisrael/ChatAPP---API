const User = require('../models/user')
const asyncHandler = require("express-async-handler");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors");
const { createJWT } = require("../config/jwt");
const { createRefreshJWT } = require("../config/refreshToken");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");


const createUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userAlreadyExist = await User.findOne({ email });
  if (!userAlreadyExist) {
    const user = await User.create(req.body);
    const token = createJWT(user._id, user.username);
    res.status(StatusCodes.CREATED).json({ user, token: token });
  } else {
    throw new BadRequestError("Email already exist");
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.comparePassword(password))) {
    const refreshToken = await createRefreshJWT(user._id);
    /* const updateUser =*/ await User.findByIdAndUpdate(
      user._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    // _   id:user._id,
    //     firstname: user.firstname,
    //     secondname: user.secondname,
    //     email: user.email,
    //     mobile: user.email,
    //     token: createJWT(user._id, user.firstname)
    res.status(StatusCodes.OK).json({
      _id: user._id,
      firstname: user.firstname,
      secondname: user.secondname,
      email: user.email,
      mobile: user.mobile,
      token: createJWT(user._id, user.firstname),
    });
  } else {
    throw new UnauthenticatedError("Invalid credentials");
  }
});


module.exports = {
    createUser,
    login
}
