const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const { initializeSocket } = require("./src/app/helpers/socket");

const http = require("http"); // Import the HTTP module for Socket.IO

require("dotenv").config();

const app = express();
const PORT = 3027;

const routes = require("./src/app/routes/route");

const server = http.createServer(app); // Create an HTTP server instance and attach Express to it
initializeSocket(server);

// Starting the server
server.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);

  // Listen on the HTTP server instead of the app directly
  console.log(`Socket.IO server listening on port ${PORT}`);

  await mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.log("MongoDB connection error:", err));
    
  app.use(bodyParser.json());
  app.use(cors());
  app.use("/api", routes);
});


