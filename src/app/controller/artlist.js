const puppeteer = require('puppeteer');
const { downloadAacFile, getTextOfElement, broadcastEvent } = require('../helpers/helper')

async function init() {
    // Launch a headless browser
    const browser = await puppeteer.launch({
        headless: false,
        // args: ['--no-sandbox'],
    });

    const TIMEOUT_SHORT = 1000;
    const mediaFiles = [];
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    try {
        // Go to the provided link
        await page.goto('https://artlist.io/royalty-free-music/song/new-era/109839', { waitUntil: 'networkidle2' });

        // Wait for the element to be visible and clickable
        const playButton = await page.waitForSelector('.svg-inline--fa.fa-play.fa-1x.cursor-pointer.text-white', { visible: true, timeout: 0 });

        // Click the element
        await playButton.click();


        console.log('Element clicked successfully');

        const audioSrc = await page.evaluateHandle(() => {
            return Array.from(document.getElementsByTagName('audio')).map(ele => ele.src);
        });

        mediaFiles.push(await audioSrc.jsonValue());

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