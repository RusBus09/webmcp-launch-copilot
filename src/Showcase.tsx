import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, Bot, ShieldCheck } from 'lucide-react'
import { useScrollDirector } from './useScrollDirector'
import { ArtifactTurntable } from './ArtifactTurntable'
import heroMonolithStill from './assets/hero-monolith.png'
import ledgerStill from './assets/artifact-ledger.png'
import signalStill from './assets/artifact-signal.png'
import envoyStill from './assets/artifact-envoy.png'
import './showcase.css'

const artifacts = [
  {
    id: 'ledger',
    kind: 'ledger' as const,
    roman: 'The Ledger',
    italic: 'launch checklist',
    description:
      'The critical path, carved in state. Your agent reads the board, advances verified tasks, and the UI updates before it can even report back.',
    tools: ['get_launch_checklist', 'update_task_status'],
  },
  {
    id: 'signal',
    kind: 'signal' as const,
    roman: 'The Signal',
    italic: 'store readiness',
    description:
      'A live audit of the Steam page, scored from public data: assets, copy, screenshots, trailer, price, release date. Gaps exposed before press finds them.',
    tools: ['analyze_steam_page'],
  },
  {
    id: 'envoy',
    kind: 'envoy' as const,
    roman: 'The Envoy',
    italic: 'press outreach',
    description:
      'Drafts composed on-device, personalized per contact. Nothing sends alone. The final click belongs to a human, forever by design.',
    tools: ['draft_press_outreach', 'send_outreach_draft'],
  },
]

const marqueeWords = ['Launch Copilot', 'Agent drafts', 'Human confirms', 'Ship with witnesses']

function splitWords(text: string, italics: string[] = []) {
  return text.split(' ').map((word, i) => {
    const isItalic = italics.includes(word)
    return (
      <span className="w" key={`${word}-${i}`}>
        <span className="w__inner" style={{ '--i': i } as React.CSSProperties}>
          {isItalic ? <em>{word}</em> : word}
        </span>
      </span>
    )
  })
}

