import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  Sparkles,
  LockKeyhole,
  X,
  Camera,
  Music,
  Film,
  Users,
  Cpu,
  Sliders,
  Check,
  ChevronRight,
  Eye,
  Layers,
  Activity,
  Maximize2,
  Clock,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

export type RoadmapStatus = 'In Development' | 'Coming Soon' | 'Planned';

export interface RoadmapItem {
  id: number;
  title: string;
  codename: string;
  tagline: string;
  description: string;
  status: RoadmapStatus;
  category: string;
  previewBadge: string;
  details: string;
  technicalMilestones: string[];
  specs: { label: string; value: string }[];
  interactiveType: 'camera' | 'audio' | 'consistency' | 'canvas' | 'edge' | 'haptic';
}

export const roadmapData: RoadmapItem[] = [
  {
    id: 1,
    title: 'Omnia Spatial Director',
    codename: 'PROJECT AETHER',
    tagline: 'Multi-camera 3D virtual blocking & neural path synthesis',
    description:
      'Orchestrate multi-camera spatial blocking, lens focal depths, and subject trajectory curves inside a realtime 3D viewport before executing neural video generation.',
    status: 'In Development',
    category: 'Directing & 3D',
    previewBadge: '3D SPATIAL',
    details:
      'Omnia Spatial Director bridges pre-visualization with neural diffusion models. Instead of relying on text prompts alone for complex cinematography, directors can place virtual cameras, define Dolly-Zoom trajectories, block actor path splines, and lock focal lengths. Omnia compiles these 3D vectors directly into latent conditioning constraints, guaranteeing exact cinematic coverage.',
    technicalMilestones: [
      'Zero-latency 3D spline trajectory interpolation (Complete)',
      'Dual focal-depth frustum projection conditioning (Active)',
      'Latent tensor injection for camera motion parallax (Testing)',
    ],
    specs: [
      { label: 'Viewport Resolution', value: 'Realtime WebGL2 / 60 FPS' },
      { label: 'Camera Parameters', value: '18mm to 135mm Anamorphic' },
      { label: 'Trajectory Format', value: 'Hermite Cubic Splines' },
      { label: 'Output Quality', value: '4K DCI Cinematic Delivery' },
    ],
    interactiveType: 'camera',
  },
  {
    id: 2,
    title: 'Neural Audio Stem Decomposer',
    codename: 'PROJECT HARMONIX',
    tagline: 'Dynamic multi-stem orchestral weaving synchronized to video beats',
    description:
      'Generate adaptive, multi-track orchestral and electronic score stems that automatically duck, swell, and align with visual kinetic pacing and narrative sentiment arcs.',
    status: 'In Development',
    category: 'Audio Intelligence',
    previewBadge: 'AUDIO STEMS',
    details:
      'Traditional AI audio generates flat, locked stereo tracks. Project Harmonix generates discrete, fully separated stem layers—orchestral strings, synthetic bass, Foley textures, and harmonic pads. Each stem dynamically responds to visual keyframes, automatically side-chaining beneath dialogue and swelling during dramatic visual transitions.',
    technicalMilestones: [
      'Multi-track generative stem separation (Complete)',
      'Sub-beat video-to-audio transient synchronization (Active)',
      'Lossless 48kHz/24-bit multichannel audio export (Testing)',
    ],
    specs: [
      { label: 'Sample Rate', value: '48 kHz / 24-bit Lossless' },
      { label: 'Discrete Stems', value: '6 Independent Layers' },
      { label: 'Beat Alignment', value: '< 2ms Transient Accuracy' },
      { label: 'Dynamic Range', value: '114 dB Studio Master' },
    ],
    interactiveType: 'audio',
  },
  {
    id: 3,
    title: 'Kinetic Consistency Engine',
    codename: 'PROJECT CHRONOS',
    tagline: 'Cross-shot character, costume, and lighting persistence',
    description:
      'Locks identity tokens, wardrobe geometry, and ambient physics across extended multi-scene sequences, eradicating character drift between generation takes.',
    status: 'Coming Soon',
    category: 'Video Synthesis',
    previewBadge: 'CONTINUITY',
    details:
      'The single largest barrier to AI-driven feature film production is continuity drift. Project Chronos implements an authoritative token anchoring layer that holds facial geometry, clothing weave, lighting vectors, and environmental props across unlimited sequential generations, enabling true episodic and feature-length narratives.',
    technicalMilestones: [
      'High-dimensional identity embedding persistence (Complete)',
      'Environmental illumination vector transfer (Active)',
      'Long-horizon temporal continuity cache (Planned)',
    ],
    specs: [
      { label: 'Identity Drift', value: '< 0.04 Cosine Variance' },
      { label: 'Cross-Shot Memory', value: 'Up to 32 Sequential Scenes' },
      { label: 'Costume Persistence', value: 'Sub-mesh Texture Anchoring' },
      { label: 'Lighting Coherence', value: 'PBR Spherical Harmonics' },
    ],
    interactiveType: 'consistency',
  },
  {
    id: 4,
    title: 'Vizra Team Production Canvas',
    codename: 'PROJECT SYNDICATE',
    tagline: 'Real-time collaborative timeline with multi-seat branching takes',
    description:
      'A multiplayer creative studio canvas where directors, prompt engineers, and motion editors co-direct generative timelines with live presence and non-destructive version branching.',
    status: 'Coming Soon',
    category: 'Collaboration',
    previewBadge: 'MULTIPLAYER',
    details:
      'Brings enterprise-grade multiplayer collaboration to generative filmmaking. Multiple team members can work on the same video reel simultaneously. The director can audition alternative takes while the audio engineer refines the score, with instant branch merging and team commentary pins right inside the timeline.',
    technicalMilestones: [
      'CRDT-based timeline state synchronization (Complete)',
      'Zero-conflict branch merge architecture (Active)',
      'Role-based approval permissions pipeline (Testing)',
    ],
    specs: [
      { label: 'Concurrency', value: 'Up to 25 Live Team Seats' },
      { label: 'Sync Latency', value: '< 25ms WebSocket Fabric' },
      { label: 'Branching', value: 'Non-destructive Git-like Takes' },
      { label: 'Presence', value: 'Sub-pixel Multi-cursor Canvas' },
    ],
    interactiveType: 'canvas',
  },
  {
    id: 5,
    title: 'Edge Omnia Local Runtime',
    codename: 'PROJECT SILICON',
    tagline: 'Autonomous on-device neural inference for offline studio workstations',
    description:
      'Run quantized multimodal creative models locally on Apple Silicon Metal and NVIDIA RTX hardware with zero network transmission and absolute privacy.',
    status: 'Planned',
    category: 'Infrastructure',
    previewBadge: 'LOCAL EDGE',
    details:
      'For sensitive commercial productions requiring air-gapped security, Edge Omnia brings the complete intelligence stack to the local workstation. Optimized for Apple Silicon unified memory (M-series) and NVIDIA Ada Lovelace architectures, creators can generate, direct, and master without a single byte leaving their physical studio.',
    technicalMilestones: [
      '4-bit quantization benchmarks for diffusion weights (Complete)',
      'Metal Performance Shaders acceleration kernel (Design)',
      'Air-gapped telemetry and licensing isolation (Planned)',
    ],
    specs: [
      { label: 'Hardware Targets', value: 'Apple Silicon M2/M3/M4 & RTX 4090+' },
      { label: 'Memory Footprint', value: '16GB Unified Memory Floor' },
      { label: 'Network Requirement', value: '100% Offline Capable' },
      { label: 'Throughput', value: '28-35 Tokens / Sec Local' },
    ],
    interactiveType: 'edge',
  },
  {
    id: 6,
    title: 'Tactile Cinematic Jog Controller',
    codename: 'PROJECT TACTILE',
    tagline: 'Physical hardware precision wheel for scrubbing neural latent keyframes',
    description:
      'Native USB-C physical controller integration giving creators weighted, haptic rotary feedback as they scrub through continuous generative diffusion frames.',
    status: 'Planned',
    category: 'Hardware & Tools',
    previewBadge: 'HAPTIC WHEEL',
    details:
      'Touchscreens and mice lack the tactile intuition of analog editing consoles. Project Tactile defines an open USB-C HID standard allowing filmmakers to connect physical weighted jog-wheels and motorized faders to scrub through latent video steps, feeling simulated magnetic detents at every keyframe.',
    technicalMilestones: [
      'HID WebUSB protocol bridge driver (Complete)',
      'Haptic motor curve profile calibration (Design)',
      'Physical prototype chassis validation (Planned)',
    ],
    specs: [
      { label: 'Scrub Resolution', value: '0.01 Frame Latent Step' },
      { label: 'Interface', value: 'USB-C WebHID Driverless' },
      { label: 'Haptic Feedback', value: 'Programmable Force Detents' },
      { label: 'Response Latency', value: '< 5ms Input-to-Frame' },
    ],
    interactiveType: 'haptic',
  },
];

