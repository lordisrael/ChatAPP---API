const User = require('../models/user')
const asyncHandler = require("express-async-handler");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors/index");
const cloudinaryUploadImg = require("../utils/cloudinary");
const { createJWT } = require("../config/jwt");
const { createRefreshJWT } = require("../config/refreshToken");
const {
  uploadPhoto,
  productImgResize,
} = require("../middleware/uploadImageMiddleware");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const fs = require('fs')


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

  const uploadProfilePicture = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    //console.log(req.file)
    const uploader = (path) => cloudinaryUploadImg(path, "image");
    let imageUrl = "";
    
    const { path: filePath } = req.file;
    const newpath = await uploader(filePath);
    console.log(newpath);
    imageUrl = newpath;
    //fs.unlinkSync(newpath);

    const updatedUser = await User.findByIdAndUpdate(
      { _id },
      {
        profilePicture: imageUrl.url, // Assuming 'image' is the field in your User model for the profile picture
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      throw new NotFoundError(`No user found`);
    }
    res
      .status(StatusCodes.OK)
      .json({ updatedUser, msg: "Profile picture updated" });
  });
const deleteProfilePicture = asyncHandler(async(req, res) => {

})

const editBio = asyncHandler(async(req, res) => {

})

module.exports = {
    createUser,
    login,
    uploadProfilePicture
}
