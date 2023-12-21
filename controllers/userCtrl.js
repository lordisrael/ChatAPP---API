const User = require('../models/user')
const asyncHandler = require("express-async-handler");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors/index");
const {cloudinaryUploadImg, cloudinaryDeleteImg, cloudinaryUploadImgDel} = require("../utils/cloudinary");
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
    const { _id, profilePicture } = req.user;
    //console.log(req.file)
    const uploader = (path) => cloudinaryUploadImg(path, "image");

    // Check if there's a previous profile picture and it's not a default picture
    if (
      profilePicture &&
      profilePicture !== process.env.DEFAULT_PROFILE_PICTURE_URL
    ) {
      const publicIdMatch = profilePicture.match(/\/v\d+\/([^/]+)\./);
      const publicId = publicIdMatch ? publicIdMatch[1] : null;

      // Check if the public ID is not one of the specified default IDs
      const defaultPublicIds = process.env.DEFAULT_PUBLIC_IDS; // Add other default public IDs here
      if (publicId && !defaultPublicIds.includes(publicId)) {
        // delete
        await cloudinaryDeleteImg(publicId);
      }
    }

    let imageUrl = "";

    const { path: filePath } = req.file;
    const newpath = await uploader(filePath);
    console.log(newpath);
    imageUrl = newpath;
    //fs.unlinkSync(newpath);

    const updatedUser = await User.findByIdAndUpdate(
      { _id },
      {
        profilePicture: imageUrl.url,
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
  const { _id, profilePicture } = req.user;

  if (!profilePicture) {
    return res
      .status(400)
      .json({ message: "Profile picture URL not found in user data" });
  }

  try {
    // Extracting public ID from the profile picture URL
    const publicIdMatch = profilePicture.match(/\/v\d+\/([^/]+)\./);
    const publicId = publicIdMatch ? publicIdMatch[1] : null;

    if (!publicId) {
      return res
        .status(400)
        .json({ message: "Unable to extract public ID from the URL" });
    }

    // Delete image from Cloudinary using the extracted public ID
    const cloudinaryResult = await cloudinaryDeleteImg(publicId);


    //A default picture is uploaded after user deletes its former profile picture
    let imageUrl = process.env.DEFAULT_PROFILE_PICTURE_URL;
    const updatedUser = await User.findByIdAndUpdate(
      { _id },
      {
        profilePicture: imageUrl,
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      throw new NotFoundError(`No user found`);
    }
    if (updatedUser) {
      return res.status(200).json({ updatedUser });
    }

    res
      .status(200)
      .json({
        updatedUser,
        message: "Profile picture deleted",
      });
  } catch (error) {
      return res
        .status(500)
        .json({ message: "Error deleting profile picture", error });
    }

})

const editBio = asyncHandler(async(req, res) => {

})

module.exports = {
    createUser,
    login,
    uploadProfilePicture,
    deleteProfilePicture
}

      // const updatedUser = await User.findById(
      //  { _id },
      // )
      // console.log(updatedUser)
  
      
  
      // Upload the default image to Cloudinary
      // const defaultImage = "../public/image/user/default.jpg"; 
      // let imageUrl = "";
      // const cloudinaryUploadResult = await cloudinaryUploadImg(
      //   defaultImage,
      //   "image"
      // );
      // imageUrl = cloudinaryUploadResult
      // // Update the user's profilePictureUrl field to null or a default value
      // const updatedUser = await User.findByIdAndUpdate(
      //   { _id },
      //   {
      //     profilePicture: imageUrl.url,
      //   },
      //   {
      //     new: true,
      //   }
      // );
  
      // if (!updatedUser) {
      //   throw new NotFoundError(`No user found`);
      // }
     