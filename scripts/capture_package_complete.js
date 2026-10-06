import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function clickButtonByText(page, text) {
  return await page.evaluate((buttonText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent && b.textContent.includes(buttonText));
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, text);
}

async function captureComplete() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

  // Upload sample files
  await clickButtonByText(page, 'Uploaded Files');
  await new Promise(r => setTimeout(r, 500));
  await clickButtonByText(page, 'Generate Sample Test PDFs');
  await new Promise(r => setTimeout(r, 2000));

  // Auto match
  await clickButtonByText(page, 'Auto-Match by Filename');
  await new Promise(r => setTimeout(r, 1000));

  // Go to Requirements and set the expiry date for R07
  await clickButtonByText(page, 'Requirements');
  await new Promise(r => setTimeout(r, 800));

  // Set date for R07 expiry input
  await page.evaluate(() => {
    const r07Input = document.getElementById('expiry-R07');
    if (r07Input) {
      r07Input.value = '2027-12-31';
      r07Input.dispatchEvent(new Event('change', { bubbles: true }));
      r07Input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 800));

  // Go to Build Package
  await clickButtonByText(page, 'Build Package');
  await new Promise(r => setTimeout(r, 800));

  // Click Generate Package PDF
  await clickButtonByText(page, 'Generate Package PDF');
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.resolve('screenshots', '08_package_preview_complete.png') });
  console.log('Captured 08_package_preview_complete.png!');

  await browser.close();
}

captureComplete().catch(console.error);
