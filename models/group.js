const mongoose = require("mongoose");

// Group Schema
const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to a User model (assuming you have a User model)
    },
  ],
});

// Group model
const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
