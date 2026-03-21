import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

/* ── Logo SVG (512×512) ────────────────────────────────────────────────── */
const logoSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a0800"/>
      <stop offset="100%" stop-color="#0a1a3a"/>
    </linearGradient>
    <linearGradient id="bolt" x1="256" y1="80" x2="256" y2="432" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#FF4500"/>
    </linearGradient>
    <linearGradient id="accent" x1="256" y1="80" x2="256" y2="432" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowBlue">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="170" x2="512" y2="170" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="0" y1="340" x2="512" y2="340" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="170" y1="0" x2="170" y2="512" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
  <line x1="340" y1="0" x2="340" y2="512" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

  <!-- Glow halo behind bolt -->
  <ellipse cx="256" cy="270" rx="130" ry="160" fill="rgba(255,69,0,0.12)" filter="url(#glow)"/>

  <!-- Blue accent streak -->
  <path d="M310 200 L220 310 L270 310 L260 420 L350 280 L295 280 Z"
        fill="url(#accent)" opacity="0.18" filter="url(#glowBlue)"/>

  <!-- Main lightning bolt -->
  <path d="M296 80 L150 295 H236 L216 432 L362 215 H276 Z"
        fill="url(#bolt)" filter="url(#glow)"/>

  <!-- Inner highlight -->
  <path d="M296 80 L165 290 H240 L224 410 L348 228 H268 Z"
        fill="white" fill-opacity="0.10"/>

  <!-- Bottom border accent line -->
  <rect x="180" y="460" width="152" height="4" rx="2" fill="url(#accent)" opacity="0.6"/>
</svg>`;

/* ── Favicon SVG (32×32) ───────────────────────────────────────────────── */
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fbg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a0800"/>
      <stop offset="100%" stop-color="#0a1a3a"/>
    </linearGradient>
    <linearGradient id="fbolt" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#FF4500"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#fbg)"/>
  <path d="M18 4 L8 18 H14.5 L13 28 L23 14 H16.5 Z" fill="url(#fbolt)"/>
  <path d="M18 4 L9 18 H15 L13.5 26.5 L22 15 H15.5 Z" fill="white" fill-opacity="0.14"/>
</svg>`;

/* ── OG Image SVG (1200×630) ───────────────────────────────────────────── */
const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0d0500"/>
      <stop offset="50%" stop-color="#050010"/>
      <stop offset="100%" stop-color="#000d2a"/>
    </linearGradient>
    <linearGradient id="ogbolt" x1="220" y1="80" x2="220" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#FF4500"/>
    </linearGradient>
    <linearGradient id="ogblue" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF4500"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="500" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <filter id="ogg">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ogsoft">
      <feGaussianBlur stdDeviation="40" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogbg)"/>

  <!-- Ambient glow blobs -->
  <circle cx="200" cy="320" r="260" fill="rgba(255,69,0,0.08)" filter="url(#ogsoft)"/>
  <circle cx="1000" cy="320" r="260" fill="rgba(37,99,235,0.08)" filter="url(#ogsoft)"/>

  <!-- Grid lines -->
  <line x1="0" y1="210" x2="1200" y2="210" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
  <line x1="0" y1="420" x2="1200" y2="420" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
  <line x1="300" y1="0" x2="300" y2="630" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
  <line x1="600" y1="0" x2="600" y2="630" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
  <line x1="900" y1="0" x2="900" y2="630" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>

  <!-- Logo icon (left side) -->
  <rect x="60" y="155" width="320" height="320" rx="56" fill="rgba(255,255,255,0.04)"/>
  <!-- Lightning bolt scaled for og -->
  <path d="M248 185 L118 345 H198 L182 475 L328 295 H244 Z" fill="url(#ogbolt)" filter="url(#ogg)"/>
  <path d="M248 185 L124 340 H202 L186 468 L320 298 H238 Z" fill="white" fill-opacity="0.10"/>

  <!-- Vertical separator -->
  <rect x="430" y="120" width="2" height="390" rx="1" fill="url(#ogblue)" opacity="0.3"/>

  <!-- Text content -->
  <!-- "ELITE" -->
  <text x="490" y="310"
        font-family="Arial Black, Arial, sans-serif"
        font-size="120"
        font-weight="900"
        letter-spacing="-4"
        fill="url(#textGrad)">ELITE</text>

  <!-- "ESPORTS" -->
  <text x="495" y="390"
        font-family="Arial, sans-serif"
        font-size="44"
        font-weight="400"
        letter-spacing="20"
        fill="rgba(255,255,255,0.55)">ESPORTS</text>

  <!-- Tagline -->
  <text x="495" y="450"
        font-family="Arial, sans-serif"
        font-size="22"
        font-weight="300"
        letter-spacing="4"
        fill="rgba(255,255,255,0.3)">COMPETE · WIN · DOMINATE</text>

  <!-- Bottom accent bar -->
  <rect x="0" y="620" width="1200" height="10" rx="0" fill="url(#ogblue)" opacity="0.7"/>

  <!-- Corner decorations -->
  <rect x="0" y="0" width="40" height="4" fill="#FF4500" opacity="0.6"/>
  <rect x="0" y="0" width="4" height="40" fill="#FF4500" opacity="0.6"/>
  <rect x="1160" y="0" width="40" height="4" fill="#2563EB" opacity="0.6"/>
  <rect x="1196" y="0" width="4" height="40" fill="#2563EB" opacity="0.6"/>
