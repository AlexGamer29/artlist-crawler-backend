const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const { createDownloadableLink } = require("../helpers/helper");
const { cacheData } = require("../../app/middleware/middleware");
const Links = require("../model/Links");
const { initQueue, getAllJobsInfo } = require("../helpers/queue");

// Import Socket.IO
const { getIoInstance } = require("../helpers/socket");

router.get("/", async (req, res) => {
  try {
    const jobInfo = await getAllJobsInfo();
    res.json(jobInfo);
  } catch (error) {
    console.error("Error getting job info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/links", async (req, res) => {
  const allLinks = await Links.find();
  res.json({
    data: allLinks,
  });
});

// Define the POST /links route
router.post("/links", cacheData, async (req, res) => {
  const link = req.body.link;
  console.log(`Received link:`, link);

  if (!link) {
    return res.status(400).json({ error: "Link is not correct." });
  }

  try {
    // Add the job to the queue
    const job = await initQueue.add(
      { link },
      { delay: 5000, attempts: 5, removeOnComplete: true }
    );

    const jobInfo = await getAllJobsInfo();
    const io = getIoInstance();
    io.emit("newJob", jobInfo); // Replace 'jobInfo' with the actual data

    // Wait for the job to complete and get the result
    const result = await job.finished(); // This waits until the job is finished
    if (result) {
      io.emit("newJobFinished", result); // Replace 'jobInfo' with the actual data
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/download", (req, res) => {
  const fileName = req.query.filename;

  if (!fileName) {
    return res.status(400).send({
      error: "Please provide a valid filename in the query parameters.",
    });
  }

  const filePath = createDownloadableLink(fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Set the Content-Disposition header to suggest the filename when downloading
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// Serve files from the 'exports' directory
const exportsPath = path.join(__dirname, "..", "..", "..", "exports");
router.use("/exports", express.static(exportsPath));

// Error handling middleware
router.use((err, req, res, next) => {
  res.status(500).send("An error occurred: " + err.message);
});

module.exports = router;
