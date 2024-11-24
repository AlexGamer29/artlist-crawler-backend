const fs = require("fs").promises;
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");
const config = require("../config/config");

class FileService {
  constructor() {
    this.exportPath = path.resolve(
      __dirname,
      "..",
      "..",
      config.file.exportPath
    );
  }

  async ensureExportDirectory() {
    try {
      await fs.access(this.exportPath);
    } catch {
      await fs.mkdir(this.exportPath, { recursive: true });
    }
  }

  async downloadFile(url, filename) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const filePath = path.join(this.exportPath, filename);
    await fs.writeFile(filePath, response.data);
    return filePath;
  }

  async convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .audioCodec("pcm_f32le")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });
  }

  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Cleanup failed for ${filePath}:`, error);
    }
  }
}

module.exports = FileService; 