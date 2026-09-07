// Horizontal CareerForge lockup for email signatures — dark on transparent,
// so it sits on a white email background.
import sharp from "sharp";

const OUT = "./brand/social";
const S = 2;

const BLUE = "#3446cb";
const BLUE_DEEP = "#212a9c";
const INK = "#1e2340";
const MUTE = "#6b7280";

const FLAME_OUTER =
  "M16.3 8.3c.8 3.8 4.8 5.8 4.8 9.9a5.1 5.1 0 0 1-10.2 0c0-1.6.5-2.9 1.4-3.8.3 1.6 1.3 2.6 2.2 2.6-1.3-2.9 0-5.8 1.8-8.7Z";
const FLAME_INNER =
  "M16.1 15c1.3 1.6 2.1 2.9 2.1 4.3a2.2 2.2 0 0 1-4.4 0c0-1 .5-1.8 1.3-2.5-.3 1 .3 1.6.8 1.6-.8-1.6-.3-3.2.2-4.8Z";

const W = 580;
const H = 132;
const capH = 44;
const fs = capH / 0.72;

// Mark: a rounded tile with the flame, drawn on its own 0..32 grid then placed.
const tile = 96;
const tileX = 14;
const tileY = (H - tile) / 2;
const scale = tile / 32;
const mark = `<g transform="translate(${tileX} ${tileY}) scale(${scale})">
  <rect width="32" height="32" rx="7" fill="url(#tile)"/>
  <path d="${FLAME_OUTER}" fill="#ffffff"/>
  <path d="${FLAME_INNER}" fill="${BLUE}"/>
</g>`;

const textX = tileX + tile + 22;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * S}" height="${H * S}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5566e6"/>
      <stop offset="0.55" stop-color="${BLUE}"/>
      <stop offset="1" stop-color="${BLUE_DEEP}"/>
    </linearGradient>
  </defs>
  ${mark}
  <text x="${textX}" y="${H / 2 - 2}" font-family="Segoe UI, Arial, sans-serif"
    font-weight="700" font-size="${fs}" fill="${INK}">Career<tspan fill="${BLUE}">Forge</tspan></text>
  <text x="${textX + 2}" y="${H / 2 + 30}" font-family="Segoe UI, Arial, sans-serif"
    font-weight="400" font-size="16.5" letter-spacing="0.4" fill="${MUTE}">Build your career. Forge your future.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(`${OUT}/email-signature-logo.png`);
console.log(`email-signature-logo.png  ${W * S}x${H * S}`);
