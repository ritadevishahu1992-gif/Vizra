import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  Sparkles,
  Download,
  Image as ImageIcon,
  Clock,
  Radio,
  Sliders,
  X,
  Volume2,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { generateMusicTrack } from '../../services/musicService';
import { GeneratedTrackResult } from '../../services/proceduralAudio';

interface MusicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onInsertToChat?: (trackText: string) => void;
}

const GENRE_PRESETS = [
  { name: 'Cinematic Ambient', bpm: 85, prompt: 'Ethereal cinematic ambient soundscape with deep sub bass and obsidian reverb' },
  { name: 'Cyberpunk Synthwave', bpm: 120, prompt: 'Dark cyberpunk synthwave pulse with retro arpeggios and neon bassline' },
  { name: 'Lo-Fi Chill Beats', bpm: 80, prompt: 'Warm vintage lo-fi hip hop beat with vinyl crackle, gentle Rhodes piano, and acoustic drums' },
  { name: 'Modern Brand Jingle', bpm: 110, prompt: 'Clean, energetic 15-second modern tech startup audio logo jingle with acoustic guitar and glockenspiel' },
  { name: 'Deep Focus Drone', bpm: 60, prompt: 'Meditative deep drone soundscape with binaural harmonics for deep thinking' },
  { name: 'Epic Orchestral', bpm: 130, prompt: 'Driving cinematic orchestral trailer soundtrack with staccato violins and kinetic timpani' },
];

