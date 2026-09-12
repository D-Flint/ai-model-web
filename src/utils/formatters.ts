export function formatTokenContext(tokens: number | null | undefined): string {
  if (tokens == null || !Number.isFinite(tokens) || tokens <= 0) return '—';
  if (tokens >= 1_000_000)
    return `${Number((tokens / 1_000_000).toFixed(2))}M tokens`;
  if (tokens >= 1_000) return `${Number((tokens / 1_000).toFixed(1))}K tokens`;
  return `${tokens.toLocaleString('en-US')} tokens`;
}
