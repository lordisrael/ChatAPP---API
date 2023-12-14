require("dotenv").config();
require("express-async-errors");
const express = require("express");

const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;

const app = express();

const socketIO = require("socket.io");

const handleChatEvents = require('./controllers/chatCtrl')
const notFoundMiddleware = require("./middleware/not-Found");
const authRoute = require("./routes/authRoute");

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use(notFoundMiddleware);

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow requests from any origin, modify as needed
  },
});

handleChatEvents(io)


// app.get("/", (req, res) => {
//   res.send("<h1>Welcome to the Chat App!</h1>");
// });


const dbConnect = require("./config/db");

const start = async () => {
  try {
    await dbConnect(process.env.MONGO_URI);
    console.log('Mongo connected')
    // app.listen(port, () => {
    //   console.log(`Server is listening on port ${port}`);
    // });
  } catch (error) {
    console.log(error);
  }
};
start();
