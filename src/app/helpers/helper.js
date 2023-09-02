const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const Links = require('../model/Links');

async function downloadAacFile(url, song, artist) {
    const filename = artist.concat(` - `, song, `.aac`);
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        if (response.status === 200) {
            // Specify the export folder name
            const exportFolder = 'exports';
            const outputDirectory = path.resolve(__dirname, '..', '..', '..', exportFolder); // Move up one level to the parent directory

            // Create the export folder if it doesn't exist
            if (!fs.existsSync(outputDirectory)) {
                fs.mkdirSync(outputDirectory);
            }

            const filePath = path.join(outputDirectory, filename);

            fs.writeFileSync(filePath, response.data);
            console.log('File downloaded successfully.');

            const outputWavFile = path.join(outputDirectory, filename.replace('.aac', '.wav')).toString();
            console.log(`Output`, outputWavFile)
            await convertAacToWav(filePath, outputWavFile)
                .then(async () => {
                    console.log('Conversion completed successfully.');
                    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
                    const saveLinks = await Links.findOneAndUpdate({
                        song: song,
                        artist: artist,
                    }, {
                        song: song,
                        artist: artist,
                        links: outputWavFile,
                        createdAt: new Date()
                    }, options);
                })
                .catch((error) => {
                    console.error('Conversion error:', error.message);
                });
        } else {
            console.error('Failed to download the file.');
        }
    } catch (error) {
        console.error('Error download:', error.message);
    }
}


async function convertAacToWav(inputFilePath, outputFilePath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(inputFilePath)
            .audioCodec('pcm_f32le') // Use the desired audio codec (lossless WAV format)
            .on('error', (err) => {
                console.error('Error conversion:', err.message);
                reject(err);
            })
            .on('end', () => {
                console.log('Conversion finished.');
                resolve();
            })
            .save(outputFilePath);
    });
}

async function getTextOfElement(page, selector) {
    try {
        const text = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent : null;
        }, selector);

        return text;
    } catch (error) {
        console.error('Error get text:', error);
    }
}

// Function to create a downloadable link
function createDownloadableLink(fileName) {
    const filePath = path.join(__dirname, '..', '..', '..', 'exports', fileName);
    return filePath;
}

module.exports = { downloadAacFile, convertAacToWav, getTextOfElement, createDownloadableLink };