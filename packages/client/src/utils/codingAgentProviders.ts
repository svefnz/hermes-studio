const SCOPED_EXTERNAL_AGENT_AUTH_PROVIDERS = new Set([
  'openai-codex',
  'copilot',
  'xai-oauth',
  'qwen-oauth',
  'nous',
  'claude-oauth',
])

export function isAuthModelProvider(provider?: string): boolean {
  return SCOPED_EXTERNAL_AGENT_AUTH_PROVIDERS.has(String(provider || '').trim().toLowerCase())
}

export function canScopedCodingAgentUseProvider(
  _agentId: string,
  provider?: string,
): boolean {
  return !isAuthModelProvider(provider)
}

export function usesServerManagedProviderAuth(
  _agentId: string,
  _provider?: string,
): boolean {
  return false
}
