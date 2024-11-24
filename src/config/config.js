require("dotenv").config();

module.exports = {
  server: {
    port: process.env.PORT,
  },
  mongodb: {
    url: process.env.MONGODB_URL,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  redis: {
    url: process.env.REDIS_URL,
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  },
  puppeteer: {
    launch: {
      ...(process.env.CHROME_PATH && {
        executablePath: process.env.CHROME_PATH,
      }),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1920,1080",
      ],
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    },
  },
  file: {
    exportPath: "exports",
  },
  queue: {
    name: "artlistQueue",
    concurrency: 2,
  },
};
