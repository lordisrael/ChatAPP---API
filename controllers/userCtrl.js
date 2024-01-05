const User = require('../models/user')
const Group = require("../models/group")
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
  const { _id } = req.user;
  const { bio } = req.body;
   try {
     const updatedUser = await User.findByIdAndUpdate(
       { _id },
       { bio: bio },
       { new: true }
     );

     if (!updatedUser) {
       throw new NotFoundError(`No user found`);
     }

     res.status(200).json({ /*updatedUser,*/ message: "Bio updated successfully" });
   } catch (error) {
     res
       .status(500)
       .json({ message: "Error updating bio", error: error.message });
   }
})

const sendFriendRequest = asyncHandler(async(req, res) => {
  const { _id } = req.params;
  const senderId = req.user.id;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(_id);

  if (!sender || !receiver) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the receiver is already in the sender's friend requests or friends
  const isReceiverInfriends = sender.friends.some((friend) =>
    friend.user.equals(_id)
  );

  if (isReceiverInfriends) {
    return res.status(400).json({
      message: "User is already a friend",
    });
  }

  // Check if the receiver has already sent a friend request to the sender
  const isRequestSent = receiver.friendRequests.includes(senderId);

  if (isRequestSent) {
    return res.status(400).json({
      message: "Friend request already sent by the receiver",
    });
  }

  // Add receiver's ID to sender's friend requests
  receiver.friendRequests.push(senderId);
  await receiver.save();

  return res.status(200).json({ message: "Friend request sent" });
})

const viewFriendRequests = asyncHandler(async (req, res) => {
  // Assuming authenticated user's ID is available in req.user.id
  const userId = req.user.id;

  const user = await User.findById(userId).populate(
    "friendRequests",
    "username email _id"
  ); // Populate only necessary fields

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(StatusCodes.OK).json({ friendRequests: user.friendRequests });
});

const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params; // ID of the friend request
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Find the friend request index containing the requestId
  const requestIndex = user.friendRequests.findIndex(
    (request) => request.toString() === requestId
  );
  if (requestIndex === -1) {
    return res.status(404).json({ message: "Friend request not found" });
  }

  // Extract the requestId from the friendRequests array
  const extractedRequestId = user.friendRequests[requestIndex];

  // Fetch the user who sent the friend request (sender)
  const sender = await User.findById(extractedRequestId);
  if (!sender) {
    return res.status(404).json({ message: "Sender not found" });
  }

  // Check if the request exists in the user's friend requests
  if (!user.friendRequests.includes(requestId)) {
    return res.status(404).json({ message: "Friend request not found" });
  }

  // Remove sender's ID from receiver's friend requests
  user.friendRequests.splice(requestIndex, 1);

  // Add sender's ID to receiver's friends
  user.friends.push(sender._id); // Push sender's ID directly

  // Add receiver's ID to sender's friends
  sender.friends.push(user._id); // Push receiver's ID directly

  await user.save();
  await sender.save();
  return res.status(200).json({ message: "Friend request accepted" });
});

const profile = asyncHandler(async(req, res) => {
  const {_id} = req.user

  const user = await User.findById(_id).select('username bio email profilePicture')
  res.status(StatusCodes.OK).json(user);
  
})

const searchFriends = asyncHandler(async(req, res) => {
  const {username} = req.query
  const queryObject = {}
  if(username) {
    queryObject.username = {$regex: username, $options: 'i'}
  }
  let result  = User.find(queryObject)
  const user = await result.select('username profilePicture')
  res.status(StatusCodes.OK).json(user)
  
})

const displayFriendList = asyncHandler(async(req, res) => {
  const { _id } = req.user;

  const user = await User.findById(_id).select(
    "friends"
  ).populate({
    path: "friends", 
    select: "username profilePicture"
  });
  res.status(StatusCodes.OK).json(user);
})

const leaveGroup = asyncHandler(async(req, res) => {
  const userId = req.user.id;
  const groupId = req.params.groupId
  try {
     const userExists = await User.findById(userId); // Assuming you have a User model

     if (!userExists) {
       return res.status(404).json({ message: "User not found" });
     }
     const updatedGroup = await Group.findByIdAndUpdate(
       { _id: groupId}, // Ensure user is not already a member
       { $pull: { members: userId } },
       { new: true }
     );

     if (!updatedGroup) {
       return res
         .status(404)
         .json({ message: "Group not found or user already a member" });
     }
     res.status(200).json({ updatedGroup });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }

})


module.exports = {
    createUser,
    login,
    editBio,
    uploadProfilePicture,
    sendFriendRequest,
    viewFriendRequests,
    leaveGroup,
    acceptFriendRequest,
    deleteProfilePicture,
    profile,
    searchFriends,
    displayFriendList
}
