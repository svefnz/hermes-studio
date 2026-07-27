/**
 * MCU prompts stub — removed with ESP32/MCU support.
 * Exists to satisfy imports in global-agent code.
 */

export const MCU_TTS_SAMPLE_RATE = 16000

type McuPromptId = string

export function mcuPromptText(_id: McuPromptId): string {
  return ''
}

export function mcuPromptFileName(_id: McuPromptId): string {
  return ''
}

export function mcuPromptUrl(_id: McuPromptId): string {
  return ''
}

export function isValidMcuAudioFileName(_file: string): boolean {
  return false
}

export async function resolveMcuAudioPath(_file: string): Promise<null> {
  return null
}
