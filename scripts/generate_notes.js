const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generate() {
  const projectRoot = path.resolve(__dirname, '..');
  const publicHtml = path.join(projectRoot, 'public', 'final_exam_notes.html');
  const outDir = path.join(projectRoot, 'outputs');
  await ensureDir(outDir);

  if (!fs.existsSync(publicHtml)) {
    console.error('Missing HTML source:', publicHtml);
    process.exit(1);
  }

  const html = fs.readFileSync(publicHtml, 'utf8');
  const outHtml = path.join(outDir, 'Final_Exam_Notes_Partial_Derivatives.html');
  fs.writeFileSync(outHtml, html, 'utf8');
  console.log('Wrote HTML ->', outHtml);

  // Render PDF via Puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Use a file:// URL so external network isn't required
  await page.goto('file://' + outHtml, { waitUntil: 'networkidle0' });
  const pdfPath = path.join(outDir, 'Final_Exam_Notes_Partial_Derivatives.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  await browser.close();
  console.log('Wrote PDF ->', pdfPath);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
