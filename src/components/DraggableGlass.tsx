import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import LiquidGlass from './LiquidGlass'
import { DEFAULT_GLASS, type GlassParams } from './presets'

/**
 * DraggableGlass —— 可拖动、点击收起/展开的液态玻璃卡片。
 * - 拖动移动位置；不拖动的点击 = 在「完整卡片」与「圆形按钮」间用 rAF 缓动切换。
 * - glass 传入玻璃外观参数（默认 DEFAULT_GLASS）。
 * - 折射跟随滚动：把外部 scrollY 传入，会一起进 repaintKey。
 */
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export interface DraggableGlassProps {
  sceneRef: RefObject<HTMLElement | null>
  glass?: GlassParams
  scrollY?: number
  /** 展开尺寸 */
  full?: { w: number; h: number }
  /** 收起尺寸（圆形） */
  mini?: { w: number; h: number }
  initialPos?: { x: number; y: number }
  children?: ReactNode
  style?: CSSProperties
}

export default function DraggableGlass({
  sceneRef,
  glass = DEFAULT_GLASS,
  scrollY = 0,
  full = { w: 300, h: 196 },
  mini = { w: 66, h: 66 },
  initialPos = { x: 720, y: 470 },
  children,
  style,
}: DraggableGlassProps) {
  const [minimized, setMinimized] = useState(false)
  const [s, setS] = useState({ w: full.w, h: full.h })
  const [pos, setPos] = useState(initialPos)
  const raf = useRef(0)
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })

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
    const next = !minimized
    setMinimized(next)
    animateTo(next ? mini : full)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

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
    if (!d.moved) toggle()
  }

  const fullness = (s.w - mini.w) / (full.w - mini.w) // 1=展开 0=收起
  const radius = minimized ? Math.min(s.w, s.h) / 2 : glass.radius

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 6,
        cursor: drag.current.active ? 'grabbing' : 'grab',
        touchAction: 'none',
        ...style,
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
          {/* 展开态内容（不传 children 时给个默认） */}
          <div style={{ opacity: fullness, width: '100%' }}>
            {children ?? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Liquid Glass
                </div>
                <div style={{ fontSize: 15, opacity: 0.85, marginTop: 6 }}>
                  拖动移动 · 点击收起/展开
                </div>
              </div>
            )}
          </div>
          {/* 收起态图标 */}
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
