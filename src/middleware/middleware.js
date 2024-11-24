require('dotenv').config();
const Redis = require("ioredis");

let redisClient;

function createRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL);

    // Handle Redis errors
    redisClient.on("error", (err) => {
      console.error("Redis Error:", err);
    });

    redisClient.on("connect", () => {
      console.log('Connect redis success !')
     })
  }
  return redisClient;
}

redisClient = createRedisClient();
async function cacheData(req, res, next) {
  const { link } = req.body;
  let results;
  try {
    const cacheResults = await redisClient.get(link);
    if (cacheResults) {
      results = JSON.parse(cacheResults);
      res.send({
        fromCache: true,
        data: results,
      });
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(404);
  }
}

module.exports = { cacheData, redisClient };
