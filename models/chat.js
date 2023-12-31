const mongoose = require("mongoose");

// Define Chat Schema
const chatSchema = new mongoose.Schema({
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        messageType: {
          type: String,
          enum: ["text", "image", "video"], // Enum defining message types
        },
        text: String, // For text messages
        imageUrl: [], // For image URL or path
        videoUrl: [], // For video URL or path
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create Chat model using the schema
const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
