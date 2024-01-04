const asyncHandler = require("express-async-handler");
const Group = require("../models/group");
const User = require('../models/user')
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors/index");
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

const deleteMsgByAdmin = asyncHandler(async(req, res) => {
  const { _id } = req.user;
  const groupId = req.params.groupId;
  const messageId = req.params.messageId
  try {

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



module.exports = {
    createGroup,
    groupBio,
    deleteGroup, 
    addFriendstoGrp
}