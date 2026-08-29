import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import type { WebMCPTool } from '../tools/useWebMCP'

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type DraftStatus = 'draft' | 'awaiting_confirmation' | 'sent'

export interface LaunchTask {
  id: string
  title: string
  category: string
  status: TaskStatus
  dueLabel: string
}

export interface OutreachDraft {
  id: string
  gameTitle: string
  recipientName: string
  angle: string
  subject: string
  body: string
  status: DraftStatus
  createdAt: string
}

interface SteamScoreItem {
  label: string
  value: string
  score: number
  max: number
  passed: boolean
}

export interface SteamAnalysis {
  appId: string
  gameName: string
  totalScore: number
  analyzedAt: string
  items: SteamScoreItem[]
  recommendations: string[]
}

const initialTasks: LaunchTask[] = [
  { id: 'steam-assets', title: 'Lock Steam capsule artwork', category: 'Store', status: 'done', dueLabel: 'Complete' },
  { id: 'store-copy', title: 'Finalize store page copy', category: 'Store', status: 'in-progress', dueLabel: 'Today' },
  { id: 'press-list', title: 'Qualify press outreach list', category: 'PR', status: 'todo', dueLabel: '2 days' },
  { id: 'review-keys', title: 'Prepare reviewer key batch', category: 'PR', status: 'todo', dueLabel: '3 days' },
  { id: 'launch-build', title: 'Upload release candidate build', category: 'Build', status: 'todo', dueLabel: '5 days' },
  { id: 'community-posts', title: 'Schedule community launch posts', category: 'Social', status: 'todo', dueLabel: '6 days' },
]

