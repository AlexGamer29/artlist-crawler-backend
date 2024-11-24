const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const createRoutes = require("./routes/route");
const CrawlerService = require("./services/crawler.service");
const FileService = require("./services/file.service");
const QueueService = require("./services/queue.service");
const SocketService = require("./services/socket.service");
const DbService = require("./services/db.service");

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(cors());
  }

  async initialize(server) {
    try {
      // Initialize services
      this.crawler = new CrawlerService();
      this.file = new FileService();
      this.db = new DbService();

      // Initialize Socket service with server instance
      this.socketService = new SocketService(server);

      // Initialize Queue service with other services
      this.queueService = new QueueService(this.crawler, this.file, this.db);

      // Setup queue event listeners
      this.queueService.queue.on("completed", (job, result) => {
        this.socketService.emitJobUpdate({
          status: "completed",
          result,
        });
      });

      this.queueService.queue.on("progress", (job, progress) => {
        this.socketService.emitJobUpdate({
          status: "progress",
          id: job.id,
          progress,
          job: job.data.link,
        });
      });

      this.queueService.queue.on("failed", (job, error) => {
        this.socketService.emitJobUpdate({
          status: "failed",
          error: error.message,
        });
      });

      // Setup routes
      this.setupRoutes();
    } catch (error) {
      console.error("Failed to initialize application:", error);
      throw error;
    }
  }

  setupRoutes() {
    this.app.use("/api", createRoutes(this.queueService));
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
