import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Film,
  Activity,
  Code,
  FileText,
  Presentation,
  Mic,
  Copy,
  Check,
  Sliders,
} from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { Tooltip } from '../ui/Tooltip';

interface CreationToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
}

export const CreationToolsModal: React.FC<CreationToolsModalProps> = ({
  isOpen,
  onClose,
  onUsePrompt,
}) => {
  const [activeTool, setActiveTool] = useState<'image' | 'animation' | 'video' | 'code' | 'audio'>('image');
  const [copied, setCopied] = useState(false);

  // Image Prompt Builder State
  const [imgSubject, setImgSubject] = useState('obsidian geometric prism in deep void space');
  const [imgStyle, setImgStyle] = useState('cinematic raymarched plasma, surgical red laser refractions');
  const [imgAspect, setImgAspect] = useState('16:9');

  // Animation Bezier State
  const [p1x, setP1x] = useState(0.16);
  const [p1y, setP1y] = useState(1.0);
  const [p2x, setP2x] = useState(0.3);
  const [p2y, setP2y] = useState(1.0);

  if (!isOpen) return null;

  const generatedImagePrompt = `cinematic wide shot of ${imgSubject}, ${imgStyle}, 8k render, unreal engine 5.4, 60fps kinetic aesthetic, pure black background, surgical crimson refraction --ar ${imgAspect} --style raw`;

  const bezierCode = `cubic-bezier(${p1x}, ${p1y}, ${p2x}, ${p2y})`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <VizraLogo size={20} />
            <div>
              <h3 className="font-semibold text-base tracking-tight">Omnia Creation Tools</h3>
              <p className="text-[11px] text-neutral-500">Modular creative synthesis utilities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tool Category Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-3 pb-4 border-b border-neutral-900 shrink-0 text-xs">
          <Tooltip
            label="Image Crafter"
            text="Compose structured visual prompts with subject geometry, lighting treatment, and aspect ratio presets."
            position="bottom"
            align="start"
          >
            <button
              onClick={() => setActiveTool('image')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'image'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles size={13} className="text-[#eb3b2d]" />
              <span>Image Crafter</span>
            </button>
          </Tooltip>

          <Tooltip
            label="Kinetic Curves"
            text="Fine-tune 60fps cubic-bezier motion easing curves for smooth UI and shader animations."
            position="bottom"
          >
            <button
              onClick={() => setActiveTool('animation')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'animation'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Activity size={13} className="text-[#eb3b2d]" />
              <span>Kinetic Curves</span>
            </button>
          </Tooltip>

          <Tooltip
            label="Video Director"
            text="Generate multi-shot cinematic storyboards, camera movements, and pacing breakdowns."
            position="bottom"
          >
            <button
              onClick={() => setActiveTool('video')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'video'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film size={13} className="text-[#eb3b2d]" />
              <span>Video Director</span>
            </button>
          </Tooltip>

          <Tooltip
            label="Code Workspace"
            text="Launch interactive UI component, WebGL shader, or full-stack architecture prompt templates."
            position="bottom"
          >
            <button
              onClick={() => setActiveTool('code')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'code'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code size={13} className="text-[#eb3b2d]" />
              <span>Code Workspace</span>
            </button>
          </Tooltip>

          <Tooltip
            label="Audio & Soundscapes"
            text="Create voiceover scripts, spatial foley cues, or ambient electronic soundscape briefs."
            position="bottom"
            align="end"
          >
            <button
              onClick={() => setActiveTool('audio')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTool === 'audio'
                  ? 'bg-neutral-900 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic size={13} className="text-[#eb3b2d]" />
              <span>Audio & Soundscapes</span>
            </button>
          </Tooltip>
        </div>

        {/* Tool Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {activeTool === 'image' && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Subject & Geometry</label>
                <input
                  type="text"
                  value={imgSubject}
                  onChange={(e) => setImgSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#eb3b2d]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Lighting & Material Treatment</label>
                <input
                  type="text"
                  value={imgStyle}
                  onChange={(e) => setImgStyle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-[#eb3b2d]"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold text-neutral-300">Aspect Ratio:</span>
                {['16:9', '9:16', '1:1', '21:9'].map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setImgAspect(ar)}
                    className={`px-2.5 py-1 rounded border text-xs cursor-pointer ${
                      imgAspect === ar
                        ? 'bg-white text-black font-semibold border-white'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>

              {/* Generated Prompt Output Box */}
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>Synthesized Diffusion Prompt</span>
                  <button
                    onClick={() => handleCopy(generatedImagePrompt)}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-[#eb3b2d]" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-neutral-200 text-xs leading-relaxed bg-black/60 p-2.5 rounded-lg border border-neutral-900 select-all">
                  {generatedImagePrompt}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'animation' && (
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-neutral-300 block mb-1">60fps Kinetic Bezier Curve</span>
                <p className="text-neutral-500 text-[11px] mb-3">
                  Vizra's signature asymmetric easing profile for luxury deceleration.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <div className="text-center font-mono text-base font-bold text-[#eb3b2d]">
                  {bezierCode}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">P1 X (Attack):</span>
                    <span className="font-mono text-[#eb3b2d]">{p1x}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={p1x}
                    onChange={(e) => setP1x(parseFloat(e.target.value))}
                    className="w-full accent-[#eb3b2d]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">P1 Y (Overshoot):</span>
                    <span className="font-mono text-[#eb3b2d]">{p1y}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={p1y}
                    onChange={(e) => setP1y(parseFloat(e.target.value))}
                    className="w-full accent-[#eb3b2d]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTool === 'video' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="font-semibold text-white mb-1">Shot Cadence Engine</div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Automatically translates narrative premises into 35mm anamorphic camera trajectories with continuous rotational easing.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      onUsePrompt('Generate a 4-shot camera trajectory for an anamorphic macro reveal of an obsidian monolith.');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                  >
                    Load into Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'code' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="font-semibold text-white mb-1">Kinetic Shader Generator</div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  GLSL fragment kernel synthesis for raymarched signed distance fields (SDF) and chromatic dispersion.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      onUsePrompt('Write a WebGL2 GLSL fragment shader that renders an obsidian prism with chromatic dispersion.');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                  >
                    Generate Shader in Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'audio' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="font-semibold text-white mb-1">Procedural Audio & Soundtrack Engine</div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Generates cinematic dark-ambient soundscapes, spatial Foley effects, and kinetic pacing cues directly for your creative productions.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      onUsePrompt('Generate a 30-second dark ambient soundscape with deep sub-bass pulses and metallic laser reverb.');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                  >
                    Generate Soundscape in Chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-900 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500 font-mono">Omnia 1.0 Toolkit</span>
          <button
            onClick={() => {
              if (activeTool === 'image') {
                onUsePrompt(`Generate visual direction based on: ${generatedImagePrompt}`);
              }
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Insert into Omnia
          </button>
        </div>
      </div>
    </div>
  );
};
