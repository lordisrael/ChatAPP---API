const Chat = require("../models/chat");
const User = require("../models/user");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors/index");
const { StatusCodes } = require("http-status-codes");
const {cloudinaryUploadImg, cloudinaryUploadImgDel, cloudinaryUploadVideo} = require("../utils/cloudinary");
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const getAllChat = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    // Find chats where the user ID is a participant
    let chats = await Chat.find({ participants: { $in: [_id] } }).select(
      "-messages -createdAt -updatedAt -__v"
    ).populate({
        path: 'participants',
        select: 'username',
        match: { _id: { $ne: _id } } // Populate participant usernames only
      });

    res.status(StatusCodes.OK).json({ chats });
  } catch (error) {
    // Handle errors appropriately
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
});



const getAChat = asyncHandler(async(req, res) => {
  const { id: chatId } = req.params;
  const userId = req.user._id;
  const chat = await Chat.findById({ _id: chatId })
    .select("-participants")
    .populate({
      path: "messages", // Populate the 'messages' field
      populate: {
        path: "sender", // Populate the 'sender' field within 'messages'
        select: "username", // Select the 'username' field of the sender
      },
    });


  if (!chat) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Chat not found" });
  }

  res.status(StatusCodes.OK).json(chat);
})


const sendPICorVID = asyncHandler(async (req, res) => {
  const { id: chatId } = req.params;
  const userId = req.user._id;

  const uploader = async (path, resourceType) => {
    // Uploads the file to Cloudinary with the specified resource type
    console.log(`Uploading ${resourceType} file: ${path}`);
    if (resourceType === "image") {
      return await cloudinaryUploadImg(path, "image");
    }
    if (resourceType === "video") {
      return await cloudinaryUploadVideo(path, "video");
      // Assuming a separate function cloudinaryUploadVideo for video uploads
    }
    // return await  cloudinaryUploadImg(path, resourceType);
  };
  // const uploader = (path) => cloudinaryUploadImg(path, "media");

  const files = req.files;
  const imageFiles = [];
  const videoFiles = [];

  // Categorize files into image and video arrays based on MIME type or other criteria
  for (const file of files) {
    if (file.mimetype.startsWith("image")) {
      imageFiles.push(file.path);
    } 
    if (file.mimetype.startsWith("video")) {
      videoFiles.push(file.path);
    }
  }
  console.log("Image Files:", imageFiles);
  console.log("Video Files:", videoFiles);


  const uploadedImageUrls = await Promise.all(
    imageFiles.map(async (path) => {
      return await uploader(path, "image");
    })
  );

  const uploadedVideoUrls = await Promise.all(
    videoFiles.map(async (path) => {
      return await uploader(path, "video");
    })
  );
  console.log("Uploaded Image URLs:", uploadedImageUrls);
  console.log("Uploaded Video URLs:", uploadedVideoUrls);

  const updateFields = {};
  const messageObjects = [];

  if (uploadedImageUrls.length > 0) {
    const imageMessages = uploadedImageUrls.map((image) => {
      return {
        sender: userId,
        messageType: "image",
        imageUrl: [image.url],
        createdAt: new Date(),
      };
    });
    messageObjects.push(...imageMessages);
  }

  if (uploadedVideoUrls.length > 0) {
    const videoMessages = uploadedVideoUrls.map((video) => {
      return {
        sender: userId,
        messageType: "video",
        videoUrl: [video.url],
        createdAt: new Date(),
      };
    });
    messageObjects.push(...videoMessages);
  }

  if (messageObjects.length > 0) {
    updateFields.$push = { messages: { $each: messageObjects } };
  }

  const updateChat = await Chat.findByIdAndUpdate(
    { _id: chatId },
    updateFields,
    {
      new: true,
    }
  );

  res.json(updateChat); // Sending back the updated chat object as a response
});





module.exports = {
  getAllChat,
  getAChat,
  sendPICorVID,
  
}