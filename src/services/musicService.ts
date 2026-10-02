import { GeneratedTrackResult, generateProceduralSoundtrack } from './proceduralAudio';

export interface GenerateMusicOptions {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  durationSeconds?: number;
  genre?: string;
  imageFile?: File | null;
}

/**
 * Converts a browser File into base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * High-level Music Generation Service
 * Calls server endpoint /api/music/generate powered by Lyria models (lyria-3-clip-preview / lyria-3-pro-preview),
 * and transparently falls back to procedural audio synthesis if network or server is offline.
 */
export async function generateMusicTrack(options: GenerateMusicOptions): Promise<GeneratedTrackResult> {
  const {
    prompt,
    model = 'lyria-3-clip-preview',
    durationSeconds = 25,
    genre = 'Cinematic Ambient',
    imageFile,
  } = options;

  let imageBase64: string | undefined = undefined;
  let imageMimeType: string | undefined = undefined;

  if (imageFile) {
    try {
      imageBase64 = await fileToBase64(imageFile);
      imageMimeType = imageFile.type || 'image/jpeg';
    } catch (e) {
      console.warn('Could not read image file for music generation:', e);
    }
  }

  try {
    const response = await fetch('/api/music/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        durationSeconds,
        genre,
        imageBase64,
        imageMimeType,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.audioBase64) {
        // Decode base64 audio into a playable Blob URL
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);

        return {
          id: data.id || 'lyria_' + Date.now().toString(36),
          title: data.title || prompt.slice(0, 30),
          genre: data.genre || genre,
          prompt,
          model,
          durationSeconds: data.durationSeconds || durationSeconds,
          audioUrl,
          bpm: 96,
          key: 'D Minor',
          createdAt: Date.now(),
          lyrics: data.lyrics,
          isAiGenerated: true,
        };
      }
    }
  } catch (err) {
    console.warn('Server Lyria API error, switching to procedural synthesis:', err);
  }

  // Graceful fallback to browser-synthesized audio
  return generateProceduralSoundtrack(prompt, durationSeconds, genre);
}
