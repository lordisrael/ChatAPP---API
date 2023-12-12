const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");

// Assuming you have defined the Conversation model and set up other configurations


// Endpoint for creating a conversation between two users or sending subsequent messages
app.post("/conversations", async (req, res) => {
  try {
    const receiver = req.params
    const message = req.body;
    const sender = req.user._id;

    // Check if a conversation already exists between the sender and receiver
    const existingConversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });

    let conversation;

    if (existingConversation) {
      // If conversation exists, add a new message to the existing conversation
      existingConversation.messages.push({
        sender,
        text: message,
      });
      conversation = await existingConversation.save();
    } else {
      // If no conversation exists, create a new conversation
      const newConversation = new Conversation({
        participants: [sender, receiver],
        messages: [
          {
            sender,
            text: message,
          },
        ],
      });
      conversation = await newConversation.save();
    }

    // Emit an event to inform both participants about the new message
    const participants = [sender, receiver];
    participants.forEach((participantId) => {
      io.to(participantId).emit("newMessage", {
        conversationId: conversation._id,
        message,
      });
    });

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

