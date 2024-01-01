const asyncHandler = require("express-async-handler");
const Group = require("../models/group");
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

})

const groupBio = asyncHandler(async(req, res) => {

})

const addFriendstoGrp = asyncHandler(async(req, res) => {

})

module.exports = {
    createGroup
}