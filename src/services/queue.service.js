// src/services/queue.service.js
const Bull = require("bull");
const path = require("path");
const config = require("../config/config");
const CrawlerService = require("./crawler.service");

class QueueService {
  constructor(crawler, file, db) {
    this.crawler = crawler;
    this.file = file;
    this.db = db;

    // Create queue with concurrency configuration
    this.queue = new Bull(config.queue.name, {
      redis: {
        port: config.redis.port,
        host: config.redis.host,
        username: config.redis.username,
        password: config.redis.password,
      },
      settings: {
        lockDuration: 300000, // 5 minutes
        stalledInterval: 30000, // 30 seconds
        maxStalledCount: config.queue.concurrency,
      },
    });

    this.setupQueue();
    this.setupQueueEvents();
  }

  setupQueue() {
    this.queue.process(config.queue.concurrency, async (job) => {
      const { link } = job.data;
      const crawler = new CrawlerService(); // Create new crawler instance for each job

      job.progress(10);
      console.log(`[Job ${job.id}] Started processing ${link}`);

      try {
        // Initialize crawler
        await crawler.initialize();
        job.progress(20);

        // Crawl and extract data
        const songData = await crawler.crawl(link);
        job.progress(40);

        // Ensure export directory exists
        await this.file.ensureExportDirectory();

        // Generate filenames
        const artistName = this.getArtistNames(songData.artists);
        const aacFilename = `${artistName} - ${songData.songName}.aac`;
        const wavFilename = aacFilename.replace(".aac", ".wav");

        // Download AAC file
        const aacPath = await this.file.downloadFile(
          songData.filePath,
          aacFilename
        );
        job.progress(60);

        // Set up WAV file path
        const wavPath = path.join(this.file.exportPath, wavFilename);

        // Convert to WAV
        await this.file.convertToWav(aacPath, wavPath);
        job.progress(80);

        // Cleanup AAC file
        await this.file.cleanup(aacPath);

        // Save to database
        const result = await this.db.saveLink({
          jobId: job.id,
          song: songData.songName,
          artist: artistName,
          title: wavFilename,
          link: link,
          storagePath: wavPath,
          createdAt: new Date(),
        });

        job.progress(100);
        console.log(`[Job ${job.id}] Completed processing ${link}`);
        return result;
      } catch (error) {
        console.error(`[Job ${job.id}] Error:`, error);
        throw new Error(error.message);
      } finally {
        await crawler.close();
      }
    });
  }

  setupQueueEvents() {
    // Monitor queue events
    this.queue.on("error", (error) => {
      console.error("Queue error:", error);
    });

    this.queue.on("waiting", (jobId) => {
      console.log(`Job ${jobId} is waiting`);
    });

    this.queue.on("active", (job) => {
      console.log(`Job ${job.id} has started processing`);
    });

    this.queue.on("stalled", (job) => {
      console.log(`Job ${job.id} has stalled`);
    });

    this.queue.on("completed", (job, result) => {
      console.log(`Job ${job.id} has completed`);
    });

    this.queue.on("failed", (job, error) => {
      console.error(`Job ${job.id} has failed:`, error);
    });

    // Clean up completed jobs
    this.queue.on("completed", async (job) => {
      await job.remove();
    });
  }

  async getQueueStatus() {
    try {
      const [waiting, active] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
      ]);

