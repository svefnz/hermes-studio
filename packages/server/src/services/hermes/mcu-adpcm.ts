/**
 * MCU ADPCM audio codec stub — removed with ESP32/MCU support.
 * Exists to satisfy imports in global-agent code.
 */

export function encodeMcuImaAdpcm(_audio: Buffer, _sampleRate: number): Buffer {
  return Buffer.alloc(0)
}

export function decodeMcuImaAdpcm(_data: Buffer): { sampleRate: number; channels: number; pcm: Buffer } {
  return { sampleRate: 16000, channels: 1, pcm: Buffer.alloc(0) }
}
