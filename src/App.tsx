import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Gamepad2,
  LoaderCircle,
  Mail,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import './App.css'
import { useLaunchCopilot, type OutreachDraft, type TaskStatus } from './hooks/useLaunchCopilot'
import { useWebMCP } from './tools/useWebMCP'

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Queued',
  'in-progress': 'In progress',
  done: 'Done',
}

function formatRelativeDate(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

function DraftCard({
  draft,
  onRequestSend,
}: {
  draft: OutreachDraft
  onRequestSend: (draftId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="draft-card">
      <div className="draft-card__topline">
        <div className="avatar" aria-hidden="true">{draft.recipientName.slice(0, 1).toUpperCase()}</div>
        <div className="draft-card__identity">
          <strong>{draft.recipientName}</strong>
          <span>{draft.gameTitle} · {formatRelativeDate(draft.createdAt)}</span>
        </div>
        <span className={`status-pill status-pill--${draft.status}`}>
          {draft.status === 'awaiting_confirmation' ? 'Needs approval' : draft.status}
        </span>
      </div>
      <p className="draft-subject">{draft.subject}</p>
      <p className={`draft-preview ${expanded ? 'draft-preview--expanded' : ''}`}>{draft.body}</p>
      <div className="draft-actions">
        <button className="button button--quiet" type="button" onClick={() => setExpanded((value) => !value)}>
          <FileText size={15} /> {expanded ? 'Collapse' : 'Review draft'}
        </button>
        {draft.status !== 'sent' && (
          <button className="button button--outline" type="button" onClick={() => onRequestSend(draft.id)}>
            <Send size={15} /> {draft.status === 'awaiting_confirmation' ? 'Review approval' : 'Approve to send'}
          </button>
        )}
        {draft.status === 'sent' && <span className="sent-label"><Check size={15} /> Human confirmed</span>}
      </div>
    </article>
  )
}

function App() {
  const launch = useLaunchCopilot()
  const webMCP = useWebMCP(launch.tools)
  const [steamInput, setSteamInput] = useState('730')
  const [steamError, setSteamError] = useState('')
  const [draftError, setDraftError] = useState('')
  const [showTools, setShowTools] = useState(false)
  const [draftForm, setDraftForm] = useState({
    gameTitle: 'Signal Lost',
    recipientName: '',
    angle: '',
  })

  const completedTasks = launch.tasks.filter((task) => task.status === 'done').length
  const progress = Math.round((completedTasks / launch.tasks.length) * 100)
  const pendingDraft = launch.drafts.find((draft) => draft.id === launch.pendingConfirmationId) ?? null
  const nextTask = launch.tasks.find((task) => task.status !== 'done')

  const activityMessage = useMemo(() => {
    if (webMCP.lastInvocation) return `${webMCP.lastInvocation.name} called by agent`
    if (webMCP.isAvailable) return 'Ready for agent calls'
    return 'Browser API unavailable'
  }, [webMCP.isAvailable, webMCP.lastInvocation])

  useEffect(() => {
    if (!pendingDraft) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') launch.cancelSendConfirmation()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [launch, pendingDraft])

  async function handleSteamSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSteamError('')
    try {
      await launch.analyzeSteamPage(steamInput)
    } catch (error) {
      setSteamError(error instanceof Error ? error.message : 'Steam analysis failed.')
    }
  }

  async function handleDraftSubmit(event: React.FormEvent) {
    event.preventDefault()
    setDraftError('')
    try {
      await launch.draftPressOutreach(draftForm.gameTitle, draftForm.angle, draftForm.recipientName)
      setDraftForm((current) => ({ ...current, recipientName: '', angle: '' }))
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Draft generation failed.')
    }
  }

  function advanceTask(taskId: string, status: TaskStatus) {
    const nextStatus = status === 'todo' ? 'in-progress' : 'done'
    launch.updateTaskStatus(taskId, nextStatus)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Launch Copilot home">
          <span className="brand-mark"><Gamepad2 size={19} /></span>
          <span>
            <strong>Launch Copilot</strong>
            <small>Indie release command</small>
          </span>
        </a>
        <div className="topbar__right">
          <div className="webmcp-wrap">
            <button
              className={`webmcp-badge ${webMCP.isAvailable ? 'webmcp-badge--online' : ''}`}
              type="button"
              onClick={() => setShowTools((value) => !value)}
              aria-expanded={showTools}
            >
              <Radio size={14} />
              <span>{webMCP.isAvailable ? 'WebMCP live' : 'WebMCP standby'}</span>
              <b>{webMCP.registeredTools.length}</b>
            </button>
            {showTools && (
              <div className="tool-popover">
                <div className="tool-popover__header">
                  <span>Agent tool registry</span>
                  <span className={webMCP.isAvailable ? 'online-copy' : 'muted'}>{activityMessage}</span>
                </div>
                {webMCP.registeredTools.length ? webMCP.registeredTools.map((name) => (
                  <div className="tool-row" key={name}>
                    <span><Zap size={13} /> {name}</span>
                    <CheckCircle2 size={14} />
                  </div>
                )) : (
                  <p className="tool-empty">Open in a WebMCP-enabled browser to register all five tools.</p>
                )}
              </div>
            )}
          </div>
          <div className="operator">
            <span className="operator__dot" />
            <span><small>Operator</small><strong>Launch room</strong></span>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="command-header" aria-labelledby="page-title">
          <div>
            <div className="eyebrow"><Activity size={14} /> Launch operations</div>
            <h1 id="page-title">Ship with fewer blind spots.</h1>
            <p>One live workspace for the tasks, store readiness, and outreach that decide launch week.</p>
          </div>
          <div className="launch-window">
            <span>Target window</span>
            <strong>12 days to launch</strong>
            <small>{nextTask ? `Next: ${nextTask.title}` : 'Checklist complete'}</small>
          </div>
        </section>

        <section className="metric-strip" aria-label="Launch summary">
          <div className="metric metric--progress">
            <div className="metric__icon"><CheckCircle2 size={18} /></div>
            <div><span>Checklist progress</span><strong>{progress}%</strong></div>
            <div className="meter"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="metric">
            <div className="metric__icon"><Clock3 size={18} /></div>
            <div><span>Tasks in motion</span><strong>{launch.tasks.filter((task) => task.status === 'in-progress').length}</strong></div>
            <small>{launch.tasks.length - completedTasks} remaining</small>
          </div>
          <div className="metric">
            <div className="metric__icon"><Mail size={18} /></div>
            <div><span>Press drafts</span><strong>{launch.drafts.length}</strong></div>
            <small>{launch.drafts.filter((draft) => draft.status === 'sent').length} human confirmed</small>
          </div>
          <div className="metric">
            <div className="metric__icon metric__icon--yellow"><ShieldCheck size={18} /></div>
            <div><span>Human gate</span><strong>Enforced</strong></div>
            <small>Nothing sends alone</small>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel task-panel" aria-labelledby="checklist-heading">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">Critical path</span>
                <h2 id="checklist-heading">Launch checklist</h2>
              </div>
              <span className="panel-count">{completedTasks}/{launch.tasks.length} done</span>
            </div>
            <div className="task-list">
              {launch.tasks.map((task, index) => (
                <article className={`task-row task-row--${task.status}`} key={task.id}>
                  <button
                    className="task-toggle"
                    type="button"
                    onClick={() => task.status !== 'done' && advanceTask(task.id, task.status)}
                    aria-label={`${task.title}: ${task.status === 'todo' ? 'mark in progress' : task.status === 'in-progress' ? 'mark done' : 'done'}`}
                    disabled={task.status === 'done'}
                  >
                    {task.status === 'done' ? <Check size={15} /> : task.status === 'in-progress' ? <Clock3 size={14} /> : <Circle size={14} />}
                  </button>
                  <span className="task-index">{String(index + 1).padStart(2, '0')}</span>
                  <div className="task-copy">
                    <strong>{task.title}</strong>
                    <span>{task.category} · ID: {task.id}</span>
                  </div>
                  <span className={`task-status task-status--${task.status}`}>{statusLabels[task.status]}</span>
                  <span className="task-due">{task.dueLabel}</span>
                  {task.status !== 'done' && <ArrowUpRight className="task-arrow" size={16} aria-hidden="true" />}
                </article>
              ))}
            </div>
            <div className="panel-note">
              <Bot size={16} />
              <span>Agents can read this board and advance verified tasks through WebMCP. The UI updates before each tool call returns.</span>
            </div>
          </section>

          <section className="panel steam-panel" aria-labelledby="steam-heading">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">Public store signal</span>
                <h2 id="steam-heading">Steam readiness</h2>
              </div>
              <Search size={18} />
            </div>
            <form className="steam-form" onSubmit={handleSteamSubmit}>
              <label htmlFor="steam-app">Steam app ID or store URL</label>
              <div className="input-action">
                <input
                  id="steam-app"
                  value={steamInput}
                  onChange={(event) => setSteamInput(event.target.value)}
                  placeholder="e.g. 730 or store URL"
                />
                <button className="button button--primary" type="submit" disabled={launch.isAnalyzing}>
                  {launch.isAnalyzing ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}
                  Analyze
                </button>
              </div>
              {steamError && <p className="form-error" role="alert">{steamError}</p>}
            </form>

            {launch.steamAnalysis ? (
              <div className="analysis-result">
                <div className="score-overview">
                  <div className="score-ring" style={{ '--score': launch.steamAnalysis.totalScore } as React.CSSProperties}>
                    <strong>{launch.steamAnalysis.totalScore}</strong><span>/ 100</span>
                  </div>
                  <div>
                    <span className="score-label">Current readiness</span>
                    <h3>{launch.steamAnalysis.gameName}</h3>
                    <small>Steam app {launch.steamAnalysis.appId}</small>
                  </div>
                </div>
                <div className="score-list">
                  {launch.steamAnalysis.items.map((item) => (
                    <div className="score-item" key={item.label}>
                      <span className={item.passed ? 'check-icon' : 'warn-icon'}>
                        {item.passed ? <Check size={13} /> : <span>!</span>}
                      </span>
                      <div><strong>{item.label}</strong><small>{item.value}</small></div>
                      <b>{item.score}/{item.max}</b>
                    </div>
                  ))}
                </div>
                {launch.steamAnalysis.recommendations.length > 0 && (
                  <div className="recommendation">
                    <Sparkles size={16} />
                    <span>{launch.steamAnalysis.recommendations[0]}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="analysis-empty">
                <div><Search size={22} /></div>
                <strong>Run a live store audit</strong>
                <p>Score assets, copy, screenshots, trailer, price, and release date from Steam's public API.</p>
              </div>
            )}
          </section>

          <section className="panel drafts-panel" aria-labelledby="drafts-heading">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">Human-approved outreach</span>
                <h2 id="drafts-heading">Press drafts</h2>
              </div>
              <span className="panel-count">{launch.drafts.length} saved</span>
            </div>
            <div className="drafts-layout">
              <form className="draft-composer" onSubmit={handleDraftSubmit}>
                <div className="composer-heading">
                  <span><Sparkles size={15} /> New tailored draft</span>
                  <small>On-device AI with smart fallback</small>
                </div>
                <label htmlFor="game-title">Game title</label>
                <input id="game-title" value={draftForm.gameTitle} onChange={(event) => setDraftForm({ ...draftForm, gameTitle: event.target.value })} />
                <label htmlFor="recipient">Recipient name</label>
                <input id="recipient" value={draftForm.recipientName} onChange={(event) => setDraftForm({ ...draftForm, recipientName: event.target.value })} placeholder="e.g. Jordan at PC Gamer" />
                <label htmlFor="angle">Specific coverage angle</label>
                <textarea id="angle" value={draftForm.angle} onChange={(event) => setDraftForm({ ...draftForm, angle: event.target.value })} placeholder="Why this game is relevant to their audience..." rows={4} />
                {draftError && <p className="form-error" role="alert">{draftError}</p>}
                <button className="button button--primary button--wide" type="submit"><Sparkles size={16} /> Draft outreach</button>
                <p className="composer-policy"><ShieldCheck size={14} /> Drafts are saved locally in app state. They are never sent automatically.</p>
              </form>
              <div className="draft-list">
                {launch.drafts.map((draft) => <DraftCard key={draft.id} draft={draft} onRequestSend={launch.requestSendConfirmation} />)}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer>
        <span><span className="footer-pulse" /> Launch state synced in this session</span>
        <span>Agent drafts. Human confirms.</span>
      </footer>

      {pendingDraft && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && launch.cancelSendConfirmation()}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="modal-close" type="button" onClick={launch.cancelSendConfirmation} aria-label="Close confirmation"><X size={18} /></button>
            <div className="modal-icon"><ShieldCheck size={23} /></div>
            <span className="section-kicker">Human approval required</span>
            <h2 id="confirm-title">Confirm this outreach</h2>
            <p>An agent cannot pass this gate. Review the recipient and subject before marking the draft as sent.</p>
            <div className="confirmation-summary">
              <div><span>Recipient</span><strong>{pendingDraft.recipientName}</strong></div>
              <div><span>Subject</span><strong>{pendingDraft.subject}</strong></div>
              <div><span>Draft ID</span><code>{pendingDraft.id}</code></div>
            </div>
            <div className="modal-warning"><ShieldCheck size={16} /> This demo records your explicit confirmation. It does not connect to an email provider.</div>
            <div className="modal-actions">
              <button className="button button--quiet" type="button" onClick={launch.cancelSendConfirmation}>Keep as draft</button>
              <button className="button button--primary" type="button" onClick={launch.confirmSendDraft}><Send size={16} /> Confirm and mark sent</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