      return {
        waiting,
        active,
      };
    } catch (error) {
      console.error("Error getting queue status:", error);
      throw error;
    }
  }

  async getDetailedQueueStatus() {
    try {
      const [
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
        jobs,
        workers,
      ] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount(),
        this.queue.getPausedCount(),
        this.getJobCounts(),
        this.getWorkerInfo(),
      ]);

      return {
        jobs: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused,
          total: waiting + active + completed + failed + delayed + paused,
        },
        jobDetails: jobs,
        workers,
        timestamp: new Date(),
        isQueuePaused: await this.queue.isPaused(),
        queueAge: await this.getQueueAge(),
      };
    } catch (error) {
      console.error("Error getting detailed queue status:", error);
      throw error;
    }
  }

  async getJobCounts() {
    try {
      // Get all jobs of different types
      const [waitingJobs, activeJobs, completedJobs, failedJobs, delayedJobs] =
        await Promise.all([
          this.queue.getJobs(["waiting"], 0, 100),
          this.queue.getJobs(["active"], 0, 100),
          this.queue.getJobs(["completed"], 0, 100),
          this.queue.getJobs(["failed"], 0, 100),
          this.queue.getJobs(["delayed"], 0, 100),
        ]);

      return {
        waiting: this.formatJobs(waitingJobs),
        active: this.formatJobs(activeJobs),
        completed: this.formatJobs(completedJobs),
        failed: this.formatJobs(failedJobs),
        delayed: this.formatJobs(delayedJobs),
      };
    } catch (error) {
      console.error("Error getting job counts:", error);
      throw error;
    }
  }

  formatJobs(jobs) {
    return jobs.map((job) => ({
      id: job.id,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attempts: job.attemptsMade,
      data: job.data,
      progress: job.progress(),
      returnValue: job.returnvalue,
      failReason: job.failedReason,
      status: this.getJobStatus(job),
    }));
  }

  getJobStatus(job) {
    if (job.finishedOn) return "completed";
    if (job.failedReason) return "failed";
    if (job.processedOn) return "active";
    if (job.delay) return "delayed";
    return "waiting";
  }

  async getWorkerInfo() {
    try {
      const workers = await this.queue.getWorkers();
      return workers.map((worker) => ({
        id: worker.id,
        addr: worker.addr,
        name: worker.name,
        db: worker.db,
        status: worker.status,
      }));
    } catch (error) {
      console.error("Error getting worker info:", error);
      throw error;
    }
  }

  async getQueueAge() {
    try {
      const jobs = await this.queue.getJobs(["waiting", "active", "delayed"]);
      if (jobs.length === 0) return 0;

      const oldestJob = jobs.reduce((oldest, job) =>
        job.timestamp < oldest.timestamp ? job : oldest
      );

      return Date.now() - oldestJob.timestamp;
    } catch (error) {
      console.error("Error getting queue age:", error);
      throw error;
    }
  }

  // Queue control methods
  async pauseQueue() {
    try {
      await this.queue.pause();
      return { success: true, message: "Queue paused successfully" };
    } catch (error) {
      throw new Error(`Failed to pause queue: ${error.message}`);
    }
  }

  async resumeQueue() {
    try {
      await this.queue.resume();
      return { success: true, message: "Queue resumed successfully" };
    } catch (error) {
      throw new Error(`Failed to resume queue: ${error.message}`);
    }
  }

  async removeJob(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new Error("Job not found");
      }
      await job.remove();
      return { success: true, message: "Job removed successfully" };
    } catch (error) {
      throw new Error(`Failed to remove job: ${error.message}`);
    }
  }

  async retryJob(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new Error("Job not found");
      }
      await job.retry();
      return { success: true, message: "Job retry initiated" };
    } catch (error) {
      throw new Error(`Failed to retry job: ${error.message}`);
    }
  }

  getArtistNames(artists) {
    if (!artists?.primary?.length) return "";
    return artists.primary
      .filter((artist) => artist?.name)
      .map((artist) => artist.name)
      .join(", ");
  }

  async addJob(link) {
    return this.queue.add(
      { link },
      {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        timeout: 300000, // 5 minutes timeout
      }
    );
  }

  // Method to clean up the queue
  async cleanQueue() {
    try {
      await this.queue.clean(10000, "completed");
      await this.queue.clean(10000, "failed");
    } catch (error) {
      console.error("Error cleaning queue:", error);
      throw error;
    }
  }
}

module.exports = QueueService;
