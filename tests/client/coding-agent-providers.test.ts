import { describe, expect, it } from 'vitest'
import {
  canScopedCodingAgentUseProvider,
  isAuthModelProvider,
  usesServerManagedProviderAuth,
} from '../../packages/client/src/utils/codingAgentProviders'

describe('coding agent provider visibility', () => {
  it.each(['nous', 'openai-codex', 'copilot', 'xai-oauth', 'qwen-oauth', 'claude-oauth'])(
    'identifies %s as an auth-model provider',
    (provider) => {
      expect(isAuthModelProvider(provider)).toBe(true)
    },
  )

  it('hides auth providers from scoped coding agent sessions', () => {
    expect(canScopedCodingAgentUseProvider('claude-code', 'openai-codex')).toBe(false)
    expect(canScopedCodingAgentUseProvider('codex', 'qwen-oauth')).toBe(false)
  })

  it('exposes non-auth providers to scoped coding agent sessions', () => {
    expect(canScopedCodingAgentUseProvider('claude-code', 'deepseek')).toBe(true)
    expect(canScopedCodingAgentUseProvider('codex', 'openai')).toBe(true)
  })

  it('server-managed provider auth is always disabled after ekko-agent removal', () => {
    expect(usesServerManagedProviderAuth('claude-code', 'openai-codex')).toBe(false)
    expect(usesServerManagedProviderAuth('codex', 'nous')).toBe(false)
  })
})
