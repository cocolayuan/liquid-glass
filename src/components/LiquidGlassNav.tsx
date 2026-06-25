import { useEffect, useRef, useState, type RefObject } from 'react'
import LiquidGlass from './LiquidGlass'
import { DEFAULT_GLASS, type GlassParams } from './presets'

/**
 * LiquidGlassNav —— Magic-Move 液态玻璃下拉导航。
 * 一个共享玻璃容器在菜单之间「神奇移动」：滑动 + 变形 + 内容交叉淡入，折射实时跟随。
 * 传入 menus 即可用；宽度按最长项自动测量。
 *
 * 需要全局 keyframes `lgFade`（纯透明度淡入）—— 见 index.css。
 */
const ITEM_H = 56
const MENU_PADV = 14
const LINK_FONT = '500 22px Questrial, sans-serif'

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// 用 canvas 测量菜单需要的宽度（最长项 + 内边距）
let _ctx: CanvasRenderingContext2D | null = null
function measureMenuWidth(items: string[]): number {
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d')
  if (!_ctx) return 200
  _ctx.font = LINK_FONT
  const maxText = Math.max(...items.map((t) => _ctx!.measureText(t).width))
  return Math.ceil(maxText + 18 * 2 + 10 * 2 + 8) // 链接padding + 容器padding + 余量
}

export interface LiquidGlassNavProps {
  sceneRef: RefObject<HTMLElement | null>
  /** 菜单数据：{ 标题: [项, ...] } */
  menus: Record<string, string[]>
  glass?: GlassParams
  scrollY?: number
  /** 导航在屏幕上的纵向位置 */
  top?: number | string
  /** 右侧让出的宽度（如有侧栏） */
  rightOffset?: number
  onSelect?: (menu: string, item: string) => void
}

export default function LiquidGlassNav({
  sceneRef,
  menus,
  glass = DEFAULT_GLASS,
  scrollY = 0,
  top = '34vh',
  rightOffset = 0,
  onSelect,
}: LiquidGlassNavProps) {
  const keys = Object.keys(menus)
  const [open, setOpen] = useState<string | null>(null)
  const [displayKey, setDisplayKey] = useState<string>(keys[0] ?? '')
  const [geo, setGeo] = useState<{ x: number; w: number; h: number } | null>(null)

  const navRef = useRef<HTMLElement>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const geoRef = useRef<{ x: number; w: number; h: number } | null>(null)
  const geoRaf = useRef(0)
  const widthsRef = useRef<Record<string, number>>({})

  // 预测量各菜单宽度
  if (Object.keys(widthsRef.current).length !== keys.length) {
    const w: Record<string, number> = {}
    for (const k of keys) w[k] = measureMenuWidth(menus[k])
    widthsRef.current = w
  }

  const menuHeight = (key: string) => menus[key].length * ITEM_H + MENU_PADV * 2

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
    const w = widthsRef.current[open]
    const h = menuHeight(open)
    const cx = bRect.left - navRect.left + bRect.width / 2
    const target = { x: cx - w / 2, w, h }
    cancelAnimationFrame(geoRaf.current)
    if (!geoRef.current) {
      geoRef.current = target
      setGeo(target)
      return
    }
    const from = geoRef.current
    const dur = 320
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const e = easeInOut(Math.min(1, (now - start) / dur))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <nav
      ref={navRef}
      onMouseLeave={() => setOpen(null)}
      style={{
        position: 'fixed',
        top,
        left: 0,
        right: rightOffset,
        zIndex: 5,
        display: 'flex',
        justifyContent: 'center',
        gap: 52,
        color: '#fff',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontSize: 23,
        textShadow: '0 1px 6px rgba(0,0,0,0.4)',
      }}
    >
      {keys.map((key) => (
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
              fontSize: 16,
            }}
          >
            ⌄
          </span>
        </button>
      ))}

      {/* 共享玻璃容器：在菜单间滑动 + 变形 */}
      {geo && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: geo.x,
            width: geo.w,
            paddingTop: 14,
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
            radius={glass.radius}
            depth={glass.depth}
            splay={glass.splay}
            feather={glass.feather}
            curve={glass.curve}
            bias={glass.bias}
            biasAngle={glass.biasAngle}
            blur={glass.blur}
            chroma={glass.chroma}
            glint={glass.glint}
            frost={glass.frost}
            tint={glass.tint}
            tintColor={glass.tintColor}
            repaintKey={`${Math.round(geo.x)},${geo.w},${geo.h},${Math.round(scrollY)}`}
          >
            <div
              key={displayKey}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: `${MENU_PADV}px 10px`,
                animation: 'lgFade 0.22s ease',
              }}
            >
              {(menus[displayKey] ?? []).map((item) => (
                <a
                  key={item}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onSelect?.(displayKey, item)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: ITEM_H,
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 22,
                    fontWeight: 500,
                    padding: '0 18px',
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
  )
}