</svg>`;

async function generate() {
  console.log('Generating logo assets...\n');

  /* 1. logo.png — 512×512 */
  await sharp(Buffer.from(logoSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ public/logo.png (512×512)');

  /* 2. favicon-32.png → favicon.ico (ICO = raw PNG bytes wrapped in ICO container) */
  const fav32 = await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toBuffer();
  const fav16 = await sharp(Buffer.from(faviconSvg)).resize(16, 16).png().toBuffer();
  const fav48 = await sharp(Buffer.from(faviconSvg)).resize(48, 48).png().toBuffer();

  // Build ICO file manually (ICO format with 3 sizes: 16, 32, 48)
  const sizes = [
    { size: 16, buf: fav16 },
    { size: 32, buf: fav32 },
    { size: 48, buf: fav48 },
  ];
  const icoHeader = 6 + sizes.length * 16; // ICONDIR + ICONDIRENTRY per image
  let offset = icoHeader;
  const header = Buffer.alloc(icoHeader);

  // ICONDIR
  header.writeUInt16LE(0, 0);       // Reserved
  header.writeUInt16LE(1, 2);       // Type: ICO
  header.writeUInt16LE(sizes.length, 4); // Count

  sizes.forEach(({ size, buf }, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);     // Width
    header.writeUInt8(size === 256 ? 0 : size, entry + 1); // Height
    header.writeUInt8(0, entry + 2);   // Color count
    header.writeUInt8(0, entry + 3);   // Reserved
    header.writeUInt16LE(1, entry + 4); // Planes
    header.writeUInt16LE(32, entry + 6); // Bit count
    header.writeUInt32LE(buf.length, entry + 8);  // Size of image data
    header.writeUInt32LE(offset, entry + 12);     // Offset of image data
    offset += buf.length;
  });

  const icoBuffer = Buffer.concat([header, ...sizes.map(s => s.buf)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ public/favicon.ico (16×16, 32×32, 48×48)');

  /* 3. og-icon.png — 1200×630 (16:9) */
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'og-icon.png'));
  console.log('✓ public/og-icon.png (1200×630 — 16:9)');

  /* 4. apple-touch-icon.png — 180×180 */
  await sharp(Buffer.from(logoSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png (180×180)');

  console.log('\nAll logo assets generated successfully!');
}

generate().catch(console.error);
