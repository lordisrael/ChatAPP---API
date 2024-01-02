const Chat = require("../models/chat");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
// Function to handle sending messages
const sendMessage = async (io, senderId, receiverId, text) => {
  try {
    // const { text } = data;

    const sender = await User.findById(senderId).populate("friends");

    if (
      !sender ||
      !sender.friends.some((friend) => friend._id.equals(receiverId))
    ) {
      console.error("Receiver is not a friend of the sender");
      return; // Receiver is not a friend, halt the process
    }

    if (!text || text.trim() === "") {
      console.error("Empty message text");
      return; // Don't proceed if the message text is empty
    }

    // Check if a chat exists between these two users
    let chat = await Chat.findOne({
      $or: [
        { participants: { $all: [senderId, receiverId] } },
        { participants: { $all: [receiverId, senderId] } }, // Check both combinations
      ],
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

    io.to(chat._id.toString()).emit("message", { senderId, text });
    //socket.emit("message", { senderId, text });
    
  } catch (error) {
    // Handle errors
    console.error(error);
    // You might want to emit an error event here
  }
};

const verifyToken = async (token) => {
  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
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
  io.use(authenticateSocket, (error) => {
    console.error(error.message);
    socket.disconnect();
  });

  io.on("connection",async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const receiverId = socket.handshake.query.receiverId;
    if (!receiverId) {
      console.log("No receiverId provided. Cannot create chat.");
      // Handle the absence of receiverId, such as emitting an error event or disconnecting the socket
      socket.disconnect();
      return;
    }

    let chat = await Chat.findOne({
      $or: [
        { participants: { $all: [socket.user._id, receiverId] } },
        { participants: { $all: [receiverId, socket.user._id] } },
      ],
    });

    // if (!chat) {
    //   chat = new Chat({
    //     participants: [socket.user._id, receiverId],
    //   });
    // }
    if (!chat) {
      console.log("Creating a new chat...");

      // If no chat exists, create a new one
      let newChat = new Chat({
        participants: [socket.user._id, receiverId],
        messages: [], // Initialize messages as an empty array
      });

      try {
        chat = await newChat.save();
        console.log("New chat created:", chat._id);
      } catch (error) {
        console.error("Error creating a new chat:", error);
        socket.disconnect();
        return;
      }
    }

    if (!chat) {
      console.error("Chat not found for the user");
      socket.disconnect();
      return;
    }

    socket.join(chat._id.toString());

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

      // if (socket.user) {
      //   console.log(socket.user);
      // }

      if (!socket.user || !socket.user._id) {
        console.error("User not properly authenticated");
        // Handle the error or emit an error event here
        return;
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = handleChatEvents; 
