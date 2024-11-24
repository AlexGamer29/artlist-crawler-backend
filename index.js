const mongoose = require("mongoose");
const config = require("./src/config/config");
const App = require("./src/app");

// MongoDB Connection
async function connectToMongoDB() {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// Graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = async () => {
    console.log("Received shutdown signal");

    // Close server
    server.close(() => {
      console.log("HTTP server closed");
    });

    // Close database connection
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }

    // Exit process
    process.exit(0);
  };

  // Handle different signals
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown();
  });
}

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Create Express app instance
    const application = new App();
    const app = application.getApp();

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      console.log(`Server is running on port ${config.server.port}`);
    });

    // Initialize application with server instance
    await application.initialize(server);

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the application
startServer().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
