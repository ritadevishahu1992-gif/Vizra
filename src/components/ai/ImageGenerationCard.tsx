import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  RotateCcw,
  Download,
  Copy,
  Check,
  Maximize2,
  Layers,
} from 'lucide-react';
import { TextShimmer } from '../ui/TextShimmer';

export interface ImageGenerationCardProps {
  prompt: string;
  modelName?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '21:9';
  imageUrl?: string;
  initialStatus?: 'generating' | 'completed' | 'error';
  onRegenerate?: (prompt: string) => void;
  onSaveToProject?: (dataUrl: string, prompt: string) => void;
}

/**
 * 07 · AI Image Generation Result
 * Adapted from 21st.dev `ai-chat-image-generation-1` pattern.
 * Features progressive curtain reveal, TextShimmer loading indicator,
 * procedural high-DPI obsidian/crimson raymarched canvas synthesis (or external imageUrl),
 * Regenerate action, and PNG Save/Download action.
 */
function embedPngProvenanceTextChunk(pngDataUrl: string, keyword: string, textValue: string): string {
  try {
    const prefix = 'data:image/png;base64,';
    if (!pngDataUrl.startsWith(prefix)) return pngDataUrl;
    const rawBase64 = pngDataUrl.slice(prefix.length);
    const binaryStr = atob(rawBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    // Verify PNG signature and locate IEND chunk (last 12 bytes)
    if (bytes.length < 33 || bytes[0] !== 0x89 || bytes[1] !== 0x50) {
      return pngDataUrl;
    }
    const iendOffset = bytes.length - 12;
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(keyword);
    const valBytes = encoder.encode(textValue);
    const chunkData = new Uint8Array(keyBytes.length + 1 + valBytes.length);
    chunkData.set(keyBytes, 0);
    chunkData[keyBytes.length] = 0;
    chunkData.set(valBytes, keyBytes.length + 1);

    const chunkType = encoder.encode('tEXt');
    // Compute CRC32 over type + data
    let crc = 0xffffffff;
    const crcInput = new Uint8Array(4 + chunkData.length);
    crcInput.set(chunkType, 0);
    crcInput.set(chunkData, 4);
    for (let i = 0; i < crcInput.length; i++) {
      crc ^= crcInput[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;

    const fullChunk = new Uint8Array(12 + chunkData.length);
    const dv = new DataView(fullChunk.buffer);
    dv.setUint32(0, chunkData.length, false);
    fullChunk.set(chunkType, 4);
    fullChunk.set(chunkData, 8);
    dv.setUint32(8 + chunkData.length, crc, false);

    const out = new Uint8Array(bytes.length + fullChunk.length);
    out.set(bytes.subarray(0, iendOffset), 0);
    out.set(fullChunk, iendOffset);
    out.set(bytes.subarray(iendOffset), iendOffset + fullChunk.length);

    let outBin = '';
    for (let i = 0; i < out.length; i++) {
      outBin += String.fromCharCode(out[i]);
    }
    return prefix + btoa(outBin);
  } catch {
    return pngDataUrl;
  }
}

export const ImageGenerationCard: React.FC<ImageGenerationCardProps> = ({
  prompt,
  modelName = 'Omnia 1.0 · Procedural Canvas Preview',
  aspectRatio = '16:9',
  imageUrl,
  initialStatus = 'completed',
  onRegenerate,
  onSaveToProject,
}) => {
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>(
    initialStatus
  );
  const [revealProgress, setRevealProgress] = useState(
    initialStatus === 'generating' ? 15 : 100
  );
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 10000));
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>(imageUrl || '');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render procedural high-DPI architectural artwork onto canvas when no external imageUrl is supplied
  const renderProceduralFrame = useCallback(
    (currentSeed: number) => {
      if (imageUrl) {
        setDataUrl(imageUrl);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = aspectRatio === '9:16' ? 540 : aspectRatio === '1:1' ? 640 : 800;
      const height = aspectRatio === '9:16' ? 960 : aspectRatio === '1:1' ? 640 : 450;
      canvas.width = width;
      canvas.height = height;

      // Deep Obsidian Void Base
      const bgGrad = ctx.createRadialGradient(
        width * 0.52,
        height * 0.45,
        20,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      bgGrad.addColorStop(0, '#1a0808');
      bgGrad.addColorStop(0.45, '#0b0b0d');
      bgGrad.addColorStop(1, '#040404');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Architectural Perspective Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Surgical Crimson Caustic Refractions
      const ringCount = 5;
      const centerX = width * (0.42 + ((currentSeed % 17) / 100));
      const centerY = height * (0.46 + ((currentSeed % 13) / 100));

      for (let i = 0; i < ringCount; i++) {
        const radius = 55 + i * 38 + (currentSeed % 25);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(((currentSeed + i * 47) * Math.PI) / 180);

        const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        grad.addColorStop(0, 'rgba(220, 38, 38, 0.55)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.14)');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0.02)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = i === 0 ? 2.5 : 1.25;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Central Obsidian Monolith Prism
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(0, -95);
      ctx.lineTo(82, 35);
      ctx.lineTo(0, 95);
      ctx.lineTo(-82, 35);
      ctx.closePath();
      const prismGrad = ctx.createLinearGradient(-80, -95, 80, 95);
      prismGrad.addColorStop(0, 'rgba(30, 30, 34, 0.92)');
      prismGrad.addColorStop(0.5, 'rgba(12, 12, 14, 0.96)');
      prismGrad.addColorStop(1, 'rgba(220, 38, 38, 0.28)');
      ctx.fillStyle = prismGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(235, 59, 45, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Subtle Metadata Watermark Stamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.font = '11px monospace';
      ctx.fillText(
        `VIZRA OMNIA 1.0 · SEED #${currentSeed} · ${aspectRatio}`,
        20,
        height - 18
      );

      try {
        const rawPng = canvas.toDataURL('image/png');
        const provenanceJson = JSON.stringify({
          generator: 'Vizra Omnia 1.0 Procedural Canvas',
          syntheticContent: true,
          standard: 'EU-AI-Act-Art-50-Metadata',
          seed: currentSeed,
          aspectRatio,
          createdAt: new Date().toISOString(),
        });
        setDataUrl(embedPngProvenanceTextChunk(rawPng, 'AI-Provenance', provenanceJson));
      } catch {
        // Ignore security taint if external image
      }
    },
    [aspectRatio, imageUrl]
  );

  useEffect(() => {
    renderProceduralFrame(seed);
  }, [seed, renderProceduralFrame]);

  useEffect(() => {
    if (status !== 'generating') return;
    setRevealProgress(12);
    const interval = window.setInterval(() => {
      setRevealProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          setStatus('completed');
          return 100;
        }
        return prev + 22;
      });
    }, 240);
    return () => window.clearInterval(interval);
  }, [status]);

  const handleRegenerateClick = () => {
    setStatus('generating');
    setSeed(Math.floor(Math.random() * 90000) + 10000);
    onRegenerate?.(prompt);
  };

  const handleDownload = () => {
    const targetUrl = imageUrl || dataUrl;
    if (!targetUrl) return;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `vizra-omnia-synthesis-${seed}.png`;
    link.click();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 1800);
  };

  return (
    <div className="rounded-2xl bg-[#111111] border border-white/[0.08] overflow-hidden text-white shadow-xl select-none">
      {/* Top Status & Model Bar */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2 bg-[#090909]/60">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={14} className="text-[#EB3B2D] shrink-0" />
          <span className="text-xs font-semibold text-white truncate">
            {status === 'generating' ? (
              <TextShimmer duration={1.6}>
                Synthesizing high-contrast visual frame…
              </TextShimmer>
            ) : (
              modelName
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
            {aspectRatio}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
              status === 'generating'
                ? 'bg-amber-950/50 border border-amber-800/50 text-amber-300'
                : 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-400'
            }`}
          >
            {status === 'generating' ? `${Math.min(99, revealProgress)}%` : 'Ready'}
          </span>
        </div>
      </div>

      {/* Visual Viewport with Progressive Curtain Reveal */}
      <div className="relative bg-[#050505] overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full max-h-[380px] object-cover block"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full max-h-[360px] object-cover block"
          />
        )}

        {/* Progressive Blur Curtain Overlay during Generation */}
        {status === 'generating' && (
          <motion.div
            initial={{ clipPath: 'inset(0% 0 0 0)' }}
            animate={{ clipPath: `inset(${revealProgress}% 0 0 0)` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 backdrop-blur-xl bg-black/55 flex items-center justify-center pointer-events-none"
          >
            <div className="px-4 py-2 rounded-xl bg-[#111111]/90 border border-white/[0.1] text-xs font-mono text-white">
              Rendering diffusion pass ({revealProgress}%)…
            </div>
          </motion.div>
        )}
      </div>

      {/* Prompt Metadata & Action Footer */}
      <div className="p-4 space-y-3 bg-[#111111]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-neutral-300 font-mono leading-relaxed line-clamp-2">
            “{prompt}”
          </p>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Copy prompt"
          >
            {copiedPrompt ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-neutral-500">
            Seed #{seed} · 60fps Obsidian Color Profile
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerateClick}
              disabled={status === 'generating'}
              className="px-3 py-1.5 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-xs font-medium text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={12} className="text-[#EB3B2D]" />
              <span>Regenerate</span>
            </button>

            {onSaveToProject && dataUrl && (
              <button
                type="button"
                onClick={() => onSaveToProject(dataUrl, prompt)}
                className="px-3 py-1.5 rounded-xl bg-[#171717] hover:bg-neutral-800 border border-white/[0.08] text-xs font-medium text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={12} className="text-[#EB3B2D]" />
                <span>Add to Project</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={status === 'generating'}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download size={12} />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
