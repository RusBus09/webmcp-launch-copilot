import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { type Artifact, buildLedger, buildSignal, buildEnvoy, buildMonolith } from './artifacts3d'

/**
 * Real-time WebGL turntable. Rotation is driven by the director's
 * --reveal-progress, so scroll position deterministically controls yaw.
 *
 * Failure resilience (fixes the "empty gaps" bug class at the engine level):
 *  1. Creation ladder: antialias GL -> no-antialias GL. three.js accepts
 *     software GL by default, so a GPU-less Chrome still gets a canvas.
 *  2. Black-frame detector: if the context exists but renders black
 *     (driver quirk), the renderer is rebuilt once on a fresh context.
 *  3. webglcontextlost: loop halts, one rebuild attempt via context restore.
 *  4. If every path fails, the still-image fallback shows (never a gap).
 */
const BUILDERS = { ledger: buildLedger, signal: buildSignal, envoy: buildEnvoy, monolith: buildMonolith } as const
export type ArtifactKind = keyof typeof BUILDERS

export function ArtifactTurntable({
  kind,
  className,
  dprCap = 2,
  fallbackImage,
}: {
  kind: ArtifactKind
  className?: string
  dprCap?: number
  fallbackImage?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const artifact: Artifact = BUILDERS[kind]()
    const { scene, art, cameraZ } = artifact
    // still-image backdrop behind the canvas: only ever seen if GL dies
    if (fallbackImage) {
      mount.style.backgroundImage = `url(${fallbackImage})`
      mount.style.backgroundSize = 'cover'
      mount.style.backgroundPosition = 'center'
    }

    let renderer: THREE.WebGLRenderer | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let raf = 0
    let timer = 0
    let running = true
    let onScreen = true
    let rebuilt = 0
    const clock = new THREE.Clock()
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const createRenderer = (antialias: boolean): THREE.WebGLRenderer | null => {
      try {
        const r = new THREE.WebGLRenderer({ antialias, alpha: true, preserveDrawingBuffer: true })
        r.toneMapping = THREE.ACESFilmicToneMapping
        r.toneMappingExposure = 1.15
        r.outputColorSpace = THREE.SRGBColorSpace
        return r
      } catch {
        return null
      }
    }

    const attach = (r: THREE.WebGLRenderer) => {
      r.setPixelRatio(Math.min(window.devicePixelRatio, dprCap))
      r.setSize(mount.clientWidth || 1, mount.clientHeight || 1)
      r.domElement.style.cssText = 'width:100%;height:100%;display:block;position:relative'
      mount.appendChild(r.domElement)
    }

    const centerPixel = (r: THREE.WebGLRenderer): [number, number, number] => {
      const gl = r.getContext()
      const buf = new Uint8Array(4)
      gl.readPixels(
        Math.floor(gl.drawingBufferWidth / 2),
        Math.floor(gl.drawingBufferHeight / 2),
        1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf,
      )
      return [buf[0], buf[1], buf[2]]
    }

    const renderFrame = () => {
      if (!renderer || !camera) return
      const t = clock.getElapsedTime()
      const stepEl = mount.closest('[data-step]') as HTMLElement | null
      const rev = stepEl ? parseFloat(stepEl.style.getPropertyValue('--reveal-progress') || '0') : 0
      // presentation orbit: scroll swings the piece but never past ~60deg,
      // so a face is always visible (nothing goes edge-on mid-wipe)
      const orbit = Math.sin(rev * Math.PI) * 1.05
      const sway = Math.sin(t * (reducedQuery.matches ? 0.1 : 0.32)) * 0.3
      art.rotation.y = orbit + sway
      renderer.render(scene, camera)
    }

    const tick = () => {
      if (!running || !renderer) return
      renderFrame()
      if (onScreen) raf = requestAnimationFrame(tick)
      else timer = window.setTimeout(tick, 90)
    }

    const startLoop = () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      if (onScreen) raf = requestAnimationFrame(tick)
      else timer = window.setTimeout(tick, 90)
    }

    const init = (): boolean => {
      renderer = createRenderer(true) ?? createRenderer(false)
      if (!renderer) {
        mount.classList.add('gl-unavailable')
        return false
      }
      attach(renderer)
      camera = new THREE.PerspectiveCamera(
        30,
        (mount.clientWidth || 1) / Math.max(1, mount.clientHeight || 1),
        0.1,
        60,
      )
      camera.position.set(0, 1.7, cameraZ)
      camera.lookAt(0, 1.5, 0)

      renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)

      renderFrame()

      // black-frame detector: context up but nothing drawn = driver quirk
      const [r0, g0, b0] = centerPixel(renderer)
      if (r0 + g0 + b0 === 0 && rebuilt < 1) {
        rebuilt += 1
        disposeRenderer()
        renderer = createRenderer(false)
        if (!renderer) {
          mount.classList.add('gl-unavailable')
          return false
        }
        attach(renderer)
        renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)
        renderFrame()
      }
      return true
    }

    const disposeRenderer = () => {
      if (!renderer) return
      try {
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
        renderer.dispose()
        renderer.domElement.remove()
        renderer.forceContextLoss()
      } catch {
        /* already gone */
      }
      renderer = null
    }

    const revive = () => {
      disposeRenderer()
      const ok = init()
      if (ok) {
        mount.classList.remove('gl-dead')
        clock.getDelta() // swallow the pause
        running = true
        startLoop()
      }
    }

    function onContextLost(event: Event) {
      event.preventDefault()
      const el = mountRef.current
      if (!el) return
      el.classList.add('gl-lost')
      timer = window.setTimeout(() => {
        el.classList.remove('gl-lost')
        revive()
      }, 350)
    }

    const alive = init()
    if (alive) startLoop()

    const onResize = () => {
      if (!renderer || !camera) return
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
      renderFrame()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting)
      if (running) startLoop()
    })
    io.observe(mount)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      ro.disconnect()
      io.disconnect()
      disposeRenderer()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
    }
  }, [kind])

  return <div ref={mountRef} className={className ?? 'gl-fill'} aria-hidden="true" />
}