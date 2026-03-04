import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer, pcmToAudioBuffer } from './audioUtils';
import { CONFIG, COACHES, DRILLS, FAQ_ITEMS } from '../data/stageConfig';

export type UserPersona = 'parent' | 'player';

class GeminiLiveService {
  private client: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;
  private stream: MediaStream | null = null;
  
  // Callback for UI visualizer
  private onVolumeCallback: ((vol: number) => void) | null = null;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSystemInstruction(persona: UserPersona): string {
    // Construction dynamique du contexte pour la voix
    const drillsContext = DRILLS.map(d => `- ${d.title}: ${d.description}`).join('\n');
    const staffContext = COACHES.map(c => `- ${c.name} (${c.role})`).join('\n');

    return `
      IDENTITÉ:
      Tu es "Botler", l'assistant vocal du Grind Camp.
      
      LANGUE: FRANÇAIS UNIQUEMENT. Langage naturel, fluide, dynamique.

      TES CONNAISSANCES:
      - Stage: THE GRIND CAMP à Pernes-les-Fontaines (84).
      - Dates: 3 au 7 août 2026.
      - Prix: 240€ Tout inclus (Repas midi, Tenue, T-shirt, Sortie Wave Island).
      - Focus Basket: Handle (dextérité) et Finition (proche du cercle). On bosse dur ("Grind").
      - Staff: ${staffContext}.
      - Drills exemples: ${drillsContext}.
      - Wave Island: C'est la sortie détente offerte le mercredi après-midi.
      - Horaires: 9h-17h.

      RÈGLES D'INTERACTION:
      1. Tu réponds DIRECTEMENT aux questions sur le programme, les repas, les horaires ou le prix. Ne renvoie pas vers Pascal pour ça.
      2. Si on te demande "qu'est-ce qu'on mange", dis que c'est un repas sportif traiteur inclus, sans donner le menu précis.
  3. Si on te demande "c'est dur ?", dis que c'est intensif mais adapté aux motivés (U11 à U18).
      4. Renvoie vers Pascal (07 66 82 23 22) SEULEMENT pour les problèmes administratifs complexes (paiement partiel, blessure grave avant stage).

      ADAPTATION AU PERSONA:
      ${persona === 'parent' 
        ? "INTERLOCUTEUR : PARENT. Sois pro, rassurant, clair sur la logistique." 
        : "INTERLOCUTEUR : JOUEUR. Sois énergique, parle de progression, de 'skills', tutoie."}
    `;
  }

  // Calculate generic volume for UI visualization (0 to 100)
  private calculateVolume(inputData: Float32Array): number {
    let sum = 0;
    // Inspect fewer samples for performance
    for (let i = 0; i < inputData.length; i += 4) {
      sum += Math.abs(inputData[i]);
    }
    const average = sum / (inputData.length / 4);
    // Amplify slightly for better visuals
    return Math.min(100, average * 500); 
  }

  async connect(
    persona: UserPersona, 
    onStatusChange: (status: string) => void,
    onVolume: (vol: number) => void
  ) {
    if (this.isConnected) return;

    console.log(`[GeminiLive] Connecting with persona: ${persona}`);
    this.onVolumeCallback = onVolume;

    try {
      onStatusChange('connection');
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.nextStartTime = this.audioContext.currentTime;
      
      // CONFIGURATION AUDIO AVANCÉE POUR ÉVITER L'ÉCHO
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, 
          // Ces paramètres sont cruciaux pour une conversation fluide sans écho
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Force standard rate if supported
        }
      });

      // Selection de la voix : Puck est souvent plus stable que Fenrir pour les voix masculines en preview
      const voiceName = persona === 'player' ? 'Puck' : 'Kore';

      // Strict sessionPromise pattern to ensure connection is ready before use
      this.sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          systemInstruction: this.getSystemInstruction(persona),
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
          }
        },
        callbacks: {
          onopen: () => {
            console.log('[GeminiLive] Session opened');
            this.isConnected = true;
            onStatusChange('active');
            // Only start audio input when the connection is confirmed open
            this.startAudioInput(this.stream!);
          },
          onmessage: async (msg: LiveServerMessage) => {
            await this.handleServerMessage(msg);
          },
          onclose: () => {
            console.log('[GeminiLive] Session closed');
            this.isConnected = false;
            onStatusChange('disconnected');
            this.cleanup();
          },
          onerror: (err) => {
            console.error('[GeminiLive] Error:', err);
            onStatusChange('error');
            this.cleanup();
          }
        }
      });
      
      // Wait for session to be fully established to catch immediate errors (like Deadline Exceeded)
      await this.sessionPromise;
      
    } catch (error) {
      console.error('[GeminiLive] Connection failed', error);
      onStatusChange('error');
      this.cleanup();
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.audioContext) return;
    
    // Create a specific context for input to ensure 16kHz if possible
    const inputContext = new AudioContext({ sampleRate: 16000 });
    const source = inputContext.createMediaStreamSource(stream);
    
    // Buffer size 2048 provides good balance of latency vs stability
    this.processor = inputContext.createScriptProcessor(2048, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      // Basic check, but rely on sessionPromise mainly
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // 1. Calculate Volume for UI (Visual Feedback)
      const vol = this.calculateVolume(inputData);
      if (this.onVolumeCallback) {
        this.onVolumeCallback(vol);
      }

      // 2. Send Audio to Gemini
      const pcm16 = floatTo16BitPCM(inputData);
      const base64Audio = arrayBufferToBase64(pcm16);
      
      // CRITICAL: Always use sessionPromise to avoid race conditions
      if (this.sessionPromise) {
        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }
          });
        }).catch(err => {
          // Prevent unhandled promise rejections during teardown
          // console.debug('Session not ready or closed', err);
        });
      }
    };

    source.connect(this.processor);
    this.processor.connect(inputContext.destination);
    this.inputSource = source;
  }

  private async handleServerMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;
    
    // Handle Interruption
    if (serverContent?.interrupted) {
      if (this.currentSource) {
        try { this.currentSource.stop(); } catch (e) {}
        this.currentSource = null;
      }
      this.nextStartTime = this.audioContext?.currentTime || 0;
      return;
    }

    // Handle Audio
    const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.audioContext) {
      const pcmBuffer = base64ToArrayBuffer(audioData);
      const audioBuffer = await pcmToAudioBuffer(pcmBuffer, this.audioContext, 24000);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.currentSource = source;
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
      };

      const currentTime = this.audioContext.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
    }
  }

  disconnect() {
    // Try to close session gracefully
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        try { session.close(); } catch (e) { /* ignore */ }
      }).catch(() => {});
    }
    this.cleanup();
  }

  private cleanup() {
    this.isConnected = false;
    this.onVolumeCallback = null;
    this.sessionPromise = null;
    
    if (this.currentSource) {
        try { this.currentSource.stop(); } catch(e) {}
        this.currentSource = null;
    }

    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch(e) {}
      this.audioContext = null;
    }
    
    this.nextStartTime = 0;
  }
}

export const geminiLiveService = new GeminiLiveService();