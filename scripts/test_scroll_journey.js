import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testScrollJourney() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  // 1. Initial top state (0% scroll)
  await page.screenshot({ path: path.resolve('screenshots', '09_scroll_journey_top.png') });

  // 2. Scroll halfway down
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.resolve('screenshots', '10_scroll_journey_scrolled.png') });

  console.log('Scroll journey screenshots captured!');
  await browser.close();
}

testScrollJourney().catch(console.error);
