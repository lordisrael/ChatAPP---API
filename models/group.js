const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video"],
  },
  text: String,
  imageUrl: [String],
  videoUrl: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Group Schema
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  groupProfilePicture: {
    type: String,
    default: process.env.DEFAULT_PROFILE_PICTURE_URL,
  },
  bio: {
    type: String,
    default: "",
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  messages: [messageSchema],
});

// Group model
const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
