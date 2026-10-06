import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((buttonText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.includes(buttonText));
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, text);
  return clicked;
}

async function capture() {
  const screenshotDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  // 1. Overview Screen
  console.log('Capturing 01_tender_overview.png...');
  await page.screenshot({ path: path.join(screenshotDir, '01_tender_overview.png') });

  // 2. Initial Requirements Table (with Missing statuses)
  console.log('Navigating to Requirements...');
  await clickButtonByText(page, 'Requirements');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(screenshotDir, '02_requirements_initial.png') });

  // 3. Uploaded Files & Sample Generation
  console.log('Navigating to Uploaded Files...');
  await clickButtonByText(page, 'Uploaded Files');
  await new Promise(r => setTimeout(r, 600));

  console.log('Generating sample test PDFs in browser...');
  await clickButtonByText(page, 'Generate Sample Test PDFs');
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(screenshotDir, '03_files_uploaded.png') });

  // 4. Auto Match
  console.log('Triggering Auto-Match...');
  await clickButtonByText(page, 'Auto-Match by Filename');
  await new Promise(r => setTimeout(r, 1000));

  // 5. Back to Requirements with matches and OK statuses
  console.log('Capturing matched requirements...');
  await clickButtonByText(page, 'Requirements');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotDir, '04_requirements_matched_status.png') });

  // 6. Validation Panel
  console.log('Navigating to Validation & Checks...');
  await clickButtonByText(page, 'Validation & Checks');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotDir, '05_validation_panel.png') });

  // 7. Package Assembly & Generation
  console.log('Navigating to Build Package...');
  await clickButtonByText(page, 'Build Package');
  await new Promise(r => setTimeout(r, 800));

  console.log('Generating combined PDF package...');
  await clickButtonByText(page, 'Generate Package PDF');
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(screenshotDir, '06_package_generated_preview.png') });

  // 8. Bangla Mode
  console.log('Switching to Bangla language...');
  await clickButtonByText(page, 'বাংলা');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screenshotDir, '07_bangla_mode.png') });

  console.log('All screenshots captured successfully in screenshots/ directory!');
  await browser.close();
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
