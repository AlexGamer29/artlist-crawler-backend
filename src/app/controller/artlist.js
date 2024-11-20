const puppeteer = require("puppeteer");
const { downloadAacFile, getArtistNames } = require("../helpers/helper");

async function init(link) {
  // Launch a headless browser
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      // "--single-process",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ],
  });
  let data;
  let files;
  const page = await browser.newPage();

  try {
    // Go to the provided link
    await page.goto(link, { waitUntil: "networkidle0", timeout: 100000 });

    await page.waitForFunction(() => {
      return window.__next_f !== undefined;
    });

    // Extract dataLayer data
    const dataLayer = await page.evaluate(() => {
      return window.__next_f;
    });

    dataLayer.forEach((element) => {
      element.forEach((el) => {
        if (typeof el === "string" && el.includes("sitePlayableFilePath")) {
          const dataArr = el.slice(el.indexOf('["$"'));
          const parsedData = JSON.parse(dataArr);
          let children = parsedData[parsedData.length - 1].children;
          data = children[children.length - 1];
          data = data[data.length - 1];
        }
      });
    });
    
    files = await downloadAacFile(
      data.songData.sitePlayableFilePath,
      data.songData.songName,
      getArtistNames(data.songData.artists)
    );
    await browser.close();
  } catch (error) {
    console.error("[ERROR] Crawler", error);
    await browser.close();
  }
  return files;
}

module.exports = { init };
