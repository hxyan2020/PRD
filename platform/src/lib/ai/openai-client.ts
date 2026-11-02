/**
 * Backward-compatible re-exports. Prefer `@/lib/ai/llm-client` for new code.
 * ChatGPT / DeepSeek / Gemini / Claude are routed by CRMP_LLM_PROVIDER + keys.
 */
export {
  anyLlmKeyConfigured as openaiKeyConfigured,
  anyLlmKeyConfigured,
  chatCompletionJson,
  chatCompletionText,
  defaultOpenAiModel,
  getLlmStatus,
  hydrateLlmProviderFromSettings,
  listLlmProviders,
  llmEnrichmentEnabled,
  persistLlmProviderSetting,
  resolveLlmProvider,
  selectLlmProvider,
  setRuntimeLlmProvider,
  type LlmChatResult as OpenAiChatResult,
  type LlmProviderId,
  type LlmProviderInfo,
} from "@/lib/ai/llm-client";
