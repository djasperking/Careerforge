/**
 * Renders the HTML & CSS course's social-media images (PNG) into social-posts/.
 * Usage: node scripts/make-social-posts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "social-posts");
fs.mkdirSync(OUT, { recursive: true });

const SANS = "'Segoe UI', Arial, Helvetica, sans-serif";
const BLACK = "'Arial Black', Impact, 'Segoe UI', Arial, sans-serif";

const defs = (w, h) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4c1d95"/><stop offset="0.5" stop-color="#be185d"/><stop offset="1" stop-color="#f97316"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#f97316"/></linearGradient>
    <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
    <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#818cf8"/><stop offset="1" stop-color="#e879f9"/></linearGradient>
    <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="#fff" opacity="0.14"/></pattern>
    <filter id="pop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#dots)"/>
  <circle cx="${w - 40}" cy="40" r="${w * 0.2}" fill="#fff" opacity="0.08"/>
  <circle cx="30" cy="${h - 20}" r="${w * 0.22}" fill="#000" opacity="0.1"/>`;

const browser = (x, y, s, rot) => `
  <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-235 -215)" filter="url(#pop)">
    <rect width="470" height="430" rx="22" fill="#fff"/>
    <rect width="470" height="56" rx="22" fill="#e2e8f0"/><rect y="34" width="470" height="22" fill="#e2e8f0"/>
    <circle cx="32" cy="28" r="9" fill="#f87171"/><circle cx="62" cy="28" r="9" fill="#fbbf24"/><circle cx="92" cy="28" r="9" fill="#34d399"/>
    <rect x="130" y="14" width="316" height="28" rx="14" fill="#fff"/>
    <rect x="24" y="74" width="422" height="150" rx="14" fill="url(#hero)"/>
    <rect x="50" y="102" width="230" height="22" rx="11" fill="#fff"/>
    <rect x="50" y="136" width="170" height="12" rx="6" fill="#fff" opacity="0.75"/>
    <rect x="50" y="158" width="140" height="12" rx="6" fill="#fff" opacity="0.75"/>
    <rect x="50" y="184" width="120" height="30" rx="15" fill="#fde047"/>
    <rect x="24" y="244" width="132" height="160" rx="14" fill="#ffedd5"/><circle cx="90" cy="286" r="22" fill="#f97316"/>
    <rect x="172" y="244" width="132" height="160" rx="14" fill="#dbeafe"/><circle cx="238" cy="286" r="22" fill="#3b82f6"/>
    <rect x="320" y="244" width="126" height="160" rx="14" fill="#fce7f3"/><circle cx="383" cy="286" r="22" fill="#ec4899"/>
  </g>`;

const badge = (cx, cy, s, rot) => `
  <g filter="url(#pop)" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">
    <polygon fill="#fde047" points="0,-88 23,-48 70,-52 50,-10 82,26 37,38 33,86 -4,58 -43,86 -44,38 -86,24 -56,-12 -72,-54 -26,-48"/>
    <text y="12" font-family="${BLACK}" font-weight="900" font-size="46" fill="#be185d" text-anchor="middle">FREE</text>
  </g>`;

const title = (x, y, s) => `
  <g font-family="${BLACK}" font-weight="900" transform="translate(${x} ${y}) scale(${s})">
    <text x="0" y="0" font-size="38" fill="#fde68a" letter-spacing="6">LEARN</text>
    <g filter="url(#pop)" transform="rotate(-3 180 120)"><rect x="0" y="18" width="372" height="152" rx="26" fill="url(#orange)"/><text x="186" y="138" font-size="116" fill="#fff" text-anchor="middle">HTML</text></g>
    <text x="402" y="130" font-size="86" fill="#fff" text-anchor="middle">+</text>
    <g filter="url(#pop)" transform="rotate(2.5 540 120)"><rect x="426" y="30" width="308" height="140" rx="26" fill="url(#blue)"/><text x="580" y="136" font-size="106" fill="#fff" text-anchor="middle">CSS</text></g>
    <g transform="rotate(-2 270 250)"><rect x="-4" y="206" width="560" height="104" rx="14" fill="#fde047"/><text x="20" y="286" font-size="76" fill="#3b0764">FROM ZERO!</text></g>
  </g>`;

const cta = (x, y, w, size = 34) => `
  <g font-family="${SANS}" font-weight="800" text-anchor="middle">
    <rect x="${x}" y="${y}" width="${w}" height="${size * 2.1}" rx="${size * 1.05}" fill="#fff"/>
    <text x="${x + w / 2}" y="${y + size * 1.42}" font-size="${size}" fill="#be185d">careerforge.com.ng</text>
  </g>`;

// 1080 x 1080 — Instagram / Facebook feed
const square = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">${defs(1080, 1080)}
  ${title(70, 130, 1.1)}
  <g font-family="${SANS}" fill="#fff"><text x="80" y="520" font-size="46" font-weight="800">Build your first real website.</text>
  <text x="80" y="574" font-size="34" opacity="0.92">Edit live code · Quizzes · Certificate</text></g>
  ${browser(835, 835, 0.8, 5)}
  ${badge(960, 620, 1.1, 12)}
  <g font-family="${SANS}" font-weight="800" font-size="30" text-anchor="middle">
    <rect x="80" y="640" width="210" height="58" rx="29" fill="#fff"/><text x="185" y="680" fill="#be185d">BEGINNER</text>
    <rect x="306" y="640" width="260" height="58" rx="29" fill="#fff"/><text x="436" y="680" fill="#4c1d95">NO EXPERIENCE</text>
  </g>
  ${cta(80, 900, 520, 40)}
  <text x="80" y="1020" font-family="${SANS}" font-size="28" fill="#fff" opacity="0.9">Link in bio · Career Forge</text>
</svg>`;

// 1080 x 1920 — Stories / WhatsApp Status
const story = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${defs(1080, 1920)}
  ${title(100, 330, 1.22)}
  ${browser(540, 1090, 1.3, -4)}
  ${badge(940, 1230, 1.4, 12)}
  <g font-family="${SANS}" fill="#fff" text-anchor="middle">
    <text x="540" y="1480" font-size="58" font-weight="800">Build your first real website</text>
    <text x="540" y="1548" font-size="38" opacity="0.92">Live code · Quizzes · Certificate</text>
  </g>
  ${cta(190, 1640, 700, 46)}
  <text x="540" y="1790" text-anchor="middle" font-family="${SANS}" font-size="32" fill="#fff" opacity="0.9">No experience needed · 100% free</text>
</svg>`;

// 1200 x 675 — X / Facebook link share
const wide = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">${defs(1200, 675)}
  ${title(56, 112, 0.92)}
  <g font-family="${SANS}" fill="#fff"><text x="60" y="470" font-size="38" font-weight="800">Build your first real website</text>
  <text x="60" y="514" font-size="28" opacity="0.92">Live code · Quizzes · Free certificate</text></g>
  ${browser(930, 360, 0.78, 5)}
  ${badge(1110, 120, 0.95, 12)}
  ${cta(60, 548, 420, 32)}
</svg>`;

for (const [name, svg] of [
  ["instagram-facebook-square-1080x1080", square],
  ["story-whatsapp-status-1080x1920", story],
  ["x-facebook-link-1200x675", wide],
]) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `${name}.png`));
  console.log("wrote", name);
}
