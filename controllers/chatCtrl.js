const Chat = require("../models/chat");
const User = require("../models/user");
const {
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
} = require("../errors/index");
const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("express-async-handler");

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

module.exports = {
  getAllChat,
  getAChat
}