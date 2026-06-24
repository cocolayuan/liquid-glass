import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import LiquidGlass from './components/LiquidGlass'

// ——— minimize / expand 动画：rAF 缓动 size+radius，贴图按尺寸缓存复用 ———
const FULL = { w: 300, h: 196, r: 30 }
const MINI = { w: 66, h: 66, r: 33 }
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function MinimizeGlass({
  sceneRef,
  params,
  scrollY = 0,
}: {
  sceneRef: RefObject<HTMLElement | null>
  params: Params
  scrollY?: number
}) {
  const [mini, setMini] = useState(false)
  const [s, setS] = useState({ w: FULL.w, h: FULL.h })
  const [pos, setPos] = useState({ x: 720, y: 470 }) // 在场景内的绝对位置（可拖动）
  const raf = useRef(0)
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })

  // minimize / expand：只缓动宽高，圆角由 mini 状态推导
  const animateTo = (target: { w: number; h: number }) => {
    cancelAnimationFrame(raf.current)
    const from = { ...s }
    const dur = 520
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const e = easeInOut(Math.min(1, (now - start) / dur))
      setS({
        w: Math.round(from.w + (target.w - from.w) * e),
        h: Math.round(from.h + (target.h - from.h) * e),
      })
      if (now - start < dur) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const toggle = () => {
    const next = !mini
    setMini(next)
    animateTo(next ? { w: MINI.w, h: MINI.h } : { w: FULL.w, h: FULL.h })
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // —— 拖动 ——
  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = {
      active: true,
      moved: false,
      sx: e.clientX,
      sy: e.clientY,
      ox: pos.x,
      oy: pos.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d.active) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true
    setPos({ x: d.ox + dx, y: d.oy + dy })
  }
  const onPointerUp = () => {
    const d = drag.current
    d.active = false
    if (!d.moved) toggle() // 没拖动 = 点击 → 收起/展开
  }

  const fullness = (s.w - MINI.w) / (FULL.w - MINI.w) // 1=展开 0=收起
  const radius = mini ? Math.min(s.w, s.h) / 2 : params.radius

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 6,
        cursor: drag.current.active ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <LiquidGlass
        sceneRef={sceneRef}
        width={s.w}
        height={s.h}
        radius={radius}
        depth={params.depth}
        splay={params.splay}
        feather={params.feather}
        curve={params.curve}
        bias={params.bias}
        biasAngle={params.biasAngle}
        blur={params.blur}
        chroma={params.chroma}
        glint={params.glint}
        frost={params.frost}
        tint={params.tint}
        tintColor={params.tintColor}
        repaintKey={`${pos.x},${pos.y},${s.w},${Math.round(scrollY)}`}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
            userSelect: 'none',
          }}
        >
          <div style={{ opacity: fullness, textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Liquid Glass</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
              拖动移动 · 点击收起/展开
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              opacity: 1 - fullness,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            ⋯
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

// 可选背景图（放在 public/，用 BASE_URL 适配 GitHub Pages 子路径）
const BACKGROUNDS = [
  { label: '背景 1', file: 'Image.jpg' },
  { label: '背景 2', file: 'Image2.jpg' },
]

// 快捷预设（含 tintColor，一键套用整套外观）
const PRESETS: Record<string, Params> = {
  'Simple glass': {
    radius: 28, depth: 60, splay: 4, feather: 24, curve: 2, bias: 0.5, biasAngle: 45,
    blur: 0, chroma: 0.04, glint: 22, frost: 0.04, tint: 0, tintColor: '#ffffff',
  },
  'Thick glass': {
    radius: 28, depth: 110, splay: 3, feather: 30, curve: 3, bias: 0.8, biasAngle: 45,
    blur: 0, chroma: 0.06, glint: 55, frost: 0.16, tint: 0, tintColor: '#ffffff',
  },
  'Frosted glass': {
    radius: 28, depth: 70, splay: 14, feather: 28, curve: 2.4, bias: 0.4, biasAngle: 45,
    blur: 5, chroma: 0.02, glint: 25, frost: 0.32, tint: 0, tintColor: '#ffffff',
  },
  'Cut glass': {
    radius: 16, depth: 120, splay: 36, feather: 40, curve: 0.6, bias: 0.3, biasAngle: 45,
    blur: 0.1, chroma: 0.12, glint: 18, frost: 0.04, tint: 0, tintColor: '#ffffff',
  },
  'Dark glass': {
    radius: 28, depth: 62, splay: 3, feather: 13, curve: 2.8, bias: 0.7, biasAngle: 45,
    blur: 0.5, chroma: 0.03, glint: 30, frost: 0.04, tint: 0.55, tintColor: '#12151f',
  },
}

type MenuKey = 'Product' | 'Resources' | 'Company'
const MENUS: Record<MenuKey, string[]> = {
  Product: ['Overview', 'Features', 'Integrations', 'Changelog', 'Pricing'],
  Resources: ['Docs', 'Guides', 'Blog', 'Community'],
  Company: ['About', 'Careers', 'Contact'],
}
// 每个菜单的宽度（按最长项收紧，避免右侧留白）
const MENU_W: Record<MenuKey, number> = {
  Product: 186, // "Integrations"
  Resources: 162, // "Community"
  Company: 146, // "Careers"
}

interface Params {
  radius: number
  depth: number
  splay: number
  feather: number
  curve: number
  bias: number
  biasAngle: number
  blur: number
  chroma: number
  glint: number
  frost: number
  tint: number
  tintColor: string
}

export default function App() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<MenuKey | null>('Product')
  const [p, setP] = useState<Params>({
    radius: 28,
    depth: 95,
    splay: 9,
    feather: 26,
    curve: 1.5,
    bias: 0.45,
    biasAngle: 45,
    blur: 0.5,
    chroma: 0.02,
    glint: 26,
    frost: 0.05,
    tint: 0,
    tintColor: '#ffffff',
  })

  const set = (k: keyof Params, v: number | string) =>
    setP((prev) => ({ ...prev, [k]: v }))

  // 当前背景
  const [bgFile, setBgFile] = useState(BACKGROUNDS[0].file)
  const BG = `${import.meta.env.BASE_URL}${bgFile}`

  // ——— 页面滚动 + 背景视差 ———
  const PARALLAX = 0.7 // 背景按 0.7x 移动（比内容慢 → 视差）
  const PANEL_W = 250
  const [scrollY, setScrollY] = useState(0)
  const [vp, setVp] = useState({ w: 1280, h: 820 })
  const [imgRatio, setImgRatio] = useState(2743 / 1920) // 高/宽，加载后按真实尺寸更新

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const sceneW = vp.w - PANEL_W
  const imgH = sceneW * imgRatio
  const scrollRange = Math.max(0, imgH - vp.h) / PARALLAX // 让底部可滚到
  const spacerH = vp.h + scrollRange
  const bgShift = -Math.min(scrollY, scrollRange) * PARALLAX

  // ——— Magic Move：单个共享玻璃容器在菜单间滑动+变形 ———
  const navRef = useRef<HTMLElement>(null)
  const triggerRefs = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({})
  const [geo, setGeo] = useState<{ x: number; w: number; h: number } | null>(null)
  const [displayKey, setDisplayKey] = useState<MenuKey>('Product')
  const geoRef = useRef<{ x: number; w: number; h: number } | null>(null)
  const geoRaf = useRef(0)

  useEffect(() => {
    if (open) setDisplayKey(open)
  }, [open])

  useEffect(() => {
    if (!open) return
    const btn = triggerRefs.current[open]
    const nav = navRef.current
    if (!btn || !nav) return
    const navRect = nav.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    const w = MENU_W[open]
    const h = MENUS[open].length * 50 + 24
    const cx = bRect.left - navRect.left + bRect.width / 2
    const target = { x: cx - w / 2, w, h }
    cancelAnimationFrame(geoRaf.current)
    // 首次打开：直接定位，不缓动（同步设置，避免依赖 rAF）
    if (!geoRef.current) {
      geoRef.current = target
      setGeo(target)
      return
    }
    const from = geoRef.current
    const dur = 320 // 之后切换才"神奇移动"
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const e = dur ? easeInOut(Math.min(1, (now - start) / dur)) : 1
      const ng = {
        x: from.x + (target.x - from.x) * e,
        w: Math.round(from.w + (target.w - from.w) * e),
        h: Math.round(from.h + (target.h - from.h) * e),
      }
      geoRef.current = ng
      setGeo(ng)
      if (now - start < dur) geoRaf.current = requestAnimationFrame(tick)
    }
    geoRaf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(geoRaf.current)
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      {/* ——— 视差背景层：固定，随滚动按 0.7x 平移（sceneRef 指向它，被折射克隆） ——— */}
      <div
        ref={sceneRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `calc(100% - ${PANEL_W}px)`,
          transform: `translateY(${bgShift}px)`,
          willChange: 'transform',
          zIndex: 0,
        }}
      >
        <img
          src={BG}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const im = e.currentTarget
            if (im.naturalWidth)
              setImgRatio(im.naturalHeight / im.naturalWidth)
          }}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>

      {/* 撑出滚动高度（含视差额外行程，保证底部可滚到） */}
      <div style={{ height: spacerH }} />

      {/* 内容层：覆盖在背景之上、随页面滚动（导航是 fixed 不随滚） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `calc(100% - ${PANEL_W}px)`,
          zIndex: 1,
        }}
      >

        {/* ——— 导航栏 + 共享液态玻璃（Magic Move） ——— */}
        <nav
          ref={navRef}
          onMouseLeave={() => setOpen(null)}
          style={{
            position: 'fixed',
            top: '34vh', // 屏幕中上方，固定不随背景滚动
            left: 0,
            right: 250, // 让出右侧调参面板宽度，居中在可视场景区
            zIndex: 5,
            display: 'flex',
            justifyContent: 'center',
            gap: 44,
            color: '#fff',
            fontWeight: 600,
            fontSize: 19,
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
          }}
        >
          {(Object.keys(MENUS) as MenuKey[]).map((key) => (
            <button
              key={key}
              ref={(el) => {
                triggerRefs.current[key] = el
              }}
              onMouseEnter={() => setOpen(key)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {key}
              <span
                style={{
                  display: 'inline-block',
                  transition: 'transform 0.25s',
                  transform: open === key ? 'rotate(180deg)' : 'none',
                  fontSize: 13,
                }}
              >
                ⌄
              </span>
            </button>
          ))}

          {/* 单个共享玻璃容器：在菜单间滑动 + 变形 */}
          {geo && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: geo.x,
                width: geo.w,
                paddingTop: 14, // 视觉间隙，保持悬停连续
                opacity: open ? 1 : 0,
                transform: open ? 'scale(1)' : 'scale(0.98)',
                transformOrigin: 'top center',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              <LiquidGlass
                sceneRef={sceneRef}
                width={geo.w}
                height={geo.h}
                radius={p.radius}
                depth={p.depth}
                splay={p.splay}
                feather={p.feather}
                curve={p.curve}
                bias={p.bias}
                biasAngle={p.biasAngle}
                blur={p.blur}
                chroma={p.chroma}
                glint={p.glint}
                frost={p.frost}
                tint={p.tint}
                tintColor={p.tintColor}
                repaintKey={`${Math.round(geo.x)},${geo.w},${geo.h},${Math.round(scrollY)}`}
              >
                <div
                  key={displayKey}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 12px',
                    animation: 'lgFade 0.22s ease',
                  }}
                >
                  {MENUS[displayKey].map((item) => (
                    <a
                      key={item}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: 18,
                        fontWeight: 500,
                        padding: '13px 18px',
                        borderRadius: 12,
                        transition: 'background 0.18s',
                        textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </LiquidGlass>
            </div>
          )}
        </nav>

        {/* 可拖动 + 滑块实时预览的玻璃模块 */}
        <MinimizeGlass sceneRef={sceneRef} params={p} scrollY={scrollY} />
      </div>

      {/* ——— 调参面板（固定，不随滚动） ——— */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 250,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 20,
          padding: 18,
          background: '#1c1c1e',
          color: '#e6e6e6',
          font: '13px Questrial, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#8a8a90',
          }}
        >
          Lens controls
        </h3>
        {(
          [
            ['depth', 0, 120, 1],
            ['splay', 2, 40, 1],
            ['feather', 0, 40, 1],
            ['curve', 0.3, 3, 0.1],
            ['bias', 0, 1.5, 0.05],
            ['biasAngle', -180, 180, 5],
            ['blur', 0, 5, 0.1],
            ['chroma', 0, 0.25, 0.01],
            ['glint', 0, 150, 5],
            ['frost', 0, 1, 0.01],
            ['tint', 0, 1, 0.01],
            ['radius', 0, 60, 1],
          ] as const
        ).map(([k, min, max, step]) => (
          <label
            key={k}
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 40px',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ textTransform: 'capitalize' }}>{k}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={p[k]}
              onChange={(e) => set(k, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#558855' }}
            />
            <span style={{ textAlign: 'right', color: '#bdbdc2' }}>{p[k]}</span>
          </label>
        ))}
        <label
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Tint color</span>
          <input
            type="color"
            value={p.tintColor}
            onChange={(e) => set('tintColor', e.target.value)}
          />
        </label>

        {/* 快捷预设 */}
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => setP((prev) => ({ ...prev, ...PRESETS[name] }))}
              style={{
                padding: '9px 12px',
                cursor: 'pointer',
                background: '#010101',
                color: '#eee',
                border: 'none',
                borderRadius: 8,
                font: '600 13px Questrial, -apple-system, sans-serif',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#558855')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#010101')}
            >
              {name}
            </button>
          ))}
        </div>

        {/* 背景下拉（置于面板底部） */}
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#8a8a90',
              marginBottom: 8,
            }}
          >
            Background
          </div>
          <select
            value={bgFile}
            onChange={(e) => setBgFile(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              cursor: 'pointer',
              background: '#010101',
              color: '#eee',
              border: '1px solid #333',
              borderRadius: 8,
              font: '600 13px Questrial, -apple-system, sans-serif',
              appearance: 'none',
            }}
          >
            {BACKGROUNDS.map((b) => (
              <option key={b.file} value={b.file}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </aside>
    </div>
  )
}
