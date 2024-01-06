const asyncHandler = require("express-async-handler");
const Group = require("../models/group");
const User = require('../models/user')
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors/index");
const {
  cloudinaryUploadImg,
  cloudinaryUploadImgDel,
  cloudinaryUploadVideo,
} = require("../utils/cloudinary");
const { StatusCodes } = require("http-status-codes");

const createGroup = asyncHandler(async (req, res) => {
  const { _id: adminId } = req.user;
  const { name, members } = req.body;

  // Ensure at least one member is provided
  if (!Array.isArray(members) || members.length === 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "An array with at least one member is required" });
  }

    const membersArray = Array.isArray(members) ? members : [members];
  // Add admin to the members list if not already included
//   if (!members.includes(adminId)) {
//     members.push(adminId);
//   }
  if (!membersArray.includes(adminId)) {
    membersArray.push(adminId);
  }


  const groupData = {
    name,
    admin: adminId,
    members: membersArray,
  };

  try {
    const group = await Group.create(groupData);
    res.status(StatusCodes.CREATED).json(group);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to create group" });
  }
});

const deleteGroup = asyncHandler(async(req, res) => {
  const {_id} = req.user
  const groupId = req.params.groupId

  try {
    const group = await Group.findOne({ _id: groupId, admin: _id });

    if (!group) {
      return res
        .status(404)
        .json({ message: "Group not found or user is not admin" });
    }

    // If the user is an admin and the group exists, proceed with deletion
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete group", error: error.message });
  }
})

const deleteMsgBySender = asyncHandler(async(req, res) => {
  const { _id } = req.user;
  const groupId = req.params.groupId;
  const messageId = req.params.messageId
  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Find the message within the group's messages array
    const message = group.messages.id(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    console.log(message.sender)
    console.log(_id)

     const senderIdString = message.sender.toString();
     const userIdString = _id.toString();

     // Check if the logged-in user is the sender of the message
     if (senderIdString !== userIdString) {
       return res
         .status(403)
         .json({ message: "You are not authorized to delete this message" });
     }

    // Remove the message if the sender matches the logged-in user using findOneAndDelete
    await Group.findOneAndUpdate(
      { _id: groupId },
      { $pull: { messages: { _id: messageId } } },
      { new: true }
    );
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {}

})

const groupBio = asyncHandler(async(req, res) => {
  const { _id } = req.user;
  const { bio} = req.body;
  const groupId = req.params.groupId;
  try {
    console.log (groupId)
    console.log(_id)

    const group = await Group.findOneAndUpdate(
      { _id: groupId, admin: _id },
      { $set: { bio: bio } },
      { new: true }
      );
      
      if (!group) {
        return res
          .status(404)
          .json({ message: "Group not found or user is not admin" });
      }
    

    res.status(200).json({ group, message: "Bio updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating bio", error: error.message });
  }

})

const addFriendstoGrp = asyncHandler(async(req, res) => {
  const {_id} = req.user
  const groupId = req.params.groupId;
  const userId = req.params.userId

  try {
       const userExists = await User.findById(userId); // Assuming you have a User model

       if (!userExists) {
         return res.status(404).json({ message: "User not found" });
       }

       // Update the group by adding the user to the members array
       const updatedGroup = await Group.findOneAndUpdate(
         { _id: groupId, admin: _id, members: { $ne: userId } }, // Ensure user is not already a member
         { $push: { members: userId } },
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
const sendPICorVID = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
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

    //const updateFields = {};
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

    // if (messageObjects.length > 0) {
    //   updateFields.$push = { messages: { $each: messageObjects } };
    // }

    const group = await Group.findByIdAndUpdate(
      groupId,
      {
        $push: {
          messages: {
            $each: messageObjects,
          },
        },
      },
      {
        new: true, // To return the updated document
        runValidators: true, // To run validators for the updated document
      }
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json(group);// Sending back the updated chat object as a response
  });


module.exports = {
  createGroup,
  groupBio,
  deleteMsgBySender,
  deleteGroup,
  addFriendstoGrp,
  sendPICorVID
};