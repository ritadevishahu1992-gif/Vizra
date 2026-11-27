import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const WIDTH = 1200;
const HEIGHT = 630;

// Clean 5x7 uppercase & symbol pixel font for crisp anti-aliased rendering at any scale
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '·': ['00000', '00000', '00000', '00100', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00100', '00100', '01000', '10000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function blendPixel(
  rgb: Uint8Array,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  alpha: number
) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT || alpha <= 0) return;
  const idx = (y * WIDTH + x) * 3;
  const inv = 1 - alpha;
  rgb[idx] = Math.min(255, Math.round(rgb[idx] * inv + r * alpha));
  rgb[idx + 1] = Math.min(255, Math.round(rgb[idx + 1] * inv + g * alpha));
  rgb[idx + 2] = Math.min(255, Math.round(rgb[idx + 2] * inv + b * alpha));
}

function fillRect(
  rgb: Uint8Array,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  alpha = 1
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      blendPixel(rgb, x, y, r, g, b, alpha);
    }
  }
}

function drawText(
  rgb: Uint8Array,
  text: string,
  startX: number,
  startY: number,
  scale: number,
  letterSpacing: number,
  r: number,
  g: number,
  b: number,
  alpha = 1
) {
  let cursorX = startX;
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    const glyph = GLYPHS[ch] || GLYPHS[' '];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === '1') {
          fillRect(
            rgb,
            cursorX + col * scale,
            startY + row * scale,
            scale,
            scale,
            r,
            g,
            b,
            alpha
          );
        }
      }
    }
    cursorX += 5 * scale + letterSpacing;
  }
}

