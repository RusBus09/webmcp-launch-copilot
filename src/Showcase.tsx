import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, Bot, ShieldCheck } from 'lucide-react'
import { useScrollDirector } from './useScrollDirector'
import heroMonolithPoster from './assets/hero-monolith.png'
import turntableMonolith from './assets/turntable/monolith.mp4'
import turntableLedger from './assets/turntable/ledger.mp4'
import turntableSignal from './assets/turntable/signal.mp4'
import turntableEnvoy from './assets/turntable/envoy.mp4'
import './showcase.css'

const artifacts = [
  {
    id: 'ledger',
    video: turntableLedger,
    roman: 'The Ledger',
    italic: 'launch checklist',
    description:
      'The critical path, carved in state. Your agent reads the board, advances verified tasks, and the UI updates before it can even report back.',
    tools: ['get_launch_checklist', 'update_task_status'],
  },
  {
    id: 'signal',
    video: turntableSignal,
    roman: 'The Signal',
    italic: 'store readiness',
    description:
      'A live audit of the Steam page, scored from public data: assets, copy, screenshots, trailer, price, release date. Gaps exposed before press finds them.',
    tools: ['analyze_steam_page'],
  },
  {
    id: 'envoy',
    video: turntableEnvoy,
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

  // Preload gate: reel metadata + hero poster drive the counter, then curtain lifts.
  useEffect(() => {
    const videos = [
      turntableMonolith,
      turntableLedger,
      turntableSignal,
      turntableEnvoy,
    ] as string[]
    let live = 0
    let cancelled = false
    const total = videos.length + 1

    const tick = () => {
      if (cancelled) return
      setLoadProgress((p) => {
        const target = Math.min(100, ((live + 1) / total) * 100)
        return p + (target - p) * 0.3
      })
    }
    const timer = window.setInterval(tick, 120)

    const onVideo = () => {
      live += 1
    }
    videos.forEach((src) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.muted = true
      v.onloadedmetadata = onVideo
      v.src = src
    })
    const hero = new Image()
    hero.onload = onVideo
    hero.src = heroMonolithPoster

    // Hard ceiling: never hold the page hostage for slow media.
    const failSafe = window.setTimeout(() => setLoaded(true), 2500)
    const finish = window.setInterval(() => {
      setLoadProgress((p) => {
        if (p >= 99.5) {
          window.clearInterval(finish)
          window.clearInterval(timer)
          window.clearTimeout(failSafe)
          setLoaded(true)
          return 100
        }
        return p
      })
    }, 240)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.clearInterval(finish)
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
          <video
            data-reel
            src={turntableMonolith}
            poster={heroMonolithPoster}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
          />
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
                <video
                  data-reel
                  src={artifact.video}
                  muted
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
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