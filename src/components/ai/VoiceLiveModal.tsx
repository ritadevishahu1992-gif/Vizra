import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, X, AlertCircle, Lock, LogIn } from 'lucide-react';
import { VizraLogo } from '../VizraLogo';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';

interface VoiceLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceLiveModal: React.FC<VoiceLiveModalProps> = ({ isOpen, onClose }) => {
  const { user, openLoginModal } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Live Session...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const startLiveSession = useCallback(async () => {
    cleanupAudio();
    setErrorMessage(null);
    setIsAuthRequired(false);

    const currentUser = auth?.currentUser;
    if (!user || !currentUser) {
      setIsAuthRequired(true);
      setStatusText('Sign in required for Live Voice');
      setErrorMessage(
        'Omnia Live Voice requires an authenticated VIZRA account so sessions are authorized and rate-protected.'
      );
      return;
    }

    setStatusText('Requesting authorized Live Voice ticket...');

    try {
      const idToken = await currentUser.getIdToken();
      const ticketRes = await fetch('/api/live/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const ticketData = await ticketRes.json().catch(() => ({}));

      if (!ticketRes.ok || !ticketData?.ticket) {
        if (ticketRes.status === 401) {
          setIsAuthRequired(true);
        }
        setStatusText('Live Voice authorization rejected');
        setErrorMessage(
          ticketData?.error?.message ||
            'Unable to issue an authorized Live Voice session ticket. Please retry or sign in again.'
        );
        return;
      }

      // 1. Request microphone access after server ticket authorization succeeds
      setStatusText('Requesting microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // 2. Setup AudioContexts (16kHz input, 24kHz output for Gemini Live API)
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      // 3. Connect WebSocket to /live with single-use authorized ticket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?ticket=${encodeURIComponent(ticketData.ticket)}`;
      setStatusText('Connecting to gemini-3.8-live...');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText('Live Voice Session Connected (gemini-3.8-live)');

        // Pipe microphone audio into WebSocket
        if (inputAudioCtxRef.current && streamRef.current) {
          const source = inputAudioCtxRef.current.createMediaStreamSource(streamRef.current);
          const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const channelData = e.inputBuffer.getChannelData(0);
              const pcm16 = floatTo16BitPCM(channelData);
              const base64 = arrayBufferToBase64(pcm16);
              ws.send(JSON.stringify({ audio: base64, mimeType: 'audio/pcm;rate=16000' }));
            }
          };

          source.connect(processor);
          processor.connect(inputAudioCtxRef.current.destination);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMessage(msg.error);
            setStatusText('Connection notice');
          }
          if (msg.audio) {
            setIsSpeaking(true);
            playAudioChunk(outputAudioCtxRef.current, msg.audio, () => {
              setIsSpeaking(false);
            });
          }
          if (msg.interrupted) {
            setIsSpeaking(false);
          }
        } catch (e) {
          console.error('Error processing live audio response:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket live error:', err);
        setErrorMessage('Could not establish real-time socket with gemini-3.8-live.');
        setStatusText('Live connection unavailable');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (event.code === 1008 || event.code === 4401) {
          setStatusText('Session closed by safety/auth policy');
          if (event.reason) {
            setErrorMessage(event.reason);
          }
        }
      };
    } catch (err: any) {
      console.warn('Microphone or Live API error:', err);
      setErrorMessage(
        err.message ||
          'Microphone access denied. Please grant microphone permission to use voice conversation.'
      );
      setStatusText('Microphone permission or session setup failed');
    }
  }, [cleanupAudio, user]);

  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
      return;
    }

    startLiveSession();

    return () => {
      cleanupAudio();
    };
  }, [isOpen, startLiveSession, cleanupAudio]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function playAudioChunk(
    audioCtx: AudioContext | null,
    base64Audio: string,
    onFinish?: () => void
  ) {
    if (!audioCtx) return;
    try {
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM (24kHz) to Float32Array
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioCtx.destination);
      sourceNode.onended = () => {
        if (onFinish) onFinish();
      };
      sourceNode.start();
    } catch (e) {
      console.error('Failed to decode raw PCM live chunk:', e);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="relative w-full max-w-md bg-[#0a0a0a] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl text-white flex flex-col items-center text-center overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-live-title"
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#eb3b2d]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          aria-label="Close voice modal"
        >
          <X size={18} />
        </button>

        {/* Brand Lockup */}
        <div className="mb-4">
          <VizraLogo size={32} />
        </div>

        <h2
          id="voice-live-title"
          className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1"
        >
          Omnia Live Voice
        </h2>
        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 mb-6">
          Model: gemini-3.8-live (Authenticated Session)
        </span>

        {/* Kinetic Orb Animation */}
        <div className="relative w-36 h-36 flex items-center justify-center my-4">
          <div
            className={`absolute inset-0 rounded-full border border-[#eb3b2d]/30 transition-all duration-300 ${
              isSpeaking || isConnected ? 'scale-110 animate-ping opacity-25' : 'opacity-10'
            }`}
          />
          <div
            className={`absolute inset-2 rounded-full border border-white/20 transition-all duration-300 ${
              isSpeaking ? 'scale-105 animate-pulse' : ''
            }`}
          />

          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isSpeaking
                ? 'bg-[#eb3b2d] shadow-[#eb3b2d]/50 scale-105'
                : isConnected
                ? 'bg-neutral-900 border border-neutral-700 text-[#eb3b2d]'
                : 'bg-neutral-950 border border-neutral-800 text-neutral-500'
            }`}
          >
            {isAuthRequired ? (
              <Lock size={30} className="text-amber-400" />
            ) : isSpeaking ? (
              <Volume2 size={36} className="text-white animate-bounce" />
            ) : isConnected ? (
              <Mic size={36} className="text-[#eb3b2d] animate-pulse" />
            ) : (
              <MicOff size={32} />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-4 mb-2">
          <p className="text-sm font-medium text-white">{statusText}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {isAuthRequired
              ? 'Sign in with Google or your VIZRA email account to authorize real-time voice audio.'
              : isConnected
              ? isSpeaking
                ? 'Omnia is speaking...'
                : 'Listening to your voice in real time... Speak naturally.'
              : 'Authorizing authenticated WebSocket session to Gemini Live API.'}
          </p>
        </div>

        {/* Error Callout */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-200 text-left flex items-start gap-2 w-full">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 w-full flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>End Session</span>
          </button>

          {isAuthRequired ? (
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#eb3b2d] text-white text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          ) : !isConnected ? (
            <button
              type="button"
              onClick={startLiveSession}
              className="flex-1 py-3 px-4 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Reconnect
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
