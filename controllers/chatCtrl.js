const Chat = require("../models/chat");
// const app = require("express")();
// const http = require("http").Server(app);
// const io = require("socket.io")(http);
// const mongoose = require("mongoose");

// Assuming you have defined the Conversation model and set up other configurations


// Endpoint for creating a conversation between two users or sending subsequent messages
// app.post("/conversations", async (req, res) => {
//   try {
//     const receiver = req.params
//     const message = req.body;
//     const sender = req.user._id;

//     // Check if a conversation already exists between the sender and receiver
//     const existingConversation = await Chat.findOne({
//       participants: { $all: [sender, receiver] },
//     });

//     let conversation;

//     if (existingConversation) {
//       // If conversation exists, add a new message to the existing conversation
//       existingConversation.messages.push({
//         sender,
//         text: message,
//       });
//       conversation = await existingConversation.save();
//     } else {
//       // If no conversation exists, create a new conversation
//       const newConversation = new Conversation({
//         participants: [sender, receiver],
//         messages: [
//           {
//             sender,
//             text: message,
//           },
//         ],
//       });
//       conversation = await newConversation.save();
//     }

//     // Emit an event to inform both participants about the new message
//     const participants = [sender, receiver];
//     participants.forEach((participantId) => {
//       io.to(participantId).emit("newMessage", {
//         conversationId: conversation._id,
//         message,
//       });
//     });

//     res.status(201).json({ conversation });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// Function to handle sending messages
const sendMessage = async (socket, data) => {
  try {
    const { senderId, receiverId, text } = data;

    // Check if a chat exists between these two users
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // If no chat exists, create a new one
    if (!chat) {
      chat = new Chat({
        participants: [senderId, receiverId],
      });
    }

    // Add the message to the chat
    chat.messages.push({
      sender: senderId,
      text,
    });

    await chat.save();

    // Emit the message to the sender and receiver
    socket.to(senderId).emit("message", { senderId, text });
    socket.to(receiverId).emit("message", { senderId, text });
  } catch (error) {
    // Handle errors
    console.error(error);
    // You might want to emit an error event here
  }
};

// Socket.io event handling
const handleChatEvents = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle sending messages
    socket.on("send_message", (data) => {
      sendMessage(socket, data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Additional cleanup or handling can be added here if needed
    });
  });
};

module.exports = handleChatEvents;
