import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export interface BrandStaticAssetSpec {
  fileName: string;
  contentType: string;
  cacheControl: string;
}

export const BRAND_STATIC_ASSET_FILES: readonly BrandStaticAssetSpec[] = [
  {
    fileName: 'favicon.ico',
    contentType: 'image/x-icon',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'favicon.svg',
    contentType: 'image/svg+xml; charset=utf-8',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'favicon-32x32.png',
    contentType: 'image/png',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'favicon-48x48.png',
    contentType: 'image/png',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'favicon-96x96.png',
    contentType: 'image/png',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'apple-touch-icon.png',
    contentType: 'image/png',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'icon-192.png',
    contentType: 'image/png',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'icon-512.png',
    contentType: 'image/png',
    cacheControl: 'public, max-age=604800, s-maxage=604800',
  },
  {
    fileName: 'manifest.json',
    contentType: 'application/manifest+json; charset=utf-8',
    cacheControl: 'public, max-age=86400, s-maxage=86400',
  },
] as const;

type Point2D = readonly [number, number];

/**
 * Official VIZRA geometric mark coordinates (exact source of truth: src/components/VizraLogo.tsx).
 * Do NOT alter proportions, angles, or brand colors (#FFFFFF @ 0.92, #EB3B2D on #09090B Obsidian).
 *
 * ViewBox: 0 0 32 32
 * - Outer V prism facet: M4 6 L16 26 L28 6 H21.5 L16 17.5 L10.5 6 H4 Z  (#FFFFFF, fillOpacity 0.92)
 * - Inner crimson core:  M16 26 L19 20 L16 15 L13 20 L16 26 Z          (#EB3B2D)
 * - Upper guide dot:     cx=16 cy=7 r=1.5                              (#EB3B2D)
 */
const OUTER_V_POLYGON: readonly Point2D[] = [
  [4, 6],
  [16, 26],
  [28, 6],
  [21.5, 6],
  [16, 17.5],
  [10.5, 6],
];

const INNER_CORE_DIAMOND: readonly Point2D[] = [
  [16, 26],
  [19, 20],
  [16, 15],
  [13, 20],
];

const GUIDE_DOT = { cx: 16, cy: 7, r: 1.5 } as const;

// VIZRA Obsidian surface (#09090B)
const BG_R = 9;
const BG_G = 9;
const BG_B = 11;

// Official VIZRA controlled crimson accent (#EB3B2D)
const RED_R = 235;
const RED_G = 59;
const RED_B = 45;

// White prism facet (#FFFFFF at 0.92 opacity)
const WHITE_ALPHA = 0.92;

function pointInPolygon(px: number, py: number, poly: readonly Point2D[]): boolean {
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

function pointInRoundedSquare(
  nx: number,
  ny: number,
  radius: number
): boolean {
  if (radius <= 0) return nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
  const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - radius));
  const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - radius));
  return dx * dx + dy * dy <= radius * radius;
}

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

function makePngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRgbaPng(width: number, height: number, rgba: Uint8Array): Buffer {
  const rowBytes = width * 4;
  const raw = Buffer.alloc(height * (1 + rowBytes));
  for (let y = 0; y < height; y++) {
    const destOffset = y * (1 + rowBytes);
    raw[destOffset] = 0; // Filter type 0 (None)
    const srcOffset = y * rowBytes;
    Buffer.from(rgba.buffer, rgba.byteOffset + srcOffset, rowBytes).copy(
      raw,
      destOffset + 1
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Renders the exact official VIZRA geometric logo into a crisp supersampled RGBA PNG.
 *
 * @param size Target width & height in pixels
 * @param options.roundedCornerRatio Corner radius ratio (0 for solid full-bleed square Apple/PWA icons, ~0.2 for browser favicons)
 * @param options.paddingRatio Safe margin around the 32x32 logo viewBox
 */
export function renderVizraLogoPng(
  size: number,
  options: { roundedCornerRatio?: number; paddingRatio?: number } = {}
): Buffer {
  const roundedCornerRatio = options.roundedCornerRatio ?? 0;
  const paddingRatio = options.paddingRatio ?? 0.12;
  const samples = size <= 64 ? 4 : size <= 192 ? 3 : 2;
  const sampleCount = samples * samples;

  const rgba = new Uint8Array(size * size * 4);
  const innerSpan = 1 - paddingRatio * 2;
  const dotRadiusSq = GUIDE_DOT.r * GUIDE_DOT.r;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;

      for (let sy = 0; sy < samples; sy++) {
        const ny = (py + (sy + 0.5) / samples) / size;
        const vy = ((ny - paddingRatio) / innerSpan) * 32;

        for (let sx = 0; sx < samples; sx++) {
          const nx = (px + (sx + 0.5) / samples) / size;
          if (!pointInRoundedSquare(nx, ny, roundedCornerRatio)) {
            continue;
          }

          // Start with solid VIZRA Obsidian surface (#09090B)
          let r = BG_R;
          let g = BG_G;
          let b = BG_B;

          const vx = ((nx - paddingRatio) / innerSpan) * 32;

          // Subtle 1-unit inner rim stroke on rounded favicons for dark-tab visibility
          if (roundedCornerRatio > 0) {
            const innerInset = 1 / Math.max(size, 32);
            const inInner = pointInRoundedSquare(
              (nx - innerInset) / (1 - innerInset * 2),
              (ny - innerInset) / (1 - innerInset * 2),
              Math.max(0, roundedCornerRatio - innerInset)
            );
            if (!inInner) {
              r = Math.round(r * 0.88 + 255 * 0.12);
              g = Math.round(g * 0.88 + 255 * 0.12);
              b = Math.round(b * 0.88 + 255 * 0.12);
            }
          }

          // Layer 1: Outer geometric V prism facet (#FFFFFF at 0.92 opacity)
          if (pointInPolygon(vx, vy, OUTER_V_POLYGON)) {
            r = Math.round(r * (1 - WHITE_ALPHA) + 255 * WHITE_ALPHA);
            g = Math.round(g * (1 - WHITE_ALPHA) + 255 * WHITE_ALPHA);
            b = Math.round(b * (1 - WHITE_ALPHA) + 255 * WHITE_ALPHA);
          }

          // Layer 2: Inner controlled crimson diamond core (#EB3B2D)
          if (pointInPolygon(vx, vy, INNER_CORE_DIAMOND)) {
            r = RED_R;
            g = RED_G;
            b = RED_B;
          }

          // Layer 3: Upper architectural guide dot (#EB3B2D)
          const dx = vx - GUIDE_DOT.cx;
          const dy = vy - GUIDE_DOT.cy;
          if (dx * dx + dy * dy <= dotRadiusSq) {
            r = RED_R;
            g = RED_G;
            b = RED_B;
          }

          // Premultiply by alpha=1
          sumR += r;
          sumG += g;
          sumB += b;
          sumA += 255;
        }
      }

      const idx = (py * size + px) * 4;
      if (sumA === 0) {
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 0;
      } else {
        const coveredSamples = sumA / 255;
        rgba[idx] = Math.min(255, Math.round(sumR / coveredSamples));
        rgba[idx + 1] = Math.min(255, Math.round(sumG / coveredSamples));
        rgba[idx + 2] = Math.min(255, Math.round(sumB / coveredSamples));
        rgba[idx + 3] = Math.min(255, Math.round(sumA / sampleCount));
      }
    }
  }

  return encodeRgbaPng(size, size, rgba);
}

/**
 * Generates a valid multi-resolution ICO binary containing 16x16, 32x32, and 48x48 PNG frames.
 */
export function generateVizraFaviconIco(): Buffer {
  const frames = [
    { size: 16, png: renderVizraLogoPng(16, { roundedCornerRatio: 0.2, paddingRatio: 0.08 }) },
    { size: 32, png: renderVizraLogoPng(32, { roundedCornerRatio: 0.2, paddingRatio: 0.1 }) },
    { size: 48, png: renderVizraLogoPng(48, { roundedCornerRatio: 0.2, paddingRatio: 0.1 }) },
  ];

  const headerSize = 6;
  const entrySize = 16;
  const directorySize = headerSize + frames.length * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type: 1 (ICO)
  header.writeUInt16LE(frames.length, 4); // Number of images

  let offset = directorySize;
  const entries: Buffer[] = [];
  for (const frame of frames) {
    const entry = Buffer.alloc(entrySize);
    entry[0] = frame.size >= 256 ? 0 : frame.size; // Width
    entry[1] = frame.size >= 256 ? 0 : frame.size; // Height
    entry[2] = 0; // Color palette
    entry[3] = 0; // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(frame.png.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Offset to image data
    entries.push(entry);
    offset += frame.png.length;
  }

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]);
}