function scrollToConsole() {
  document.getElementById('console')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Loader({ progress, done }: { progress: number; done: boolean }) {
  return (
    <div className={`vloader ${done ? 'vloader--done' : ''}`} data-testid="vloader">
      <div className="vloader__center">
        <p className="vloader__line vloader__line--r">where your</p>
        <p className="vloader__line vloader__line--i">launch becomes</p>
        <p className="vloader__line vloader__line--r vloader__line--amber">art.</p>
      </div>
      <div className="vloader__progress">
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

export default function Showcase() {
  const rootRef = useScrollDirector()
  const [loadProgress, setLoadProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  // Intro gate: fonts + a fixed choreography beat. WebGL scenes are
  // procedural, nothing to preload. Keeps the loader without hostage-taking.
  useEffect(() => {
    const start = performance.now()
    const timer = window.setInterval(() => {
      const target = Math.min(100, ((performance.now() - start) / 1500) * 100)
      setLoadProgress((p) => p + (target - p) * 0.35)
    }, 100)
    const finish = window.setTimeout(() => {
      window.clearInterval(timer)
      setLoadProgress(100)
      setLoaded(true)
    }, 1600)
    // never hold the page hostage if the tab was backgrounded etc.
    const failSafe = window.setTimeout(() => {
      window.clearInterval(timer)
      setLoaded(true)
    }, 3000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(finish)
      window.clearTimeout(failSafe)
    }
  }, [])

  // The reels only scrub properly after the loader curtain; until then they idle.
  const cabinetRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`showcase ${loaded ? 'showcase--armed' : ''}`} ref={rootRef}>
      <Loader progress={loadProgress} done={loaded} />

      <section className="hero" aria-label="Introduction" data-lead>
        <div className="hero__media" aria-hidden="true">
          <ArtifactTurntable kind="monolith" className="hero__gl" fallbackImage={heroMonolithStill} />
          <div className="hero__media-haze" />
        </div>
        <div className="hero__inner">
          <p className="hero__kicker" data-reveal>
            Launch Copilot · WebMCP Challenge
          </p>
          <h1 className="hero__title">
            <span className="hero__mask">
              <span className="hero__line" data-split>
                {splitWords('where your')}
              </span>
            </span>
            <span className="hero__mask">
              <span className="hero__line" data-split>
                {splitWords('launch becomes', ['becomes'])}
              </span>
            </span>
            <span className="hero__mask">
              <span className="hero__line hero__line--accent" data-split>
                {splitWords('art.')}
              </span>
            </span>
          </h1>
          <p className="hero__sub" data-reveal>
            One dark room for the whole release: the checklist, the store signal, and the press
            outreach, sculpted into a workspace your AI agent can actually use. It drafts and
            verifies. You approve and send.
          </p>
          <div className="hero__actions" data-reveal>
            <button className="hero-cta hero-cta--primary" type="button" onClick={scrollToConsole}>
              Enter the console <ArrowDown size={16} />
            </button>
            <button className="hero-cta hero-cta--ghost" type="button" onClick={scrollToConsole}>
              Meet the tools <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="hero__meta" data-reveal>
            <span>
              <Bot size={13} /> 5 registered WebMCP tools
            </span>
            <span>
              <ShieldCheck size={13} /> human-gated by design
            </span>
          </div>
        </div>
        <button
          className="hero__scrollcue"
          type="button"
          onClick={scrollToConsole}
          aria-label="Scroll to the console"
        >
          <ArrowDown size={15} />
        </button>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <div className="marquee__group" key={copy}>
              {marqueeWords.map((word) => (
                <span className="marquee__word" key={`${copy}-${word}`}>
                  {word} <i>—</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="manifesto" data-reveal>
        <p className="manifesto__kicker">the essence of launch copilot</p>
        <h2 className="manifesto__title">
          Shipped once.
          <br />
          <em>Remembered forever.</em>
        </h2>
        <p className="manifesto__copy">
          Launch weeks are chaos: tasks scattered, store pages half-dressed, emails sent at 2am
          full of regret. Launch Copilot gathers the critical path into one gallery-dark room and
          gives your agent structured tools, not guesswork. The agent sees the whole board, drafts
          with discipline, and acts only where you allow. Every send passes through your hand.
        </p>
        <div className="manifesto__stats">
          <div data-reveal>
            <strong>5</strong>
            <span>structured agent tools</span>
          </div>
          <div data-reveal style={{ transitionDelay: '90ms' }}>
            <strong>100</strong>
            <span>point store readiness score</span>
          </div>
          <div data-reveal style={{ transitionDelay: '180ms' }}>
            <strong>1</strong>
            <span>unbreakable human gate</span>
          </div>
        </div>
      </section>

      {/* Sticky cabinet: scroll scrubs masks + turntables.
          The spacer div (not padding) extends the content box so the last
          step keeps a real sticky pin range and can be scrolled off naturally. */}
      <div className="cabinet" data-cabinet ref={cabinetRef}>
        {artifacts.map((artifact, k) => (
          <section
            className="cabinet__step"
            data-step={k}
            key={artifact.id}
            aria-label={`${artifact.roman}, ${artifact.italic}`}
          >
            <div className="cabinet__stage">
              <div className="cabinet__media">
                <ArtifactTurntable
                  kind={artifact.kind}
                  fallbackImage={
                    artifact.kind === 'ledger' ? ledgerStill : artifact.kind === 'signal' ? signalStill : envoyStill
                  }
                />
              </div>
              <div className="cabinet__panel">
                <p className="manifesto__kicker">the collection · {artifact.roman}</p>
                <h3 className="cabinet__name">
                  {artifact.roman} <em>{artifact.italic}</em>
                </h3>
                <p className="cabinet__desc">{artifact.description}</p>
                <div className="cabinet__tools">
                  {artifact.tools.map((tool) => (
                    <code key={tool}>{tool}</code>
                  ))}
                </div>
                <div className="cabinet__hint" aria-hidden="true">
                  scroll
                </div>
              </div>
            </div>
          </section>
        ))}
        <div className="cabinet__spacer" aria-hidden="true" />
      </div>

      <section className="manifesto manifesto--quote">
        <div className="coin" data-coin aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <defs>
              <path id="coin-arc" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text>
              <textPath href="#coin-arc">
                shipped once · remembered forever · shipped once ·
              </textPath>
            </text>
          </svg>
          <span className="coin__pip" />
        </div>
        <p className="manifesto__copy manifesto__copy--big">
          “Your launch deserves to be appreciated forever.”
        </p>
        <p className="manifesto__attrib">The Launch Copilot principle</p>
      </section>

      <section className="finale" data-reveal>
        <p className="manifesto__kicker">agent drafts · human confirms</p>
        <h2 className="finale__title">
          Your launch deserves
          <br />
          to be <em>sculpted.</em>
        </h2>
        <button
          className="hero-cta hero-cta--primary hero-cta--big"
          type="button"
          onClick={scrollToConsole}
        >
          Enter the console <ArrowDown size={17} />
        </button>
      </section>
    </div>
  )
}