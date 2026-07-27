/**
 * MCU speech segmenter stub — removed with ESP32/MCU support.
 * Exists to satisfy imports in global-agent code.
 */

export interface McuSpeechSegmenter {
  pushDelta: (delta: string) => string[]
  flush: () => string | null
  reset: () => void
}

export function createMcuSpeechSegmenter(): McuSpeechSegmenter {
  return {
    pushDelta: () => [],
    flush: () => null,
    reset: () => {},
  }
}

export function normalizeMcuSpeechText(text: string): string {
  return text
}
