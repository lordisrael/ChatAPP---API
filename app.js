require("dotenv").config();
const express = require("express");
const app = express();

const port = process.env.PORT || 3000;

const dbConnect = require("./config/db");

const start = async () => {
  try {
    await dbConnect(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
start();
