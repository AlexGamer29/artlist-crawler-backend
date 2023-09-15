const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const http = require("http"); // Import the HTTP module for Socket.IO
const socketIo = require("socket.io"); // Import Socket.IO

require("dotenv").config();

const app = express();
const PORT = 3027;
const SOCKET_PORT = 3028;

const routes = require("./src/app/routes/route");

app.use(bodyParser.json());
app.use(cors());
app.use("/api", routes);

// Starting the server
const server = app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);

  await mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.log("MongoDB connection error:", err));
});

// Create an HTTP server instance to attach Socket.IO to
const httpServer = http.createServer(app);
// Initialize Socket.IO and attach it to the HTTP server
const io = socketIo(httpServer);
// Set up a Socket.IO route
io.on("connection", (socket) => {
  console.log("A user connected");
  // You can emit real-time updates here
  // For example, emit a message when a new job is available
  // Replace 'jobInfo' with the actual data you want to send
  socket.on("newJob", (jobInfo) => {
    console.log("New job:", jobInfo);
    socket.broadcast.emit("newJobAvailable", jobInfo); // Broadcast the new job to all connected clients
  });
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
// Listen on the HTTP server instead of the app directly
httpServer.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO server listening on port ${SOCKET_PORT}`);
});
