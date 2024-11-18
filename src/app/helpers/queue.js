const Queue = require("bull");

const { redisClient } = require("../middleware/middleware");
const { init } = require("../../app/controller/artlist");
const CONCURRENCY = 1;

// Create a new Bull queue for processing init jobs
const initQueue = new Queue("initQueue", process.env.REDIS_URL, {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  },
});

// Define the job processing function
initQueue.process(CONCURRENCY, async (job) => {
  const link = job.data.link;
  console.log(`[INFO] Processing link:`, link);

  try {
    // Call the init function to process the link
    const object = await init(link);

    if (!object || object.status === "failed") {
      throw new Error("[ERROR][QUEUE] Fail to get file. Try again.");
    } else {
      // Save the result in Redis or perform any other necessary actions
      redisClient.setex(link, 60, JSON.stringify(object));
      return object;
    }
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to handle it in the catch block of the route
  }
});

initQueue.on('progress', function (job, progress) {
  console.log(`[${job.id}] ${job.data.link} is ${progress * 100}% ready!`);
});

initQueue.on("error", (error) => {
  console.log(`[ERROR][QUEUE]`, error);
});

initQueue.on('completed', job => {
  console.log(`[INFO][${job.id}] ${job.data.link} COMPLETE JOB`);
})

module.exports = { initQueue };