const filters: ('All' | RoadmapStatus)[] = [
  'All',
  'In Development',
  'Coming Soon',
  'Planned',
];

export const VizraComingSoon: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | RoadmapStatus>('All');
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [emailNotification, setEmailNotification] = useState('');
  const [subscribedItemIds, setSubscribedItemIds] = useState<number[]>([]);
  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSubscribeSuccess(false);
      setEmailNotification('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  const visibleItems = roadmapData.filter(
    (item) => activeFilter === 'All' || item.status === activeFilter
  );

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailNotification || !emailNotification.includes('@') || !selectedItem) return;

    setSubmittingEmail(true);
    setTimeout(() => {
      setSubmittingEmail(false);
      setSubscribeSuccess(true);
      setSubscribedItemIds((prev) => [...prev, selectedItem.id]);
    }, 450);
  };

  return (
    <section
      id="coming-soon"
      className="relative overflow-hidden bg-[#090909] px-5 py-24 text-white md:px-10 lg:px-16 selection:bg-[#DC2626] selection:text-white border-t border-white/5"
      aria-label="Coming Soon & Future Features"
    >
      {/* Background Ambience: Subtle crimson aura with CSS blur */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-red-700/[0.07] blur-[150px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 h-[400px] w-[450px] rounded-full bg-red-950/[0.12] blur-[140px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-red-500">
            <Sparkles size={14} className="text-red-500 animate-pulse" />
            <span>The Future of VIZRA</span>
          </div>

          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl text-white">
            What's on the
            <span className="text-red-500"> horizon?</span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400 md:text-base">
            A glimpse into what's being imagined, developed and planned for the VIZRA ecosystem.
            These upcoming capabilities preview the evolution of our 10-stage creative pipeline.
          </p>
        </div>

        {/* 21st.dev Style Interactive Status Filter Tabs */}
        <div className="mb-10 flex flex-wrap items-center gap-2" role="tablist" aria-label="Roadmap status filters">
          {filters.map((filter) => {
            const count =
              filter === 'All'
                ? roadmapData.length
                : roadmapData.filter((i) => i.status === filter).length;
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(filter)}
                className={`relative rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  isActive
                    ? 'border-red-500 bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                    : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/25 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span>{filter}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-red-700/80 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 21st.dev Bento Grid with Spotlight Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {visibleItems.map((item, index) => {
            const isFeatured = index === 0 && activeFilter === 'All';

            return (
              <article
                key={item.id}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
                }}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/40 flex flex-col justify-between shadow-lg ${
                  isFeatured ? 'md:col-span-2' : 'col-span-1'
                }`}
              >
                {/* 21st.dev Cursor Spotlight Effect */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(350px circle at var(--x, 50%) var(--y, 50%), rgba(220,38,38,0.18), transparent 65%)',
                  }}
                  aria-hidden="true"
                />

                {/* 21st.dev Border Beam on Featured Item */}
                {isFeatured && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl border border-red-500/30 opacity-70"
                    aria-hidden="true"
                  >
                    <div className="absolute -top-[1px] left-1/4 h-[2px] w-1/2 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                  </div>
                )}

                <div>
                  {/* Custom Visual Prototype / Concept Mockup Preview */}
                  <div className="relative mb-6 flex h-52 w-full items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-[#171717]">
                    {/* Background Tech Grid */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                      }}
                    />

                    {/* Interactive Prototype Visualizations */}
                    {item.interactiveType === 'camera' && (
                      <div className="relative w-full h-full p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Camera size={11} /> 3D CAMERA PATH
                          </span>
                          <span>FOV: 32.5° · 50mm PRIME</span>
                        </div>
                        {/* 3D Wireframe Plane */}
                        <div className="relative w-full h-24 my-auto flex items-center justify-center">
                          <div className="absolute w-44 h-24 border border-red-500/30 rounded-lg transform -rotate-6 skew-x-12 bg-red-950/10 flex items-center justify-center">
                            <div className="w-16 h-12 border border-red-400/50 rounded flex items-center justify-center text-[10px] font-mono text-red-300">
                              FOCUS
                            </div>
                            {/* Motion Vector Lines */}
                            <div className="absolute -top-3 -right-4 w-12 h-0.5 bg-red-500/60 rotate-45" />
                            <div className="absolute -bottom-2 -left-4 w-14 h-0.5 bg-red-500/60 -rotate-12" />
                          </div>
                          <div className="w-8 h-8 rounded-full border border-red-500 bg-red-500/20 flex items-center justify-center text-white z-10 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                            <Eye size={14} className="text-red-400" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>Trajectory: Bezier Smooth</span>
                          <span className="text-emerald-400">60 FPS Locked</span>
                        </div>
                      </div>
                    )}

                    {item.interactiveType === 'audio' && (
                      <div className="relative w-full h-full p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Music size={11} /> 6-STEM WEAVER
                          </span>
                          <span>BPM: 124 · KEY: D MINOR</span>
                        </div>
                        {/* Waveform Bars */}
                        <div className="flex items-end justify-center gap-1.5 h-20 my-auto px-4">
                          {[35, 60, 85, 45, 95, 70, 50, 80, 65, 40, 90, 75, 55, 85, 60].map((h, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-gradient-to-t from-red-600 to-red-400/70 rounded-full transition-all duration-300 group-hover:scale-y-110"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>Stems: Strings / Sub / Foley</span>
                          <span className="text-red-400">Dynamic Sidechain</span>
                        </div>
                      </div>
                    )}

                    {item.interactiveType === 'consistency' && (
                      <div className="relative w-full h-full p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Film size={11} /> CONTINUITY MATRIX
                          </span>
                          <span>LATENT DRIFT: 0.02</span>
                        </div>
                        {/* Frame strip */}
                        <div className="flex items-center justify-center gap-2 my-auto">
                          {[1, 2, 3, 4].map((f) => (
                            <div
                              key={f}
                              className={`w-12 h-16 rounded border ${
                                f === 1
                                  ? 'border-red-500 bg-red-950/40 text-red-300'
                                  : 'border-white/10 bg-neutral-900 text-neutral-500'
                              } flex flex-col items-center justify-center text-[10px] font-mono p-1`}
                            >
                              <span>SHOT {f}</span>
                              <span className="text-[8px] text-emerald-400 mt-1">99.8%</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>Identity Anchor: LOCKED</span>
                          <span className="text-emerald-400">Physics Coherent</span>
                        </div>
                      </div>
                    )}

                    {item.interactiveType === 'canvas' && (
                      <div className="relative w-full h-full p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Users size={11} /> TEAM PRESENCE
                          </span>
                          <span>3 ACTIVE DIRECTORS</span>
                        </div>
                        <div className="relative w-full h-20 my-auto flex items-center justify-center">
                          <div className="w-48 h-10 border border-white/10 rounded-lg bg-neutral-900/80 flex items-center px-3 justify-between">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              <span className="text-[10px] font-mono text-white">Scene_04_Take3</span>
                            </div>
                            <span className="text-[9px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                              MERGED
                            </span>
                          </div>
                          {/* Floating cursor */}
                          <div className="absolute right-8 top-1 flex items-center gap-1 text-[9px] font-mono bg-red-500 text-white px-1.5 py-0.5 rounded shadow">
                            <span>Elena (Dir)</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>CRDT Sync: Active</span>
                          <span className="text-emerald-400">18ms Latency</span>
                        </div>
                      </div>
                    )}

                    {item.interactiveType === 'edge' && (
                      <div className="relative w-full h-full p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Cpu size={11} /> METAL / TENSOR-RT
                          </span>
                          <span>OFFLINE RUNTIME</span>
                        </div>
                        <div className="relative w-full h-20 my-auto flex flex-col items-center justify-center gap-1.5">
                          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                            <span>32.4</span>
                            <span className="text-xs font-normal text-red-400">TOKENS/SEC</span>
                          </div>
                          <div className="w-44 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full w-3/4" />
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500">Unified Memory: 14.2 GB / 64 GB</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>Air-Gapped Privacy</span>
                          <span className="text-emerald-400">0 KB Upload</span>
                        </div>
                      </div>
                    )}

                    {item.interactiveType === 'haptic' && (
                      <div className="relative w-full h-full p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Sliders size={11} /> TACTILE WHEEL
                          </span>
                          <span>USB-C HID</span>
                        </div>
                        <div className="relative w-full h-20 my-auto flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-500/40 flex items-center justify-center bg-neutral-900 group-hover:rotate-45 transition-transform duration-700">
                            <div className="w-12 h-12 rounded-full border border-red-400 bg-red-950/40 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                          <span>Step: 0.01 Frame</span>
                          <span className="text-red-400">Magnetic Detents</span>
                        </div>
                      </div>
                    )}

                    {/* Concept Badge Tag */}
                    <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                      Concept Prototype · {item.previewBadge}
                    </div>

                    {isFeatured && (
                      <div className="absolute right-3 top-3 rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-red-400">
                        FEATURED CONCEPT
                      </div>
                    )}
                  </div>

                  {/* Category and Status Bar */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-0.5 text-[10px] uppercase tracking-wider text-neutral-300 font-mono">
                      {item.category}
                    </span>

                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider font-mono ${
                        item.status === 'In Development'
                          ? 'text-red-400'
                          : item.status === 'Coming Soon'
                          ? 'text-amber-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-semibold text-white tracking-tight group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs font-mono text-neutral-400 tracking-wide">
                    {item.tagline}
                  </p>

                  <p className="mt-2.5 text-sm leading-6 text-neutral-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Explore Concept CTA */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-red-400 cursor-pointer focus:outline-none focus-visible:underline"
                    aria-haspopup="dialog"
                  >
                    <span>Explore concept preview</span>
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>

                  <span className="text-[11px] font-mono text-neutral-600">
                    {item.codename}
                  </span>
                </div>

                {/* Hairline top crimson gradient accent on hover */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </article>
            );
          })}
        </div>

        {/* Section Footnote */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-neutral-500 font-mono">
            The next chapter of VIZRA is taking shape. All concept previews represent approved product architecture.
          </p>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <LockKeyhole size={13} className="text-red-500" />
            <span>Future releases & private studio roadmap</span>
          </div>
        </div>
      </div>

      {/* 21st.dev Style Interactive Concept Preview Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
            role="presentation"
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-desc"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#141414] p-6 sm:p-8 shadow-2xl text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close preview modal"
                className="absolute right-5 top-5 p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Status and Category header */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-red-500">
                  {selectedItem.status}
                </span>
                <span className="text-neutral-600 font-mono">·</span>
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                  {selectedItem.category}
                </span>
                <span className="text-neutral-600 font-mono">·</span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {selectedItem.codename}
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 id="modal-title" className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                {selectedItem.title}
              </h3>
              <p className="mt-1 text-sm font-mono text-red-400/90">
                {selectedItem.tagline}
              </p>

              {/* Main Detailed Description */}
              <p id="modal-desc" className="mt-4 text-sm leading-relaxed text-neutral-300">
                {selectedItem.details}
              </p>

              {/* Technical Specifications Bento Grid inside Modal */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Activity size={13} className="text-red-500" />
                  <span>Target Architecture & Engineering Benchmarks</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {selectedItem.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-neutral-900/80 border border-white/[0.07] flex flex-col justify-between"
                    >
                      <span className="text-[10px] text-neutral-500 uppercase">{spec.label}</span>
                      <span className="text-white font-medium mt-1">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Milestones */}
              <div className="mt-6 space-y-2.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Clock size={13} className="text-red-500" />
                  <span>Development Roadmap Progress</span>
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {selectedItem.technicalMilestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-neutral-900/50 border border-white/[0.05] flex items-center gap-2 text-neutral-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Interest Notification Form */}
              <div className="mt-8 rounded-xl border border-red-500/20 bg-red-950/15 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Radio size={13} className="text-red-400 animate-pulse" />
                    <span>Private Beta Access for {selectedItem.title}</span>
                  </div>
                  {subscribedItemIds.includes(selectedItem.id) && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> Registered
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  Join the private testing cohort for this feature. We will notify you when sandbox access opens.
                </p>

                {subscribeSuccess || subscribedItemIds.includes(selectedItem.id) ? (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>You're on the list. We'll send the sandbox invitation to your email.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNotifySubmit} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter studio email..."
                      value={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-neutral-900/90 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                    />
                    <button
                      type="submit"
                      disabled={submittingEmail}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0 font-mono"
                    >
                      {submittingEmail ? 'Registering...' : 'Request Access'}
                    </button>
                  </form>
                )}
              </div>

              {/* Modal Footer Note */}
              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>VIZRA Architecture Advisory</span>
                <span>Availability may evolve during R&D</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VizraComingSoon;
