const puppeteer = require('puppeteer');
const { downloadAacFile, getTextOfElement } = require('../helpers/helper');

async function init(link) {
  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
  });

  const mediaFiles = [];
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  let files;

  try {
    // Go to the provided link
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 100000 });

    // Wait for the element to be visible and clickable
    const playButton = await page.waitForSelector('.svg-inline--fa.fa-play.fa-1x.cursor-pointer.text-white', { visible: true, timeout: 0 });

    // Click the element
    await playButton.click();

    console.log('Element clicked successfully');

    const audioSrc = await page.evaluateHandle(() => Array.from(document.getElementsByTagName('audio')).map((ele) => ele.src));

    mediaFiles.push(await audioSrc.jsonValue());

    // Wait for some time or perform interactions on the page that trigger network requests
    console.log('Media Files:', mediaFiles);

    const song = await getTextOfElement(page, '.m-0.text-3xl');
    const artist = await getTextOfElement(page, '.inline-block.text-accent');

    // Example usage
    console.log('URL', mediaFiles[0]);
    files = await downloadAacFile(mediaFiles[0], song, artist);
    await browser.close();
  } catch (error) {
    console.error('Error clicking the element:', error);
    await browser.close();
  }
  return files;
}

module.exports = { init };
