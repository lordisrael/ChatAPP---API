const Group = require("../models/group")
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const sendMessage = async(io, senderId, groupId, text) => {
    try {
      console.log("Received groupId:", groupId);
    const group = await Group.findById(groupId);
    //console.log(group)
    
    // Check if the group exists and the sender is a member
    if (group && group.members.includes(senderId)) {
      const message = {
        sender: senderId,
        text: text,
        messageType: "text", // You can customize this based on your needs
      };
      if (!text || text.trim() === "") {
      console.error("Empty message text");
      return; // Don't proceed if the message text is empty
    }
      //console.log("After pushing message:", group.messages);
      group.messages.push(message); // Add the message to the group's messages
      //console.log("After pushing message:", group.messages);
      await group.save(); // Save the updated group with the new message

      // Emit the message to all members in the room (group)
      io.of("/group").to(groupId.toString()).emit("groupmessage", message);
    }
  } catch (error) {
    console.error("Error sending message:", error.message);
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
const handleGroupChatEvents = (io) => {
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

  const groupChatNamespace = io.of("/group");

  // Apply the authentication middleware to your socket connection
  groupChatNamespace.use(authenticateSocket, (error) => {
    console.error(error.message);
    socket.disconnect();
  });



  groupChatNamespace.on("connection", async (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  const groupId = socket.handshake.query.groupId;
  //console.log(groupId)

  socket.join(groupId.toString());

  socket.on("groupmessage", async (text) => {
    // Create a new group
    if (!text || text.trim() === "") {
      console.error("Empty message text");
      return; // Don't proceed if the message text is empty
    }

    await sendMessage(
      io,
      socket.user._id,
      socket.handshake.query.groupId,
      text
    );
  });
  if (!socket.user || !socket.user._id) {
    console.error("User not properly authenticated");
    // Handle the error or emit an error event here
    return;
  }

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});
}

module.exports = handleGroupChatEvents;