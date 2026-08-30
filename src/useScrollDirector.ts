import { useEffect, useRef } from 'react'

/**
 * Single rAF loop for the whole showcase. Reads scroll + rects, writes
 * CSS custom properties only. No React re-renders; CSS calc() owns transforms.
 *
 * Written variables:
 *  - showcase root: --exit on hero via [data-lead]
 *  - [data-step="k"] inside [data-cabinet]: --mask-progress (0..1)
 *  - <video data-reel> inside a step: currentTime scrubbed to palindrome loop
 *  - [data-coin]: --angle (deg)
 */
export function useScrollDirector() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => {
        el.style.setProperty('--mask-progress', '1')
      })
      root.classList.add('motion-off')
      return
    }

    const cabinet = root.querySelector<HTMLElement>('[data-cabinet]')
    const lead = root.querySelector<HTMLElement>('[data-lead]')
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'))
    const reels = Array.from(root.querySelectorAll<HTMLVideoElement>('video[data-reel]'))
    const coins = Array.from(root.querySelectorAll<HTMLElement>('[data-coin]'))
    const parallaxEls = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'))

    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

    const measure = () => {
      const vh = window.innerHeight

      if (lead) {
        const r = lead.getBoundingClientRect()
        const p = clamp(-r.top / vh, 0, 1)
        lead.style.setProperty('--lead-progress', p.toFixed(4))
      }

      if (cabinet && steps.length) {
        const cRect = cabinet.getBoundingClientRect()
        const pinRange = Math.max(1, cabinet.offsetHeight - vh)
        const s = clamp(-cRect.top, 0, pinRange)
        steps.forEach((el) => {
          const k = Number(el.dataset.step ?? 0)
          const start = k * vh
          const p = clamp((s - start) / vh, 0, 1)
          el.style.setProperty('--mask-progress', p.toFixed(4))
          if (k > 0) {
            // rotation begins while the wipe is still settling
            const rot = clamp(p * 1.5 - 0.35, 0, 1)
            el.style.setProperty('--reveal-progress', rot.toFixed(4))
          } else {
            const rot = clamp(s / vh, 0, 1)
            el.style.setProperty('--reveal-progress', rot.toFixed(4))
          }
        })
        // scrub only reels near the viewport
        reels.forEach((video) => {
          const stepEl = video.closest<HTMLElement>('[data-step]')
          if (!stepEl) return
          const r = video.getBoundingClientRect()
          if (r.bottom < -vh || r.top > vh * 2) return
          if (video.readyState < 1 || !Number.isFinite(video.duration)) return
          const rot = Number(stepEl.style.getPropertyValue('--reveal-progress') || 0)
          const target = clamp(rot, 0, 0.999) * (video.duration - 0.01)
          if (Math.abs(video.currentTime - target) > 0.02) {
            video.currentTime = target
          }
        })
      }

      coins.forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = clamp((vh - r.top) / (vh + r.height), 0, 1)
        el.style.setProperty('--angle', `${(p * 260).toFixed(2)}deg`)
      })

      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = clamp((vh - r.top) / (vh + r.height), 0, 1)
        el.style.setProperty('--scroll-progress', p.toFixed(4))
      })
    }

    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        measure()
      })
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const settle = window.setTimeout(measure, 350)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.clearTimeout(settle)
    }
  }, [])

  return rootRef
}