/**
 * Generates the official VIZRA scalable SVG favicon preserving the exact geometry
 * and palette from src/components/VizraLogo.tsx.
 */
export function generateVizraFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6.5" fill="#09090B" />
  <rect x="0.5" y="0.5" width="31" height="31" rx="6" stroke="#FFFFFF" stroke-opacity="0.12" />
  <g transform="translate(3.2 3.2) scale(0.8)">
    <path d="M4 6L16 26L28 6H21.5L16 17.5L10.5 6H4Z" fill="#FFFFFF" fill-opacity="0.92" />
    <path d="M16 26L19 20L16 15L13 20L16 26Z" fill="#EB3B2D" />
    <circle cx="16" cy="7" r="1.5" fill="#EB3B2D" />
  </g>
</svg>
`;
}

/**
 * Generates the Web App Manifest (public/manifest.json) for Android, Chrome, and PWA identity.
 */
export function generateVizraWebManifest(): string {
  return `${JSON.stringify(
    {
      name: 'VIZRA',
      short_name: 'VIZRA',
      description:
        'A modern AI creative studio powered by Omnia 1.0. Generate, design, write, research, and build across 10-stage creative workflows.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#09090B',
      theme_color: '#09090B',
      icons: [
        {
          src: '/favicon-48x48.png',
          sizes: '48x48',
          type: 'image/png',
        },
        {
          src: '/favicon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    null,
    2
  )}\n`;
}

const memoryAssetCache = new Map<string, Buffer>();

export function buildAllBrandAssetBuffers(): Map<string, Buffer> {
  if (memoryAssetCache.size === BRAND_STATIC_ASSET_FILES.length) {
    return memoryAssetCache;
  }

  memoryAssetCache.set('favicon.ico', generateVizraFaviconIco());
  memoryAssetCache.set('favicon.svg', Buffer.from(generateVizraFaviconSvg(), 'utf-8'));
  memoryAssetCache.set(
    'favicon-32x32.png',
    renderVizraLogoPng(32, { roundedCornerRatio: 0.2, paddingRatio: 0.1 })
  );
  memoryAssetCache.set(
    'favicon-48x48.png',
    renderVizraLogoPng(48, { roundedCornerRatio: 0.2, paddingRatio: 0.1 })
  );
  memoryAssetCache.set(
    'favicon-96x96.png',
    renderVizraLogoPng(96, { roundedCornerRatio: 0.2, paddingRatio: 0.1 })
  );
  // Apple Touch Icon & PWA/Organization icons use full-bleed Obsidian square surface (#09090B)
  memoryAssetCache.set(
    'apple-touch-icon.png',
    renderVizraLogoPng(180, { roundedCornerRatio: 0, paddingRatio: 0.15 })
  );
  memoryAssetCache.set(
    'icon-192.png',
    renderVizraLogoPng(192, { roundedCornerRatio: 0, paddingRatio: 0.14 })
  );
  memoryAssetCache.set(
    'icon-512.png',
    renderVizraLogoPng(512, { roundedCornerRatio: 0, paddingRatio: 0.14 })
  );
  memoryAssetCache.set(
    'manifest.json',
    Buffer.from(generateVizraWebManifest(), 'utf-8')
  );

  return memoryAssetCache;
}

export function getBrandAssetBuffer(fileName: string): Buffer | null {
  const assets = buildAllBrandAssetBuffers();
  return assets.get(fileName) || null;
}

/**
 * Ensures all official VIZRA brand icon assets and manifest.json exist under `public/`.
 */
export function ensurePublicBrandAssets(
  rootDir: string,
  options: { force?: boolean } = {}
): string[] {
  const force = options.force === true;
  const publicDir = path.resolve(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const assets = buildAllBrandAssetBuffers();
  const writtenPaths: string[] = [];

  for (const spec of BRAND_STATIC_ASSET_FILES) {
    const targetPath = path.join(publicDir, spec.fileName);
    const shouldWrite = force || !fs.existsSync(targetPath);
    if (shouldWrite) {
      const buf = assets.get(spec.fileName);
      if (buf) {
        fs.writeFileSync(targetPath, buf);
      }
    }
    writtenPaths.push(targetPath);
  }

  return writtenPaths;
}
