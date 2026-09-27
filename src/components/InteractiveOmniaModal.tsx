import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, RefreshCw, Layers, Sliders, Play, Pause, ChevronRight } from 'lucide-react';
import { VizraLogo } from './VizraLogo';

interface Message {
  id: string;
  sender: 'user' | 'vizra';
  text: string;
  timestamp: string;
  actionSnippet?: string;
}

interface InteractiveOmniaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveOmniaModal: React.FC<InteractiveOmniaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'vizra',
      text: "Welcome to Omnia 1.0. I'm Vizra AI, your creative intelligence assistant. How can I help you create today?",
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // AI response generator matching strict Vizra AI personality
    setTimeout(() => {
      let responseText = '';
      let snippet: string | undefined = undefined;

      const lower = query.toLowerCase();

      if (lower.includes('are you an ai') || lower === 'are you an ai?') {
        responseText = "Yes, I'm an AI assistant built into Vizra. How can I help?";
      } else if (lower.includes('who made you') || lower.includes('what are you')) {
        responseText = "I'm Vizra AI, an AI assistant built into the Vizra platform designed to assist creators, animators, and designers with creative workflows.";
      } else if (lower.includes('kinetic typography') || lower.includes('typography')) {
        responseText = "Here is a kinetic typography curve configuration for Omnia 1.0 with procedural velocity damping:";
        snippet = `const kineticType = vizra.typography({\n  font: "Instrument Serif",\n  style: "italic",\n  interpolation: "cubic-bezier(0.16, 1, 0.3, 1)",\n  motionBlur: 0.35,\n  fps: 60\n});`;
      } else if (lower.includes('motion') || lower.includes('animation') || lower.includes('ribbon')) {
        responseText = "Synthesizing a 60fps dark procedural ribbon motion path with razor-thin crimson refraction lines:";
        snippet = `const ribbonMesh = vizra.motion.ribbon({\n  segments: 120,\n  fluidity: 0.85,\n  accentColor: "hsl(4, 78%, 52%)",\n  volumetricDepth: true\n});`;
      } else if (lower.includes('shader') || lower.includes('glsl') || lower.includes('code')) {
        responseText = "Here is an obsidian-grade GLSL procedural fragment kernel for your creative shader pipeline:";
        snippet = `// Omnia 1.0 Procedural Void Shader\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n  float dist = length(uv);\n  vec3 col = mix(vec3(0.0), vec3(0.92, 0.23, 0.17), smoothstep(0.4, 0.42, dist));\n  fragColor = vec4(col, 1.0);\n}`;
      } else {
        responseText = `I've mapped "${query}" into an Omnia 1.0 creative generation pass. You can export this directly into your motion timeline or tweak parameters.`;
        snippet = `omnia.createExperience({\n  prompt: "${query}",\n  aesthetic: "obsidian-minimal",\n  accent: "crimson-active"\n});`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'vizra',
          text: responseText,
          timestamp: 'Just now',
          actionSnippet: snippet,
        },
      ]);
      setIsProcessing(false);
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl h-[85vh] max-h-[720px] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white relative"
      >
        {/* Modal Topbar */}
        <div className="px-6 py-4 border-b border-neutral-900 bg-black/70 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <VizraLogo size={20} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">
                  Omnia 1.0
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  Interactive Console
                </span>
              </div>
              <span className="text-xs text-neutral-500 block">
                Vizra AI Creative Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse" />
            <span className="text-xs font-mono text-neutral-400 mr-3 hidden sm:inline">Active</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Prompt Presets */}
        <div className="px-6 py-2.5 bg-neutral-950 border-b border-neutral-900/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-neutral-500 text-[11px] shrink-0 font-medium">Try:</span>
          {[
            'Are you an AI?',
            'Generate 60fps kinetic typography',
            'Synthesize obsidian fluid ribbon',
            'Create GLSL procedural shader',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleSendMessage(promptText)}
              className="px-3 py-1 rounded-md bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[11px] whitespace-nowrap transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'bg-neutral-900/60 text-neutral-200 border border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-neutral-500 font-mono">
                  <span>{msg.sender === 'user' ? 'Creator' : 'Vizra AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.actionSnippet && (
                  <div className="mt-3 rounded-lg bg-black/80 border border-neutral-800 p-3 font-mono text-xs text-neutral-300">
                    <pre className="overflow-x-auto leading-5 text-[11px]">
                      <code>{msg.actionSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-ping" />
              <span>Omnia 1.0 is synthesizing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Input Form */}
        <div className="p-4 border-t border-neutral-900 bg-black/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Vizra AI or describe a creative animation..."
              className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-neutral-700 focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="p-3 rounded-xl bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Send prompt"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
