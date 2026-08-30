import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { type Artifact, buildLedger, buildSignal, buildEnvoy, buildMonolith } from './artifacts3d'

/**
 * Real-time WebGL turntable. One canvas = one renderer, created once per
 * mount (unmount disposes). The director's --reveal-progress drives the
 * art group's yaw, so scroll position deterministically controls rotation.
 * No video, no drift: geometry + lights are code.
 */
const BUILDERS = { ledger: buildLedger, signal: buildSignal, envoy: buildEnvoy, monolith: buildMonolith } as const
export type ArtifactKind = keyof typeof BUILDERS

export function ArtifactTurntable({
  kind,
  className,
  dprCap = 2,
}: {
  kind: ArtifactKind
  className?: string
  dprCap?: number
}) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const artifact: Artifact = BUILDERS[kind]()
    const { scene, art, cameraZ } = artifact

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch {
      return // no WebGL: mount stays empty (poster fallback not used in this build)
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap))
    renderer.setSize(mount.clientWidth || 1, mount.clientHeight || 1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    const camera = new THREE.PerspectiveCamera(
      30,
      (mount.clientWidth || 1) / Math.max(1, mount.clientHeight || 1),
      0.1,
      60,
    )
    camera.position.set(0, 1.7, cameraZ)
    camera.lookAt(0, 1.5, 0)

    let raf = 0
    const clock = new THREE.Clock()
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const tick = () => {
      const t = clock.getElapsedTime()
      const stepEl = mount.closest('[data-step]') as HTMLElement | null
      const rev = stepEl ? parseFloat(stepEl.style.getPropertyValue('--reveal-progress') || '0') : 0
      // presentation orbit: scroll swings the piece +-100 degrees around its
      // hero angle; it can never land backwards or edge-on
      const orbit = Math.sin(rev * Math.PI) * 1.75
      const sway = Math.sin(t * (reducedQuery.matches ? 0.1 : 0.32)) * 0.3
      art.rotation.y = orbit + sway
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      renderer.domElement.remove()
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
      renderer.forceContextLoss()
    }
  }, [kind])

  return <div ref={mountRef} className={className ?? 'gl-fill'} aria-hidden="true" />
}