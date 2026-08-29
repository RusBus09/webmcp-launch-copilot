import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowUpRight, Bot, ShieldCheck } from 'lucide-react'
import heroMonolith from './assets/hero-monolith.png'
import artifactLedger from './assets/artifact-ledger.png'
import artifactSignal from './assets/artifact-signal.png'
import artifactEnvoy from './assets/artifact-envoy.png'
import './showcase.css'

const artifacts = [
  {
    id: 'ledger',
    image: artifactLedger,
    roman: 'The Ledger',
    italic: 'launch checklist',
    description:
      'The critical path, carved in state. Your agent reads the board, advances verified tasks, and the UI updates before it can even report back.',
    tools: ['get_launch_checklist', 'update_task_status'],
  },
  {
    id: 'signal',
    image: artifactSignal,
    roman: 'The Signal',
    italic: 'store readiness',
    description:
      'A live audit of the Steam page, scored from public data: assets, copy, screenshots, trailer, price, release date. Gaps exposed before press finds them.',
    tools: ['analyze_steam_page'],
  },
  {
    id: 'envoy',
    image: artifactEnvoy,
    roman: 'The Envoy',
    italic: 'press outreach',
    description:
      'Drafts composed on-device, personalized per contact. Nothing sends alone. The final click belongs to a human, forever by design.',
    tools: ['draft_press_outreach', 'send_outreach_draft'],
  },
]

const marqueeWords = ['Launch Copilot', 'Agent drafts', 'Human confirms', 'Ship with witnesses']

function useReveal() {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = root.querySelectorAll('[data-reveal]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18 },
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return rootRef
}

function scrollToConsole() {
  document.getElementById('console')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Showcase() {
  const rootRef = useReveal()

  return (
    <div className="showcase" ref={rootRef}>
      <section className="hero" aria-label="Introduction">
        <div className="hero__media" aria-hidden="true">
          <img src={heroMonolith} alt="" />
          <div className="hero__media-haze" />
        </div>
        <div className="hero__inner">
          <p className="hero__kicker" data-reveal>Launch Copilot · WebMCP Challenge</p>
          <h1 className="hero__title">
            <span className="hero__line" data-reveal>where your</span>
            <span className="hero__line" data-reveal>launch <em>becomes</em></span>
            <span className="hero__line hero__line--accent" data-reveal><em>art.</em></span>
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
            <span><Bot size={13} /> 5 registered WebMCP tools</span>
            <span><ShieldCheck size={13} /> human-gated by design</span>
          </div>
        </div>
        <button className="hero__scrollcue" type="button" onClick={scrollToConsole} aria-label="Scroll to the console">
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
          Shipped once.<br />
          <em>Remembered forever.</em>
        </h2>
        <p className="manifesto__copy">
          Launch weeks are chaos: tasks scattered, store pages half-dressed, emails sent at 2am
          full of regret. Launch Copilot gathers the critical path into one gallery-dark room and
          gives your agent structured tools, not guesswork. The agent sees the whole board, drafts
          with discipline, and acts only where you allow. Every send passes through your hand.
        </p>
        <div className="manifesto__stats">
          <div><strong>5</strong><span>structured agent tools</span></div>
          <div><strong>100</strong><span>point store readiness score</span></div>
          <div><strong>1</strong><span>unbreakable human gate</span></div>
        </div>
      </section>

      <section className="collection" aria-labelledby="collection-heading">
        <div className="collection__head" data-reveal>
          <p className="manifesto__kicker">the collection</p>
          <h2 id="collection-heading">Tools, <em>sculpted.</em></h2>
          <p className="collection__lede">
            Registered through the WebMCP API, each tool is a typed contract your agent calls by
            name. No scraping, no guessing from pixels.
          </p>
        </div>
        <div className="collection__grid">
          {artifacts.map((artifact, index) => (
            <article className="artifact-card" key={artifact.id} data-reveal style={{ transitionDelay: `${index * 90}ms` }}>
              <div className="artifact-card__frame">
                <img src={artifact.image} alt={`${artifact.roman} sculpture render`} loading="lazy" />
              </div>
              <h3 className="artifact-card__name">
                {artifact.roman} <em>{artifact.italic}</em>
              </h3>
              <p className="artifact-card__desc">{artifact.description}</p>
              <div className="artifact-card__tools">
                {artifact.tools.map((tool) => <code key={tool}>{tool}</code>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="finale" data-reveal>
        <p className="manifesto__kicker">agent drafts · human confirms</p>
        <h2 className="finale__title">
          Your launch deserves<br />to be <em>sculpted.</em>
        </h2>
        <button className="hero-cta hero-cta--primary hero-cta--big" type="button" onClick={scrollToConsole}>
          Enter the console <ArrowDown size={17} />
        </button>
      </section>
    </div>
  )
}