interface ToolAnnotations {
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
  openWorldHint?: boolean
}

interface WebMCPToolDescriptor {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: ToolAnnotations
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>
}

interface ModelContext {
  registerTool: (
    descriptor: WebMCPToolDescriptor,
    options: { signal: AbortSignal },
  ) => void
}

interface PromptLanguageModelSession {
  prompt: (input: string) => Promise<string>
  destroy?: () => void
}

interface LanguageModelFactory {
  availability?: () => Promise<string>
  create: (options?: {
    initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  }) => Promise<PromptLanguageModelSession>
}

interface Document {
  modelContext?: ModelContext
}

interface Navigator {
  modelContext?: ModelContext
}

interface Window {
  LanguageModel?: LanguageModelFactory
}