const initialDrafts: OutreachDraft[] = [
  {
    id: 'draft-preview-1',
    gameTitle: 'Signal Lost',
    recipientName: 'Mara',
    angle: 'A solo-built signal-hunting roguelite where every transmission changes the map.',
    subject: 'Preview opportunity: Signal Lost turns radio noise into a roguelite map',
    body: 'Hi Mara,\n\nI thought Signal Lost may fit your coverage of unusual systems-driven indies. It is a solo-built signal-hunting roguelite where every transmission changes the map, forcing players to decide which voices are safe to follow.\n\nIf that sounds relevant, I would be glad to share a preview key and a short fact sheet. No deadline or embargo pressure.\n\nBest,\nThe Signal Lost team',
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
]

function parseAppId(value: string): string {
  const directId = value.trim().match(/^\d+$/)?.[0]
  const urlId = value.match(/\/app\/(\d+)/i)?.[1]
  const appId = directId ?? urlId
  if (!appId) throw new Error('Enter a numeric Steam app ID or a Steam store app URL.')
  return appId
}

async function fetchSteamDetails(appId: string) {
  const endpoint = `https://store.steampowered.com/api/appdetails?appids=${appId}`
  let response: Response
  try {
    response = await fetch(endpoint)
    if (!response.ok) throw new Error(`Steam returned ${response.status}`)
  } catch {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(endpoint)}`
    response = await fetch(proxyUrl)
    if (!response.ok) throw new Error('Steam and the fallback proxy are unavailable.')
  }

  const payload = await response.json() as Record<string, { success: boolean; data?: Record<string, unknown> }>
  const result = payload[appId]
  if (!result?.success || !result.data) throw new Error('Steam could not find a public app page for that ID.')
  return result.data
}

function smartOutreachTemplate(gameTitle: string, angle: string, recipientName: string) {
  const firstName = recipientName.trim() || 'there'
  return {
    subject: `Story idea: ${gameTitle} and ${angle.replace(/[.!?]+$/, '').slice(0, 72)}`,
    body: `Hi ${firstName},\n\nI am reaching out because ${gameTitle} may be a fit for your audience. ${angle.trim()}\n\nI can share a preview key, clean screenshots, and a concise fact sheet if the story is relevant to your coverage. There is no obligation, and I am happy to work around your schedule.\n\nWould you like me to send the press kit?\n\nBest,\nThe ${gameTitle} team`,
  }
}

export function useLaunchCopilot() {
  const [tasks, setTasks] = useState(initialTasks)
  const [drafts, setDrafts] = useState(initialDrafts)
  const [steamAnalysis, setSteamAnalysis] = useState<SteamAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [pendingConfirmationId, setPendingConfirmationId] = useState<string | null>(null)

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    if (!['in-progress', 'done'].includes(status)) throw new Error('Status must be in-progress or done.')
    let updatedTask: LaunchTask | undefined
    flushSync(() => {
      setTasks((current) => current.map((task) => {
        if (task.id !== taskId) return task
        updatedTask = { ...task, status }
        return updatedTask
      }))
    })
    if (!updatedTask) throw new Error(`No launch task found with ID "${taskId}".`)
    return { updated: true, task: updatedTask }
  }, [])

  const analyzeSteamPage = useCallback(async (appIdOrUrl: string) => {
    const appId = parseAppId(appIdOrUrl)
    setIsAnalyzing(true)
    try {
      const data = await fetchSteamDetails(appId)
      const description = String(data.short_description ?? '')
      const screenshots = Array.isArray(data.screenshots) ? data.screenshots.length : 0
      const trailers = Array.isArray(data.movies) ? data.movies.length : 0
      const priceOverview = data.price_overview as { final_formatted?: string } | undefined
      const releaseDate = data.release_date as { date?: string; coming_soon?: boolean } | undefined
      const hasAssets = Boolean(data.header_image && data.capsule_image)
      const items: SteamScoreItem[] = [
        { label: 'Store assets', value: hasAssets ? 'Header + capsule found' : 'Core art missing', score: hasAssets ? 20 : 0, max: 20, passed: hasAssets },
        { label: 'Description', value: `${description.length} characters`, score: description.length >= 180 ? 20 : description.length >= 100 ? 12 : 4, max: 20, passed: description.length >= 180 },
        { label: 'Screenshots', value: `${screenshots} published`, score: Math.min(20, screenshots * 4), max: 20, passed: screenshots >= 5 },
        { label: 'Trailer', value: trailers ? `${trailers} published` : 'None found', score: trailers ? 15 : 0, max: 15, passed: trailers > 0 },
        { label: 'Price', value: priceOverview?.final_formatted ?? (data.is_free ? 'Free to play' : 'Not set'), score: priceOverview || data.is_free ? 15 : 0, max: 15, passed: Boolean(priceOverview || data.is_free) },
        { label: 'Release date', value: releaseDate?.date || 'Not announced', score: releaseDate?.date ? 10 : 0, max: 10, passed: Boolean(releaseDate?.date) },
      ]
      const recommendations = items
        .filter((item) => !item.passed)
        .map((item) => `Improve ${item.label.toLowerCase()}: ${item.value.toLowerCase()}.`)
      const analysis: SteamAnalysis = {
        appId,
        gameName: String(data.name ?? `Steam app ${appId}`),
        totalScore: items.reduce((sum, item) => sum + item.score, 0),
        analyzedAt: new Date().toISOString(),
        items,
        recommendations,
      }
      flushSync(() => setSteamAnalysis(analysis))
      return analysis
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const draftPressOutreach = useCallback(async (gameTitle: string, angle: string, recipientName: string) => {
    if (!gameTitle.trim() || !angle.trim() || !recipientName.trim()) {
      throw new Error('Game title, angle, and recipient name are required.')
    }

    let content = smartOutreachTemplate(gameTitle, angle, recipientName)
    const languageModel = window.LanguageModel
    if (languageModel) {
      try {
        const availability = await languageModel.availability?.()
        if (!availability || !['unavailable', 'no'].includes(availability)) {
          const session = await languageModel.create({
            initialPrompts: [{
              role: 'system',
              content: 'Draft concise, specific indie-game press outreach. Never invent claims. Return JSON with subject and body fields only.',
            }],
          })
          const response = await session.prompt(
            `Game: ${gameTitle}\nRecipient: ${recipientName}\nCoverage angle: ${angle}\nKeep the email under 170 words and make the ask low pressure.`,
          )
          session.destroy?.()
          const cleaned = response.replace(/^```json\s*|\s*```$/g, '')
          const parsed = JSON.parse(cleaned) as { subject?: string; body?: string }
          if (parsed.subject && parsed.body) content = { subject: parsed.subject, body: parsed.body }
        }
      } catch {
        // The deterministic template is intentionally retained when the local model is unavailable or malformed.
      }
    }

    const draft: OutreachDraft = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      gameTitle: gameTitle.trim(),
      recipientName: recipientName.trim(),
      angle: angle.trim(),
      subject: content.subject,
      body: content.body,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    flushSync(() => setDrafts((current) => [draft, ...current]))
    return draft
  }, [])

  const requestSendConfirmation = useCallback((draftId: string) => {
    let found = false
    flushSync(() => {
      setDrafts((current) => current.map((draft) => {
        if (draft.id !== draftId) return draft
        if (draft.status === 'sent') throw new Error('This draft has already been sent.')
        found = true
        return { ...draft, status: 'awaiting_confirmation' }
      }))
      setPendingConfirmationId(draftId)
    })
    if (!found) throw new Error(`No outreach draft found with ID "${draftId}".`)
    return {
      status: 'awaiting_confirmation',
      draftId,
      message: 'Human confirmation is required. The confirmation modal is open in the Launch Copilot UI; the agent cannot complete this action.',
    }
  }, [])

  const cancelSendConfirmation = useCallback(() => {
    if (!pendingConfirmationId) return
    const draftId = pendingConfirmationId
    flushSync(() => {
      setDrafts((current) => current.map((draft) => draft.id === draftId ? { ...draft, status: 'draft' } : draft))
      setPendingConfirmationId(null)
    })
  }, [pendingConfirmationId])

  const confirmSendDraft = useCallback(() => {
    if (!pendingConfirmationId) return
    const draftId = pendingConfirmationId
    flushSync(() => {
      setDrafts((current) => current.map((draft) => draft.id === draftId ? { ...draft, status: 'sent' } : draft))
      setPendingConfirmationId(null)
    })
  }, [pendingConfirmationId])

  const tools = useMemo<WebMCPTool[]>(() => [
    {
      name: 'get_launch_checklist',
      description: 'Use when you need the live launch checklist before planning work, reporting progress, or choosing the next task. Returns every task ID and current status. This is read-only.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => ({ tasks, summary: {
        total: tasks.length,
        done: tasks.filter((task) => task.status === 'done').length,
        inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      } }),
    },
    {
      name: 'update_task_status',
      description: 'Use when the user or launch workflow has actually started or completed a known checklist task. Requires an exact taskId from get_launch_checklist and updates the visible board before returning. Never infer completion without evidence.',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Exact launch task ID from get_launch_checklist.' },
          status: { type: 'string', enum: ['in-progress', 'done'], description: 'The verified new task status.' },
        },
        required: ['taskId', 'status'],
        additionalProperties: false,
      },
      execute: (input) => updateTaskStatus(String(input.taskId), String(input.status) as TaskStatus),
    },
    {
      name: 'analyze_steam_page',
      description: 'Use when evaluating whether a public Steam store page is launch-ready or when the user asks for concrete store-page gaps. Fetches current public Steam data, updates the visible analysis panel before returning, and does not modify Steam.',
      inputSchema: {
        type: 'object',
        properties: { appIdOrUrl: { type: 'string', description: 'A numeric Steam app ID or full store.steampowered.com/app URL.' } },
        required: ['appIdOrUrl'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
      execute: (input) => analyzeSteamPage(String(input.appIdOrUrl)),
    },
    {
      name: 'draft_press_outreach',
      description: 'Use when a specific press contact and honest coverage angle are known and the user wants a reviewable outreach draft. Creates a DRAFT in the visible app using Chrome on-device AI when available, with a safe template fallback. It never sends.',
      inputSchema: {
        type: 'object',
        properties: {
          gameTitle: { type: 'string', description: 'Exact public game title.' },
          angle: { type: 'string', description: 'Truthful, specific story angle relevant to the recipient.' },
          recipientName: { type: 'string', description: 'Recipient first name or publication contact name.' },
        },
        required: ['gameTitle', 'angle', 'recipientName'],
        additionalProperties: false,
      },
      execute: (input) => draftPressOutreach(String(input.gameTitle), String(input.angle), String(input.recipientName)),
    },
    {
      name: 'send_outreach_draft',
      description: 'Use only after the user asks to send a specific saved draft. This cannot send autonomously: it marks the draft awaiting_confirmation, opens the visible human approval modal before returning, and requires the human to click the final confirmation button.',
      inputSchema: {
        type: 'object',
        properties: { draftId: { type: 'string', description: 'Exact saved draft ID from the visible drafts list.' } },
        required: ['draftId'],
        additionalProperties: false,
      },
      annotations: { destructiveHint: true },
      execute: (input) => requestSendConfirmation(String(input.draftId)),
    },
  ], [analyzeSteamPage, draftPressOutreach, requestSendConfirmation, tasks, updateTaskStatus])

  return {
    tasks,
    drafts,
    steamAnalysis,
    isAnalyzing,
    pendingConfirmationId,
    tools,
    updateTaskStatus,
    analyzeSteamPage,
    draftPressOutreach,
    requestSendConfirmation,
    cancelSendConfirmation,
    confirmSendDraft,
  }
}
