require("dotenv").config();
require("express-async-errors");
const express = require("express");
const http = require("http");

const helmet = require("helmet");
const cors = require("cors");
const rateLimiter = require("express-rate-limit");

// //swagger
// const swaggerUI = require('swagger-ui-express')
// const YAML = require('yamljs')
// const swaggerDocument = YAML.load('./swagger.yaml')



const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// app.set("trust proxy", 1);
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//   })
// );
app.use(helmet.xssFilter());
// app.use(cors());
// app.use(xss());

const socketIO = require("socket.io");

const handleChatEvents = require("./controllers/msgCtrl");
const handleGroupChatEvents = require('./controllers/grpMsgChatCtrl')
const errorHandlerMiddleware = require("./middleware/error-handler");
const notFoundMiddleware = require("./middleware/not-Found");
const authRoute = require("./routes/authRoute");
const chatRoute = require('./routes/chatRoutes')
const groupRoute = require('./routes/groupRoute')
const searchRoute = require('./routes/searchRoutes')

app.use(express.json());
app.use(cookieParser());

// app.get("/", (req, res) => {
//   res.send('<h1>E commerce</h1><a href="/api-docs">Documentation</a>');
// });
// app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute)
app.use("/api/group", groupRoute)
app.use("/api/search", searchRoute)

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: "*", // Allow requests from any origin
  },
});


handleGroupChatEvents(io)
handleChatEvents(io)


// app.get("/", (req, res) => {
//   res.send("<h1>Welcome to the Chat App!</h1>");
// });


const dbConnect = require("./config/db");

const start = async () => {
  try {
    await dbConnect(process.env.MONGO_URI);
    console.log('Mongo connected')
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
start();