function pointInPolygon(
  px: number,
  py: number,
  poly: readonly (readonly [number, number])[]
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

const OFFICIAL_OUTER_V: readonly (readonly [number, number])[] = [
  [4, 6],
  [16, 26],
  [28, 6],
  [21.5, 6],
  [16, 17.5],
  [10.5, 6],
];

const OFFICIAL_INNER_DIAMOND: readonly (readonly [number, number])[] = [
  [16, 26],
  [19, 20],
  [16, 15],
  [13, 20],
];

export function generateVizraOgImageBuffer(): Buffer {
  const rgb = new Uint8Array(WIDTH * HEIGHT * 3);

  // 1. Dark Obsidian / Charcoal Background with subtle radial crimson illumination
  const centerX = 920;
  const centerY = 315;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 3;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, 1 - dist / 520);
      const glowSq = glow * glow;

      // Subtle architectural grid every 60px
      const isGrid = x % 60 === 0 || y % 60 === 0;
      const gridBoost = isGrid ? 4 : 0;

      rgb[idx] = Math.min(255, Math.round(9 + glowSq * 85 + gridBoost));
      rgb[idx + 1] = Math.min(255, Math.round(9 + glowSq * 14 + gridBoost));
      rgb[idx + 2] = Math.min(255, Math.round(10 + glowSq * 12 + gridBoost));
    }
  }

  // 2. Outer Card Frame Border (x: 48..1152, y: 48..582)
  fillRect(rgb, 48, 48, 1104, 2, 255, 255, 255, 0.12);
  fillRect(rgb, 48, 580, 1104, 2, 255, 255, 255, 0.12);
  fillRect(rgb, 48, 48, 2, 534, 255, 255, 255, 0.12);
  fillRect(rgb, 1150, 48, 2, 534, 255, 255, 255, 0.12);

  // Top Crimson Accent Bar
  fillRect(rgb, 48, 48, 280, 4, 235, 59, 45, 1);

  // 3. Right-hand Official VIZRA Geometric Emblem (exact VizraLogo.tsx geometry, 3x3 supersampled)
  const logoLeft = 795;
  const logoTop = 165;
  const logoSize = 300;
  const samples = 3;
  const sampleCount = samples * samples;
  for (let y = logoTop; y < logoTop + logoSize; y++) {
    for (let x = logoLeft; x < logoLeft + logoSize; x++) {
      let whiteHits = 0;
      let redHits = 0;
      for (let sy = 0; sy < samples; sy++) {
        const vy = ((y - logoTop + (sy + 0.5) / samples) / logoSize) * 32;
        for (let sx = 0; sx < samples; sx++) {
          const vx = ((x - logoLeft + (sx + 0.5) / samples) / logoSize) * 32;
          const dx = vx - 16;
          const dy = vy - 7;
          if (
            pointInPolygon(vx, vy, OFFICIAL_INNER_DIAMOND) ||
            dx * dx + dy * dy <= 1.5 * 1.5
          ) {
            redHits++;
          } else if (pointInPolygon(vx, vy, OFFICIAL_OUTER_V)) {
            whiteHits++;
          }
        }
      }
      if (whiteHits > 0) {
        blendPixel(rgb, x, y, 255, 255, 255, (whiteHits / sampleCount) * 0.92);
      }
      if (redHits > 0) {
        blendPixel(rgb, x, y, 235, 59, 45, redHits / sampleCount);
      }
    }
  }

  // 4. Eyebrow Pill & Badge (x: 96, y: 120)
  fillRect(rgb, 96, 116, 468, 36, 22, 22, 24, 0.95);
  fillRect(rgb, 96, 116, 468, 1, 235, 59, 45, 0.55);
  fillRect(rgb, 96, 151, 468, 1, 235, 59, 45, 0.55);
  fillRect(rgb, 112, 130, 8, 8, 235, 59, 45, 1);
  drawText(rgb, 'VIZRA AI CREATIVE STUDIO', 132, 127, 2, 4, 235, 235, 240, 1);

  // 5. Main Headline "VIZRA" (x: 96, y: 196)
  drawText(rgb, 'VIZRA', 96, 196, 14, 22, 255, 255, 255, 1);

  // 6. Subtitle "AI CREATIVE STUDIO  ·  OMNIA 1.0" (x: 96, y: 325)
  drawText(
    rgb,
    'AI CREATIVE STUDIO · OMNIA 1.0',
    96,
    328,
    4,
    6,
    235,
    59,
    45,
    1
  );

  // 7. Supporting Pillars Strip (x: 96, y: 392)
  drawText(
    rgb,
    'THINK  ·  CREATE  ·  BUILD  ·  EXPLORE',
    96,
    396,
    3,
    5,
    190,
    190,
    198,
    1
  );

  // 8. Bottom Divider & White-Label Brand Stamp (y: 495..535)
  fillRect(rgb, 96, 484, 640, 1, 255, 255, 255, 0.1);
  drawText(
    rgb,
    'VIZRA  ·  AI CREATIVE STUDIO',
    96,
    512,
    3,
    5,
    150,
    150,
    160,
    1
  );

  // Encode raw scanlines (filter byte 0 per row)
  const rawData = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
  for (let y = 0; y < HEIGHT; y++) {
    const rowStart = y * (1 + WIDTH * 3);
    rawData[rowStart] = 0; // Filter type 0 (None)
    const srcStart = y * WIDTH * 3;
    Buffer.from(rgb.buffer, srcStart, WIDTH * 3).copy(rawData, rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 2; // Color type: 2 (Truecolor RGB)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const idatData = zlib.deflateSync(rawData, { level: 6 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function ensurePublicOgImageExists(
  rootDir: string,
  options: { force?: boolean } = {}
): string {
  const publicDir = path.resolve(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const targetPath = path.join(publicDir, 'og-image.png');
  if (!options.force && fs.existsSync(targetPath)) {
    try {
      const existing = fs.readFileSync(targetPath);
      const isPng =
        existing.length > 24 &&
        existing[0] === 0x89 &&
        existing[1] === 0x50 &&
        existing[2] === 0x4e &&
        existing[3] === 0x47;
      if (isPng) {
        const w = existing.readUInt32BE(16);
        const h = existing.readUInt32BE(20);
        if (w === WIDTH && h === HEIGHT) {
          return targetPath;
        }
      }
    } catch {
      // Fall through to regenerate if unreadable
    }
  }
  const pngBuffer = generateVizraOgImageBuffer();
  fs.writeFileSync(targetPath, pngBuffer);
  return targetPath;
}
