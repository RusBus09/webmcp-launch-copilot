import { useEffect, useMemo, useRef, useState } from 'react'

export interface WebMCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: ToolAnnotations
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>
}

export interface WebMCPStatus {
  isAvailable: boolean
  registeredTools: string[]
  lastInvocation: { name: string; at: Date } | null
}

export function useWebMCP(tools: WebMCPTool[]): WebMCPStatus {
  const [lastInvocation, setLastInvocation] = useState<WebMCPStatus['lastInvocation']>(null)
  const toolsRef = useRef(tools)
  const modelContext = document.modelContext ?? navigator.modelContext
  const isAvailable = Boolean(modelContext?.registerTool)

  useEffect(() => {
    toolsRef.current = tools
  }, [tools])

  const toolSignature = useMemo(
    () => tools.map((tool) => tool.name).join('|'),
    [tools],
  )

  useEffect(() => {
    const controller = new AbortController()

    if (!modelContext?.registerTool) {
      return () => controller.abort()
    }

    for (const tool of toolsRef.current) {
      modelContext.registerTool(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
          execute: async (input) => {
            setLastInvocation({ name: tool.name, at: new Date() })
            const currentTool = toolsRef.current.find((candidate) => candidate.name === tool.name)
            if (!currentTool) throw new Error(`WebMCP tool "${tool.name}" is no longer registered.`)
            return currentTool.execute(input)
          },
        },
        { signal: controller.signal },
      )
    }

    return () => controller.abort()
  }, [modelContext, toolSignature])

  return {
    isAvailable,
    registeredTools: isAvailable ? tools.map((tool) => tool.name) : [],
    lastInvocation,
  }
}
