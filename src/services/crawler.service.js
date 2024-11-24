const puppeteer = require("puppeteer");
const config = require("../config/config");

class CrawlerService {
  async initialize() {
    this.browser = await puppeteer.launch(config.puppeteer.launch);
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(config.puppeteer.launch.userAgent);
  }

  async crawl(url) {
    try {
      await this.page.goto(url, { waitUntil: "networkidle0", timeout: 100000 });
      await this.page.waitForFunction(() => {
        return window.__next_f !== undefined;
      });

      const songData = await this.extractSongData();
      return songData;
    } catch (error) {
      throw new Error(`Crawling failed: ${error.message}`);
    }
  }

  async extractSongData() {
    const dataLayer = await this.page.evaluate(() => window.__next_f);
    let songData = null;

    for (const element of dataLayer) {
      for (const el of element) {
        if (typeof el === "string" && el.includes("sitePlayableFilePath")) {
          const dataArr = el.slice(el.indexOf('["$"'));
          const parsedData = JSON.parse(dataArr);
          const children = parsedData[parsedData.length - 1].children;
          const data =
            children[children.length - 1][
              children[children.length - 1].length - 1
            ];
          songData = {
            filePath: data.songData.sitePlayableFilePath,
            songName: data.songData.songName,
            artists: data.songData.artists,
          };
        }
      }
    }

    if (!songData) {
      throw new Error("Song data not found");
    }

    return songData;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = CrawlerService;
