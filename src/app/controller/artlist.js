const puppeteer = require('puppeteer');
const { downloadAacFile, getTextOfElement, broadcastEvent } = require('../helpers/helper')

async function init() {
    // Launch a headless browser
    const browser = await puppeteer.launch({
        headless: false,
        // args: ['--no-sandbox', '--remote-debugging-port=9222'],
    });

    const TIMEOUT_SHORT = 1000;
    const mediaFiles = [];
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    // Enable network monitoring
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        // Allow all requests to continue
        request.continue();
    });

    page.on('response', async (response) => {
        const contentType = response.headers()['content-type'];

        try {
            // Check if the response is a media file (you can adjust this condition based on your needs)
            if (contentType.startsWith('application') || contentType.startsWith('audio')) {
                const url = response.url();
                if (url.endsWith('.aac')) {
                    mediaFiles.push(url);
                }
            }
        } catch (error) {
            console.error(`Error get res`, error);
        }
    });

    try {
        // Go to the provided link
        await page.goto('https://artlist.io/royalty-free-music/song/new-era/109839', { waitUntil: 'networkidle2' });

        // Wait for the element to be visible and clickable
        const playButton = await page.waitForSelector('.svg-inline--fa.fa-play.fa-1x.cursor-pointer.text-white', { visible: true });

        // Click the element
        await playButton.click();


        console.log('Element clicked successfully');

        // Wait for some time or perform interactions on the page that trigger network requests
        console.log('Media Files:', mediaFiles);

        let song = await getTextOfElement(page, `.m-0.text-3xl`);
        let artist = await getTextOfElement(page, `.inline-block.text-accent`);

        // Example usage
        console.log(`URL`, mediaFiles[0])
        await downloadAacFile(mediaFiles[0], song, artist);

        // Broadcasting an event
        broadcastEvent('userLoggedIn', 'User John logged in.');

        await browser.close();
    } catch (error) {
        console.error('Error clicking the element:', error);
        await browser.close();
    }
}

module.exports = { init }