export const MusicStudioModal: React.FC<MusicStudioModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  onInsertToChat,
}) => {
  const [prompt, setPrompt] = useState(
    initialPrompt || 'Cinematic ambient soundscape with warm analog synthesizers and delicate piano'
  );
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [duration, setDuration] = useState<number>(20);
  const [genre, setGenre] = useState<string>('Cinematic Ambient');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<GeneratedTrackResult[]>([]);
  const [activeTrack, setActiveTrack] = useState<GeneratedTrackResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const track = await generateMusicTrack({
        prompt: prompt.trim(),
        model,
        durationSeconds: duration,
        genre,
        imageFile: selectedImage,
      });

      setTracks((prev) => [track, ...prev]);
      setActiveTrack(track);

      // Play newly generated track automatically
      if (audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to generate music:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayTrack = (track: GeneratedTrackResult) => {
    if (!audioRef.current) return;

    if (activeTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      setActiveTrack(track);
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-5 md:p-7 shadow-2xl text-white flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#eb3b2d]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#eb3b2d]">
              <Music size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                  AI Music Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800">
                  Lyria 3
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Generate custom soundtracks, jingles, or background music from text prompts or visual imagery.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 py-4 overflow-y-auto">
          {/* Left Column: Generator Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Model Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center justify-between">
                <span>Model Architecture</span>
                <span className="text-[10px] font-mono text-[#eb3b2d]">Google Lyria Engine</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModel('lyria-3-clip-preview');
                    if (duration > 30) setDuration(20);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    model === 'lyria-3-clip-preview'
                      ? 'bg-neutral-900 border-[#eb3b2d] shadow-sm'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Lyria 3 Clip</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-[#eb3b2d]">
                      Up to 30s
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Short clips, logos, loops, background motifs, and brand jingles.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModel('lyria-3-pro-preview');
                    if (duration <= 30) setDuration(60);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    model === 'lyria-3-pro-preview'
                      ? 'bg-neutral-900 border-[#eb3b2d] shadow-sm'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">Lyria 3 Pro</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-emerald-400">
                      Full Track
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Full-length tracks, evolving compositions, and dynamic soundtracks.
                  </p>
                </button>
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Music Prompt & Style Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe instruments, atmosphere, rhythm, tempo, and mood..."
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-white text-xs md:text-sm focus:outline-none focus:border-[#eb3b2d] resize-none leading-relaxed"
              />
            </div>

            {/* Image Inspiration (Multimodal input) */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center justify-between">
                <span>Visual Inspiration (Optional)</span>
                <span className="text-[10px] text-neutral-500">Generate music directly from an image</span>
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {imagePreview ? (
                <div className="relative p-2 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Inspiration"
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-800"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="font-semibold text-white truncate">
                      {selectedImage?.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Visual palette & atmosphere attached to Lyria generation prompt
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900/40 text-neutral-400 hover:text-white text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ImageIcon size={14} className="text-[#eb3b2d]" />
                  <span>Attach reference image to inspire soundtrack aesthetics</span>
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Acoustic Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GENRE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setGenre(p.name);
                      setPrompt(p.prompt);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                      genre === p.name
                        ? 'bg-neutral-800 text-white border-neutral-700'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-850 hover:text-white hover:border-neutral-800'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-neutral-300 mb-1">
                <span>Duration</span>
                <span className="font-mono text-[#eb3b2d]">{duration} seconds</span>
              </div>
              <input
                type="range"
                min="5"
                max={model === 'lyria-3-clip-preview' ? 30 : 120}
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full accent-[#eb3b2d] cursor-pointer"
              />
            </div>

            {/* Primary Generate Action */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-[#eb3b2d]" />
                  <span>Synthesizing audio with {model}...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} className="text-[#eb3b2d]" />
                  <span>Generate AI Soundtrack</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Track Library & Waveform Player (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <span className="text-xs font-semibold text-neutral-300 uppercase font-mono tracking-wider">
                Soundtrack Outputs
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
              </span>
            </div>

            {/* Active Playing Banner */}
            {activeTrack && (
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-[#eb3b2d]/40 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {activeTrack.title}
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      {activeTrack.genre} • {activeTrack.bpm} BPM • {activeTrack.key}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-[#eb3b2d]">
                    {activeTrack.durationSeconds}s
                  </span>
                </div>

                {/* Animated Waveform Bars */}
                <div className="flex items-center gap-1 h-6 py-1">
                  {[40, 70, 95, 60, 30, 85, 100, 45, 65, 80, 50, 90, 75, 35, 60, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPlaying ? 'bg-[#eb3b2d] animate-pulse' : 'bg-neutral-700'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%` : '20%',
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => togglePlayTrack(activeTrack)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                  >
                    {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    <span>{isPlaying ? 'Pause' : 'Play Track'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={activeTrack.audioUrl}
                      download={`${activeTrack.title.replace(/\s+/g, '_').toLowerCase()}.wav`}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Download WAV"
                    >
                      <Download size={13} />
                    </a>

                    {onInsertToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertToChat(
                            `Created soundtrack: **${activeTrack.title}** (${activeTrack.genre}, ${activeTrack.durationSeconds}s, ${activeTrack.bpm} BPM). Prompt: "${activeTrack.prompt}".`
                          );
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#eb3b2d]/20 hover:bg-[#eb3b2d]/30 border border-[#eb3b2d]/40 text-xs text-[#eb3b2d] font-medium cursor-pointer"
                        title="Send track into conversation"
                      >
                        <span>Send to Chat</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Track History List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {tracks.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  <Radio size={24} className="mx-auto mb-2 opacity-40 text-neutral-400" />
                  <p>No tracks generated yet.</p>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Configure your prompt on the left and click Generate AI Soundtrack.
                  </p>
                </div>
              ) : (
                tracks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      activeTrack?.id === t.id
                        ? 'bg-neutral-900 border-[#eb3b2d]/50'
                        : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                    }`}
                    onClick={() => togglePlayTrack(t)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-white shrink-0">
                        {activeTrack?.id === t.id && isPlaying ? (
                          <Pause size={12} fill="currentColor" />
                        ) : (
                          <Play size={12} fill="currentColor" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{t.title}</div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {t.genre} • {t.durationSeconds}s
                        </div>
                      </div>
                    </div>

                    <a
                      href={t.audioUrl}
                      download={`${t.title.replace(/\s+/g, '_').toLowerCase()}.wav`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
                      title="Download"
                    >
                      <Download size={13} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500 shrink-0 font-sans">
          <span>Powered by Google Lyria Models (lyria-3-clip-preview & lyria-3-pro-preview)</span>
          <span className="font-mono text-neutral-400">Vizra Studio Audio Layer</span>
        </div>
      </div>
    </div>
  );
};
