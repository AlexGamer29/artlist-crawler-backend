const socketIO = require("socket.io");

class SocketService {
  constructor(server) {
    this.io = socketIO(server);
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on("connection", (socket) => {
      console.log("Client connected");

      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }

  emitJobUpdate(jobData) {
    this.io.emit("job", jobData);
  }
}

module.exports = SocketService;
