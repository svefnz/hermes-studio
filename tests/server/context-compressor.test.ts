import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getCompressionSnapshotMock = vi.fn()
const saveCompressionSnapshotMock = vi.fn()
const deleteCompressionSnapshotMock = vi.fn()
const bridgeRequestMock = vi.fn()
const bridgeDestroyMock = vi.fn()

vi.mock('../../packages/server/src/services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('../../packages/server/src/db/hermes/compression-snapshot', () => ({
  getCompressionSnapshot: getCompressionSnapshotMock,
  saveCompressionSnapshot: saveCompressionSnapshotMock,
  deleteCompressionSnapshot: deleteCompressionSnapshotMock,
}))

vi.mock('../../packages/server/src/services/hermes/agent-bridge', () => ({
  AgentBridgeClient: class {
    request = bridgeRequestMock
    destroy = bridgeDestroyMock
  },
}))

describe('ChatContextCompressor', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    getCompressionSnapshotMock.mockReset()
    saveCompressionSnapshotMock.mockReset()
    deleteCompressionSnapshotMock.mockReset()
    bridgeRequestMock.mockReset()
    bridgeDestroyMock.mockReset()
    bridgeRequestMock.mockRejectedValue(new Error('summarizer failed'))
    bridgeDestroyMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('uses the Hermes Agent Bridge for summarization', async () => {
    const { callSummarizer } = await import('../../packages/server/src/lib/context-compressor')
    bridgeRequestMock.mockResolvedValue({
      status: 'completed',
      result: { final_response: 'hermes summary' },
    })

    const result = await callSummarizer(
      '',
      undefined,
      'Summarize these turns.',
      [],
      12_000,
      undefined,
      { profile: 'work', model: 'summary-model', provider: 'openrouter' },
    )

    expect(result).toBe('hermes summary')
    expect(bridgeRequestMock).toHaveBeenCalledTimes(1)
    expect(bridgeDestroyMock).toHaveBeenCalledTimes(1)
  })

  it('handles bridge summarization failure', async () => {
    const { callSummarizer } = await import('../../packages/server/src/lib/context-compressor')
    bridgeRequestMock.mockRejectedValue(new Error('bridge unavailable'))

    await expect(callSummarizer(
      '',
      undefined,
      'Summarize these turns.',
      [],
      12_000,
      undefined,
      { profile: 'default', model: 'summary-model', provider: 'openrouter' },
    )).rejects.toThrow('bridge unavailable')

    expect(bridgeRequestMock).toHaveBeenCalledTimes(1)
  })

  it('keeps full history when full summarization fails', async () => {
    const { ChatContextCompressor } = await import('../../packages/server/src/lib/context-compressor')
    const compressor = new ChatContextCompressor({ config: { tailMessageCount: 3 } })
    const messages = Array.from({ length: 8 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`,
    }))

    getCompressionSnapshotMock.mockReturnValue(null)

    const result = await compressor.compress(messages, 'http://upstream', undefined, 's1')

    expect(result.messages).toHaveLength(messages.length)
    expect(result.messages.map(m => m.content)).toEqual(messages.map(m => m.content))
    expect(result.meta.compressed).toBe(false)
    expect(result.meta.llmCompressed).toBe(false)
    expect(saveCompressionSnapshotMock).not.toHaveBeenCalled()
  })

  it('triggers compression when messages exceed trigger tokens', async () => {
    const { ChatContextCompressor } = await import('../../packages/server/src/lib/context-compressor')
    const compressor = new ChatContextCompressor({ config: { triggerTokens: 10, tailMessageCount: 3 } })

    const longMessage = 'Hello world! '.repeat(50)
    const messages = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `${longMessage} idx=${i}`,
    }))

    getCompressionSnapshotMock.mockReturnValue(null)
    bridgeRequestMock.mockResolvedValue({
      status: 'completed',
      result: { final_response: 'compressed summary content' },
    })

    const result = await compressor.compress(messages, 'http://upstream', undefined, 's2')

    expect(result.meta.compressed).toBe(true)
    expect(result.meta.llmCompressed).toBe(true)

    const summaryMessage = result.messages[0]
    expect(summaryMessage.role).toBe('assistant')
    expect(summaryMessage.content).toBe('compressed summary content')

    const tailMessages = result.messages.slice(1)
    expect(tailMessages.length).toBeLessThanOrEqual(3)

    expect(saveCompressionSnapshotMock).toHaveBeenCalled()
  })

  it('does not compress when under trigger token threshold', async () => {
    const { ChatContextCompressor } = await import('../../packages/server/src/lib/context-compressor')
    const compressor = new ChatContextCompressor({ config: { triggerTokens: 100_000 } })

    const messages = Array.from({ length: 5 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `short message ${i}`,
    }))

    getCompressionSnapshotMock.mockReturnValue(null)

    const result = await compressor.compress(messages, 'http://upstream', undefined, 's3')

    expect(result.meta.compressed).toBe(false)
    expect(result.meta.llmCompressed).toBe(false)
    expect(result.messages.map(m => m.content)).toEqual(messages.map(m => m.content))
  })

  it('reuses existing compression snapshot when available', async () => {
    const { ChatContextCompressor } = await import('../../packages/server/src/lib/context-compressor')
    const compressor = new ChatContextCompressor({ config: { triggerTokens: 100_000, tailMessageCount: 3 } })

    const existingSummary = 'Previous compression summary content'
    getCompressionSnapshotMock.mockReturnValue({
      summary: existingSummary,
      lastMessageIndex: 5,
      summaryTokenEstimate: 50,
    })

    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message ${i}`,
    }))

    const result = await compressor.compress(messages, 'http://upstream', undefined, 's4')

    expect(result.messages[0].content).toContain(existingSummary)
    expect(result.meta.compressed).toBe(false)
    expect(result.meta.llmCompressed).toBe(false)
  })

  it('limits summarization calls to configured timeout', async () => {
    const { callSummarizer } = await import('../../packages/server/src/lib/context-compressor')
    bridgeRequestMock.mockImplementation(() => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('bridge timeout')), 500),
    ))

    const start = Date.now()
    await expect(callSummarizer(
      '',
      undefined,
      'test prompt',
      [],
      50,
      undefined,
      { profile: 'default' },
    )).rejects.toThrow()
    expect(Date.now() - start).toBeLessThan(3000)
  })

  it('produces same output for identical inputs with same snapshot', async () => {
    const { ChatContextCompressor } = await import('../../packages/server/src/lib/context-compressor')
    const compressor = new ChatContextCompressor({ config: { triggerTokens: 10 } })

    const longMessage = 'Test '.repeat(60)
    const messages = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `${longMessage} idx=${i}`,
    }))

    getCompressionSnapshotMock.mockReturnValue(null)
    bridgeRequestMock.mockResolvedValue({
      status: 'completed',
      result: { final_response: 'reproducible summary' },
    })

    const first = await compressor.compress(messages, 'http://upstream', undefined, 's6')
    getCompressionSnapshotMock.mockReturnValue({
      summary: 'reproducible summary',
      lastMessageIndex: 12,
      summaryTokenEstimate: 50,
    })

    const second = await compressor.compress(messages, 'http://upstream', undefined, 's6')

    expect(second.meta.compressed).toBe(false)
    expect(second.meta.llmCompressed).toBe(false)

    const summaryMessage = second.messages[0]
    expect(summaryMessage.content).toContain('reproducible summary')
  })

  it('builds correct full prompt structure', () => {
    const { buildFullPrompt } = require('../../packages/server/src/lib/context-compressor')
    const prompt = buildFullPrompt('content to summarize', 8000)

    expect(prompt).toContain('Create a structured handoff summary')
    expect(prompt).toContain('content to summarize')
    expect(prompt).toContain('## Active Task')
    expect(prompt).toContain('## Completed Actions')
    expect(prompt).toContain('Target ~8000 tokens')
  })

  it('builds correct incremental prompt structure', () => {
    const { buildIncrementalPrompt } = require('../../packages/server/src/lib/context-compressor')
    const prompt = buildIncrementalPrompt('previous summary', 'new content', 4000)

    expect(prompt).toContain('You are updating a context compaction summary')
    expect(prompt).toContain('previous summary')
    expect(prompt).toContain('new content')
    expect(prompt).toContain('Target ~4000 tokens')
  })

  it('serializes messages for summary with tool result truncation', async () => {
    const { serializeForSummary } = await import('../../packages/server/src/lib/context-compressor')

    const longResult = 'x'.repeat(5000)
    const messages = [
      { role: 'user', content: 'check status' },
      { role: 'assistant', content: 'running diagnostic', tool_calls: [{ id: 'tc1', type: 'function', function: { name: 'read_file', arguments: '{}' } }] },
      { role: 'tool', name: 'read_file', content: longResult },
      { role: 'assistant', content: 'done' },
    ]

    const serialized = serializeForSummary(messages as any)
    expect(serialized).toContain('check status')
    expect(serialized).toContain('running diagnostic')
    expect(serialized).toContain('[tool_call: read_file({})]')
    expect(serialized).toContain('[tool:read_file]')
    // Truncated tool result should be shorter than 5000
    const toolResultSection = serialized.split('[tool:read_file]')[1] || ''
    expect(toolResultSection.length).toBeLessThan(5000)
    expect(serialized.length).toBeLessThan(6000)
  })
