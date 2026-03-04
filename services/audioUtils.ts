// Audio conversion utilities for Gemini Live API

export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function pcmToAudioBuffer(
  pcmData: ArrayBuffer, 
  audioContext: AudioContext, 
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const int16Array = new Int16Array(pcmData);
  const float32Array = new Float32Array(int16Array.length);
  
  for (let i = 0; i < int16Array.length; i++) {
    // Convert Int16 to Float32 (-1.0 to 1.0)
    float32Array[i] = int16Array[i] / 32768.0;
  }
  
  // Create buffer with the SOURCE sample rate (24000 for Gemini)
  // The AudioContext will handle playback at its own rate (e.g. 48000)
  const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);
  
  return audioBuffer;
}