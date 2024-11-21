const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");

require("dotenv").config();
const app = express();
const port = process.env.PORT;

const routes = require("./src/app/routes/route");

app.use(bodyParser.json());
app.use(cors());
app.use("/api", routes);

// Starting the server
const server = app.listen(port, async () => {
  console.log(`Server started on port ${port}`);

  await mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.log("MongoDB connection error:", err));
});

const io = socketIO(server);
const { initQueue } = require("./src/app/helpers/queue");
initQueue.on("completed", (job, result) => {
  io.emit(`job`, { status: "completed", result });
});

initQueue.on("progress", (job, progress) => {
  io.emit(`job`, { status: "progress", id: job.id, progress: progress, job: job.data.link });
});

initQueue.on("failed", (job, error) => {
  io.emit(`job`, { status: "failed", error: error.message });
});
