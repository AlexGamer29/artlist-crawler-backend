const socketIo = require("socket.io");

let io; // Declare a variable to hold the Socket.IO instance

function initializeSocket(server) {
    io = socketIo(server);

    io.on("connection", (socket) => {
        console.log("A user connected");
        // You can define your Socket.IO logic here
        // For example, emit real-time updates when a new job is available
        socket.on("newJob", (jobInfo) => {
            console.log("New job:", jobInfo);
            socket.broadcast.emit("newJobAvailable", jobInfo);
        });

        socket.on("newJobFinished", (jobInfo) => {
            console.log("Done:", jobInfo);
            socket.broadcast.emit("HEHE", jobInfo);
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("A user disconnected");
        });
    });
}

function getIoInstance() {
    if (!io) {
        throw new Error("Socket.IO has not been initialized.");
    }
    return io;
}

module.exports = { initializeSocket, getIoInstance };
