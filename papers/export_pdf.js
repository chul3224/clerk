const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SLIDE_COUNT = 10;
const HTML_PATH = path.resolve(__dirname, 'Clerkai_발표자료.html');
const OUT_DIR = path.resolve(__dirname, '_pdf_frames');
const PDF_PATH = path.resolve(__dirname, 'Clerkai_발표자료.pdf');

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('file://' + HTML_PATH, { waitUntil: 'networkidle' });

  // Wait for fonts
  await page.waitForTimeout(1500);

  for (let i = 0; i < SLIDE_COUNT; i++) {
    // Show slide i
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, j) => s.classList.toggle('active', j === idx));
      // Reset transform for screenshot
      slides[idx].style.transform = 'scale(1)';
      slides[idx].style.left = '0px';
      slides[idx].style.top = '0px';
      document.getElementById('nav').style.display = 'none';
    }, i);

    await page.waitForTimeout(300);

    const outPath = path.join(OUT_DIR, `slide_${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    process.stdout.write(`  ✓ Slide ${i + 1}/${SLIDE_COUNT}\n`);
  }

  await browser.close();

  // Combine PNGs into PDF using Python
  const { execSync } = require('child_process');
  const frames = Array.from({ length: SLIDE_COUNT }, (_, i) =>
    path.join(OUT_DIR, `slide_${String(i + 1).padStart(2, '0')}.png`)
  ).join(' ');

  const py = `
from PIL import Image
import sys

files = sys.argv[1:]
imgs = [Image.open(f).convert('RGB') for f in files]
imgs[0].save(
    '${PDF_PATH}',
    save_all=True,
    append_images=imgs[1:],
    resolution=150,
)
print(f'  PDF saved → ${PDF_PATH}')
`;

  const pyScript = path.join(OUT_DIR, 'merge.py');
  fs.writeFileSync(pyScript, py);
  execSync(`python3 ${pyScript} ${frames}`, { stdio: 'inherit' });

  // Cleanup frames
  fs.rmSync(OUT_DIR, { recursive: true });
  console.log('Done.');
})();
