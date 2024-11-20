const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

const Links = require("../model/Links");

function unlinkFile(filePath, callback) {
  fs.unlink(filePath, (error) => {
    if (error) {
      console.error("[ERROR] Fail to delete input file", error.message);
    } else {
      console.log("[FILE] Input file deleted successfully", filePath);
    }
    // Always call callback to continue execution
    callback();
  });
}

async function convertAacToWav(inputFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputFilePath)
      .audioCodec("pcm_f32le") // Use the desired audio codec (lossless WAV format)
      .on("error", (err) => {
        console.error("[ERROR] Fail to convert to WAV", err.message);
        reject(err);
      })
      .on("end", () => {
        unlinkFile(inputFilePath, () => {
          console.log("[INFO] Conversion finished.");
          resolve();
        });
      })
      .save(outputFilePath);
  });
}

async function downloadAacFile(url, song, artist) {
  const filename = artist.concat(" - ", song, ".aac");
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });

    if (response.status === 200) {
      // Specify the export folder name
      const exportFolder = "exports";
      const outputDirectory = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        exportFolder
      ); // Move up one level to the parent directory

      // Create the export folder if it doesn't exist
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
      }

      const filePath = path.join(outputDirectory, filename);

      fs.writeFileSync(filePath, response.data);
      console.log("[INFO] File downloaded successfully");

      let saveLinks = null;
      const outputWavFile = path
        .join(outputDirectory, filename.replace(".aac", ".wav"))
        .toString();
      console.log("[FILE] Output file", outputWavFile);
      await convertAacToWav(filePath, outputWavFile)
        .then(async () => {
          const options = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          };
          saveLinks = await Links.findOneAndUpdate(
            {
              song,
              artist,
            },
            {
              song,
              artist,
              title: artist.concat(" - ", song, ".wav"),
              links: outputWavFile,
              createdAt: new Date(),
            },
            options
          );
        })
        .catch((error) => {
          console.error("[ERROR] Cannot get output file", error.message);
          return {
            status: "failed",
            error: `Conversion error:${error.message}`,
          };
        });
      return { status: "success", data: saveLinks };
    }
    console.error("[ERROR] Failed to download the file");
    return { status: "failed", error: "Failed to download the file." };
  } catch (error) {
    console.error("[ERROR] Error download", error.message);
    return { status: "failed", error: `Error download:${error.message}` };
  }
}

async function getTextOfElement(page, selector) {
  let text;
  try {
    text = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.textContent : null;
    }, selector);
  } catch (error) {
    console.error("[ERROR] Error get text:", error);
  }
  return text;
}

// Function to create a downloadable link
function createDownloadableLink(fileName) {
  const filePath = path.join(__dirname, "..", "..", "..", "exports", fileName);
  return filePath;
}

function getArtistNames(artists) {
  if (!artists || !artists.primary || !Array.isArray(artists.primary)) {
    return "";
  }

  return artists.primary
    .filter((artist) => artist && artist.name) // Filter out any null/undefined
    .map((artist) => artist.name)
    .join(", ");
}

module.exports = {
  downloadAacFile,
  convertAacToWav,
  getTextOfElement,
  createDownloadableLink,
  getArtistNames,
};
