/**
 * Soften LLM / paste report text: drop common markdown chrome so operators
 * read plain structured prose instead of **, ##, backticks, etc.
 * Does NOT strip Chinese fullwidth brackets 【】 used in alert titles.
 */
export function stripMarkdownNoise(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/gm, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
