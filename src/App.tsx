import { useEffect, useRef, useState } from 'react'
import LiquidGlassNav from './components/LiquidGlassNav'
import DraggableGlass from './components/DraggableGlass'
import { DEFAULT_GLASS, PRESETS, type GlassParams } from './components/presets'

// 可选背景图（放在 public/，用 BASE_URL 适配 GitHub Pages 子路径）
const BACKGROUNDS = [
  { label: '背景 1', file: 'Image.jpg' },
  { label: '背景 2', file: 'Image2.jpg' },
]

// 导航菜单数据
const MENUS: Record<string, string[]> = {
  Product: ['Overview', 'Features', 'Integrations', 'Changelog', 'Pricing'],
  Resources: ['Docs', 'Guides', 'Blog', 'Community'],
  Company: ['About', 'Careers', 'Contact'],
}

const PANEL_W = 250

export default function App() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [p, setP] = useState<GlassParams>(DEFAULT_GLASS)
  const set = (k: keyof GlassParams, v: number | string) =>
    setP((prev) => ({ ...prev, [k]: v }))

  // 当前背景
  const [bgFile, setBgFile] = useState(BACKGROUNDS[0].file)
  const BG = `${import.meta.env.BASE_URL}${bgFile}`

  // ——— 页面滚动 + 背景视差 ———
  const PARALLAX = 0.7
  const [scrollY, setScrollY] = useState(0)
  const [vp, setVp] = useState({ w: 1280, h: 820 })
  const [imgRatio, setImgRatio] = useState(2743 / 1920)

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
  const scrollRange = Math.max(0, imgH - vp.h) / PARALLAX
  const spacerH = vp.h + scrollRange
  const bgShift = -Math.min(scrollY, scrollRange) * PARALLAX

  return (
    <div style={{ position: 'relative' }}>
      {/* ——— 视差背景层：固定，随滚动按 0.7x 平移（被折射克隆） ——— */}
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
            if (im.naturalWidth) setImgRatio(im.naturalHeight / im.naturalWidth)
          }}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>

      {/* 撑出滚动高度（含视差额外行程，保证底部可滚到） */}
      <div style={{ height: spacerH }} />

      {/* 内容层：覆盖在背景之上、随页面滚动 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `calc(100% - ${PANEL_W}px)`,
          zIndex: 1,
        }}
      >
        <LiquidGlassNav
          sceneRef={sceneRef}
          menus={MENUS}
          glass={p}
          scrollY={scrollY}
          top="34vh"
          rightOffset={PANEL_W}
        />

        <DraggableGlass sceneRef={sceneRef} glass={p} scrollY={scrollY} />
      </div>

      {/* ——— 调参面板（固定，不随滚动） ——— */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: PANEL_W,
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
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Tint color</span>
          <input
            type="color"
            value={p.tintColor}
            onChange={(e) => set('tintColor', e.target.value)}
          />
        </label>

        {/* 快捷预设 */}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
