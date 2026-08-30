import * as THREE from 'three'

/**
 * Deterministic procedural artifact sculptures. Same mesh, same lights,
 * every frame identical by construction - no AI drift possible.
 * Each builder returns a scene + the `art` group your turntable yaws,
 * matching the amber/teal gallery language. Vitest-free, pure three.js.
 */

const AMBER = 0xf4a83d
const TEAL = 0x2ad4c0

export type Artifact = {
  scene: THREE.Scene
  art: THREE.Group
  cameraZ: number
  heroLight?: THREE.SpotLight
}

function pedestal(h = 0.5, r = 1.15) {
  const g = new THREE.Group()
  // warm gallery marble, catches the spotlight like a plinth should
  const stone = new THREE.MeshStandardMaterial({ color: 0x54452f, roughness: 0.68, metalness: 0.06 })
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, 0.09, 48), stone)
  top.position.y = h
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.18, h, 48), stone)
  body.position.y = h / 2
  const darkbase = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.28, 0.1, 48), new THREE.MeshStandardMaterial({ color: 0x14110d, roughness: 0.8 }))
  darkbase.position.y = 0.05
  g.add(top, body, darkbase)
  return g
}

function baseLights() {
  const lights = new THREE.Group()
  lights.add(new THREE.AmbientLight(0x2a2333, 0.7))
  const spot = new THREE.SpotLight(0xfff0d8, 160, 24, 0.52, 0.55, 1.4)
  spot.position.set(0, 7.5, 2.2)
  spot.target.position.set(0, 0.5, 0)
  lights.add(spot, spot.target)
  const rim = new THREE.DirectionalLight(AMBER, 1.5)
  rim.position.set(-4.4, 3.1, -3.6)
  const fill = new THREE.DirectionalLight(TEAL, 0.8)
  fill.position.set(4.2, 1.6, 3.4)
  const bounce = new THREE.PointLight(0xffdca8, 5, 12, 1.8)
  bounce.position.set(0, 1.1, 3.2)
  lights.add(rim, fill, bounce)
  return { lights, spot: { intensity: 900 } }
}

/* ---------- The Ledger: stone tablet, engraved amber checklist ---------- */
export function buildLedger(): Artifact {
  const scene = new THREE.Scene()
  const { lights } = baseLights()

  const art = new THREE.Group()
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.84, 2.64, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 0.9 }),
  )
  frame.position.y = 1.68
  const tablet = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 2.5, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x17130e, roughness: 0.72, metalness: 0.16 }),
  )
  tablet.position.y = 1.68

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x100b04,
    emissive: AMBER,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  })
  const lines = new THREE.Group()
  for (let i = 0; i < 7; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.16 - (i % 3) * 0.16, 0.055, 0.04), lineMat)
    line.position.set(0, 2.16 - i * 0.2, 0.16)
    lines.add(line)
  }
  const check = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.055, 0.04), lineMat)
  check.rotation.z = -0.6
  check.position.set(0, 0.86, 0.16)
  const check2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.055, 0.04), lineMat)
  check2.rotation.z = 0.7
  check2.position.set(-0.28, 0.78, 0.16)
  lines.add(check, check2)

  art.add(frame, tablet, lines, pedestal(0.42, 1.05))
  scene.add(art, lights)
  return { scene, art, cameraZ: 6.0 }
}

/* ---------- The Signal: holographic capsule on teal cone ---------- */
export function buildSignal(): Artifact {
  const scene = new THREE.Scene()
  const { lights } = baseLights()

  const art = new THREE.Group()
  const capsule = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.92, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x0b1412,
      metalness: 0.45,
      roughness: 0.16,
      transparent: true,
      opacity: 0.94,
      emissive: TEAL,
      emissiveIntensity: 0.1,
      clearcoat: 1,
    }),
  )
  capsule.position.y = 2.5
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 1),
    new THREE.MeshStandardMaterial({
      color: 0x0a0f0e,
      emissive: TEAL,
      emissiveIntensity: 0.45,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    }),
  )
  cage.position.y = 2.5
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1.42, 2.3, 40, 1, true),
    new THREE.MeshBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  cone.position.y = 1.42
  const glow = new THREE.PointLight(TEAL, 5, 7)
  glow.position.set(0, 1.6, 0)
  const bottomDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  bottomDot.rotation.x = -Math.PI / 2
  bottomDot.position.y = 0.36

  art.add(pedestal(0.34, 1.25), cone, capsule, cage, glow, bottomDot)
  scene.add(art, lights)
  return { scene, art, cameraZ: 7.0 }
}

/* ---------- The Envoy: sealed envelope, wax + teal seam ---------- */
export function buildEnvoy(): Artifact {
  const scene = new THREE.Scene()
  const { lights } = baseLights()

  const art = new THREE.Group()
  const paper = new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.9, metalness: 0.03 })
  const envelope = new THREE.Group()
  envelope.position.y = 1.58

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.38, 0.18), paper)
  const flap = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.5, 4), paper)
  flap.scale.set(1.42, 1, 0.1)
  flap.rotation.z = Math.PI
  flap.position.y = 0.44
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 0.11, 28),
    new THREE.MeshStandardMaterial({
      color: 0x14100b,
      emissive: TEAL,
      emissiveIntensity: 0.22,
      roughness: 0.35,
    }),
  )
  // disc faces the camera: axis along Z
  seal.rotation.x = Math.PI / 2
  seal.position.set(0, 0.28, 0.11)
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.018, 12, 44),
    new THREE.MeshBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  seam.rotation.x = 0
  seam.position.set(0, 0.28, 0.17)

  envelope.add(body, flap, seal, seam)
  art.add(envelope, pedestal(0.42, 1.2))
  scene.add(art, lights)
  return { scene, art, cameraZ: 7.3 }
}

/* ---------- Hero monolith: faceted obsidian, amber bevels, teal etch ---------- */
export function buildMonolith(): Artifact {
  const scene = new THREE.Scene()
  const { lights } = baseLights()

  const art = new THREE.Group()
  const mono = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.8, 3.2, 6, 1),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0a09, roughness: 0.12, metalness: 0.55, clearcoat: 0.6 }),
  )
  mono.position.y = 2.0

  const bevels = new THREE.Group()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const bevel = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 2.95, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x0a0603, emissive: AMBER, emissiveIntensity: 1.5, roughness: 0.3 }),
    )
    bevel.position.set(Math.sin(a) * 0.66, 2.0, Math.cos(a) * 0.66)
    bevel.rotation.y = a
    bevels.add(bevel)
  }

  const etch = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.68 + i * 0.015, 0.008, 8, 48),
      new THREE.MeshBasicMaterial({
        color: TEAL,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.9 + i * 0.58
    etch.add(ring)
  }

  art.add(mono, bevels, etch, pedestal(0.4, 1.25))
  scene.add(art, lights)
  return { scene, art, cameraZ: 6.3 }
}