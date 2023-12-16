const Chat = require("../models/chat");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
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
const sendMessage = async (socket, senderId, receiverId, text) => {
  try {
    //const { senderId, receiverId, text } = data;
    // const { text } = data;
    // const senderId = socket.user._id;
    // const receiverId = socket.handshake.query.receiverId;

    if (!text || text.trim() === "") {
      console.error("Empty message text");
      return; // Don't proceed if the message text is empty
    }

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
    //io.to(senderId).emit("message", { senderId, text });
    //io.to(receiverId).emit("message", { senderId, text });
    socket.to(senderId).emit("message", { senderId, text });
    socket.to(receiverId).emit("message", { senderId, text });
  } catch (error) {
    // Handle errors
    console.error(error);
    // You might want to emit an error event here
  }
};

const verifyToken = (token) => {
  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace 'your_secret_key' with your actual secret key
    // const user = User.findById(decoded.id);
    // socket.user = user;
    return decoded;
  } catch (error) {
    return null; // If token verification fails, return null
  }
};

// Socket.io event handling
const handleChatEvents = (io) => {
  const authenticateSocket = async (socket, next) => {
    // const token =
    //   socket.handshake.Headers.Authorization ||
    //   socket.handshake.query.token ||
    //   socket.request.headers.token ||
    //   socket.handshake.Headers.token ||
    //   socket.handshake.headers.access_token;;
    const token = socket.request.headers.token;
    console.log("Received token:", token);
    //socket.request.cookies.my_token;
    const payLoad = await verifyToken(token);
    if (!payLoad) {
      console.error("Invalid token");
      next(new Error("Invalid token"));
      return;
    }

    const user = await User.findById(payLoad.id);
    if (!user) {
      console.error("User not found");
      next(new Error("User not found"));
      return;
    }

    socket.user = user;
    next();
  };

  // Apply the authentication middleware to your socket connection
  //io.use(authenticateSocket);
  io.use(authenticateSocket, (error) => {
    console.error(error.message);
    socket.disconnect();
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const receiverId = socket.handshake.query.receiverId;

    // Function to verify the JWT token and retrieve user information

    // const authenticateSocket = async (socket, next) => {
    //   // const token =
    //   //   socket.handshake.Headers.Authorization ||
    //   //   socket.handshake.query.token ||
    //   //   socket.request.headers.token ||
    //   //   socket.handshake.Headers.token ||
    //   //   socket.handshake.headers.access_token;;
    //   const token = socket.request.headers.token;
    //   console.log("Received token:", token);
    //   //socket.request.cookies.my_token;
    //   const payLoad = await verifyToken(token);
    //   if (!payLoad) {
    //     console.error("Invalid token");
    //     next(new Error("Invalid token"));
    //     return;
    //   }

    //   const user = await User.findById(payLoad.id);
    //   if (!user) {
    //     console.error("User not found");
    //     next(new Error("User not found"));
    //     return;
    //   }

    //   socket.user = user;
    //   next();
    // };

    // // Apply the authentication middleware to your socket connection
    // //io.use(authenticateSocket);
    // io.use(authenticateSocket, (error) => {
    //   console.error(error.message);
    //   socket.disconnect();
    // });

    // // Handle sending messages
    // // socket.on("message", (data) => {
    // //   sendMessage(socket, data);
    // // });

    // Handle sending messages
    socket.on("message", async (text) => {
      //const { text } = data;

      if (!text || text.trim() === "") {
        console.error("Empty message text");
        return; // Don't proceed if the message text is empty
      }
      
      await sendMessage(
        io,
        socket.user._id,
        socket.handshake.query.receiverId,
        text
      );

      if(socket.user) {
        console.log(socket.user)
      }

      if (!socket.user || !socket.user._id) {
        console.error("User not properly authenticated");
        // Handle the error or emit an error event here
        return;
      }

      // const senderId = socket.user._id; // Fetch senderId from authenticated user via socket

      // // Call sendMessage function with senderId, receiverId, and text
      // sendMessage(io, senderId, receiverId, text);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Additional cleanup or handling can be added here if needed
    });
  });
};

module.exports = handleChatEvents; 
