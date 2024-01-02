const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

TODO = "657b5789f97454ee9895c500"
TODO = "657b581bfedab7ead7c1b794";
// Define User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide valid email",
      ],
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: process.env.DEFAULT_PROFILE_PICTURE_URL, // Default profile picture URL
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
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group", // Reference to the Group model
      },
    ],
    // Additional fields
    //   status: {
    //     type: String,
    //     enum: ["Online", "Offline", "Away"],
    //     default: "Offline",
    //   },
    // lastSeen: {
    //   type: Date,
    //   default: Date.now,
    // },

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

    refreshToken: {
      type: String,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

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


userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log(resetToken, this.passwordResetToken);
  return resetToken;
};


// Create User model using the schema
const User = mongoose.model("User", userSchema);

module.exports = User;
