const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const config = require("../config/config");

function createRoutes(queueService) {
  router.get("/", (req, res) => {
    res.json({
      status: "success",
      message: "API is running",
    });
  });
  
  router.get("/link", async (req, res) => {
    try {
      const link = await queueService.db.findOneLink({
          link: req?.query?.link
      })

      res.json({
        status: "success",
        data: link,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.get("/links", async (req, res) => {
    try {
      const links = await queueService.db.getAllLinks();
      res.json({
        status: "success",
        data: links,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.post("/links", async (req, res) => {
    const { link } = req.body;

    if (!link) {
      return res.status(400).json({
        status: "error",
        message: "Link is required",
      });
    }

    try {
      const job = await queueService.addJob(link);
      res.status(200).json({
        status: "success",
        jobId: job.id,
        link: job.data.link,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.get("/download", (req, res) => {
    const { filename } = req.query;

    if (!filename) {
      return res.status(400).json({
        status: "error",
        message: "Filename is required",
      });
    }

    const filePath = path.join(
      __dirname,
      "..",
      "..",
      config.file.exportPath,
      filename
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: "error",
        message: "File not found",
      });
    }

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    fs.createReadStream(filePath).pipe(res);
  });

  // Serve static files from exports directory
  const exportsPath = path.join(__dirname, "..", "..", config.file.exportPath);
  router.use("/exports", express.static(exportsPath));

  // Error handling middleware
  router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  });

  router.get("/queue/status", async (req, res) => {
    try {
      const status = await queueService.getQueueStatus();
      res.json({
        status: "success",
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.post("/queue/clean", async (req, res) => {
    try {
      await queueService.cleanQueue();
      res.json({
        status: "success",
        message: "Queue cleaned successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.get("/queue/detailed-status", async (req, res) => {
    try {
      const status = await queueService.getDetailedQueueStatus();
      res.json({
        status: "success",
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.post("/queue/pause", async (req, res) => {
    try {
      const result = await queueService.pauseQueue();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.post("/queue/resume", async (req, res) => {
    try {
      const result = await queueService.resumeQueue();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.delete("/queue/job/:jobId", async (req, res) => {
    try {
      const result = await queueService.removeJob(req.params.jobId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  router.post("/queue/job/:jobId/retry", async (req, res) => {
    try {
      const result = await queueService.retryJob(req.params.jobId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  });

  return router;
}

module.exports = createRoutes;
