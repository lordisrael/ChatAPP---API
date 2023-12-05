const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "default_profile_picture.jpg", // Default profile picture URL
  },
  bio: {
    type: String,
    default: "",
  },
  // Array to store friends or connections
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  // Additional fields
//   status: {
//     type: String,
//     enum: ["Online", "Offline", "Away"],
//     default: "Offline",
//   },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  // Array to store friend requests
  friendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  // Array to store blocked users
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  // Array to store chat messages or conversations
  conversation: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
  ],
});

// Virtual field for confirmPassword
userSchema.virtual('confirmPassword')
  .get(function() {
    return this._confirmPassword;
  })
  .set(function(value) {
    this._confirmPassword = value;
  });


// Pre-save hook to hash the password before saving to the database
userSchema.pre('save', async function(next) {
  try {
    // Hash the password only if it's modified or a new user
    if (!this.isModified('password')) {
      return next();
    }
    // Check if password and confirmPassword match
    if (this.password !== this._confirmPassword) {
      throw new Error("Passwords don't match");
    }
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    return next();
  } catch (error) {
    return next(error);
  }
});

// Method to compare passwords for login/authentication
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    return false;
  }
};

// Create User model using the schema
const User = mongoose.model("User", userSchema);

module.exports = User;
