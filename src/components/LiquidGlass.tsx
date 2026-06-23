import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'

/**
 * LiquidGlass —— 跨浏览器液态玻璃（忠实移植 mr-tipton CodePen 的核心技术）
 *
 * 核心原理（与原版一致）：
 *  1. 用 canvas 按「有向距离场(SDF)」算出一张位移贴图(PNG)，边缘根据圆角法线方向折射。
 *  2. 把贴图喂进 SVG <feDisplacementMap>。
 *  3. 用 CSS `filter: url(#id)`（注意不是 backdrop-filter —— Safari 不支持 SVG backdrop-filter）
 *     作用在「场景的一份克隆」上，克隆被定位得与真实场景严丝合缝对齐，于是看起来就是玻璃在折射背后的内容。
 *  4. 每次重绘都换一个新的 filter id —— 绕过 Safari 对 filter 结果的缓存。（来自 Aave 团队的技巧）
 *
 * 与原版差异：原版是可拖拽的镜片 playground；这里改造成「弹窗背景」——
 *   传入要折射的场景元素 ref(sceneRef)，组件自动克隆它并对齐，children 渲染在玻璃之上(不折射)。
 */

const PAD = 24 // 贴图在镜片四周留出的余量(px)，给折射采样空间
const SS = 1 // 超采样倍率(1=不超采样；2 会让滤镜像素翻 4 倍，Safari 60fps 扛不住)
const BOOST = 0.8 // 位移强度微调

export interface LiquidGlassProps {
  /** 要被折射的「场景」元素（通常是背景层），组件会克隆它并对齐 */
  sceneRef: RefObject<HTMLElement | null>
  width: number
  height: number
  radius?: number
  /** 折射深度(位移 scale，越大边缘越夸张) */
  depth?: number
  /** 边缘折射带宽度 */
  splay?: number
  /** 边缘羽化 */
  feather?: number
  /** 折射轮廓曲率 */
  curve?: number
  /** 有向折射：放大程度 0~1.5（0=四周对称） */
  bias?: number
  /** 有向折射方向(度)：0=右 90=下 45=右下 -135=左上 */
  biasAngle?: number
  /** 背景模糊 px */
  blur?: number
  /** 色散强度 0~0.25（边缘彩边，subtle 即可） */
  chroma?: number
  /** 高光强度 0~150 */
  glint?: number
  /** 玻璃磨砂底（白）不透明度 0~1，给玻璃实体厚度感 */
  frost?: number
  /** 玻璃染色不透明度 0~1 */
  tint?: number
  tintColor?: string
  /** 任意值变化时强制重绘对齐（如拖动时传入位置，使折射跟随移动） */
  repaintKey?: number | string
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v)

// ——— 构建 SDF 位移贴图（移植自原版 buildLensMap）———
const mapCache = new Map<string, string>()
function buildLensMap(
  mw: number,
  mh: number,
  winW: number,
  winH: number,
  radius: number,
  rim: number,
  curve: number,
  feather: number,
  bias: number,
  biasAngle: number,
): string {
  const key = `${mw}:${mh}:${winW}:${winH}:${radius}:${rim}:${curve}:${feather}:${bias}:${biasAngle}`
  const hit = mapCache.get(key)
  if (hit) return hit

  const cv = document.createElement('canvas')
  cv.width = mw
  cv.height = mh
  const ctx = cv.getContext('2d')!
  const img = ctx.createImageData(mw, mh)
  const px = img.data

  // 折射放大方向（屏幕坐标，y 向下）：0°=右, 90°=下, 45°=右下, -135°=左上
  const ar = (biasAngle * Math.PI) / 180
  const dax = Math.cos(ar)
  const day = Math.sin(ar)

  const hx = winW / 2
  const hy = winH / 2
  // 到圆角矩形边缘的有向距离
  const sdf = (x: number, y: number) => {
    const qx = Math.abs(x - mw / 2) - (hx - radius)
    const qy = Math.abs(y - mh / 2) - (hy - radius)
    const ox = Math.max(qx, 0)
    const oy = Math.max(qy, 0)
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius
  }

  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const cx = x + 0.5
      const cy = y + 0.5
      const s = sdf(cx, cy)
      const gx = sdf(cx + 1, cy) - sdf(cx - 1, cy)
      const gy = sdf(cx, cy + 1) - sdf(cx, cy - 1)
      const len = Math.hypot(gx, gy) || 1
      const nx = gx / len
      const ny = gy / len
      // 有向折射：法线越对齐设定方向的边，位移带越宽、越强
      const dir = nx * dax + ny * day // -1=反方向边, +1=设定方向边
      const dw = Math.max(0.25, 1 + bias * dir) // 带宽方向系数
      const span = (s < 0 ? rim + feather : rim) * dw
      let amt = Math.max(0, 1 - Math.abs(s) / span)
      amt = amt * amt * amt * (amt * (amt * 6 - 15) + 10) // smootherstep
      amt = Math.pow(amt, curve)
      amt *= Math.max(0.5, 1 + bias * dir * 0.5) // 右下折射强度也略增
      const i = (y * mw + x) * 4
      px[i] = clamp255(Math.round(127.5 - nx * amt * 127 * BOOST)) // R = x 位移
      px[i + 1] = clamp255(Math.round(127.5 - ny * amt * 127 * BOOST)) // G = y 位移
      px[i + 2] = 128
      px[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const url = cv.toDataURL('image/png')
  if (mapCache.size > 300) mapCache.delete(mapCache.keys().next().value!)
  mapCache.set(key, url)
  return url
}

export function LiquidGlass({
  sceneRef,
  width,
  height,
  radius = 24,
  depth = 62,
  splay = 3,
  feather = 13,
  curve = 2.8,
  bias = 0.7,
  biasAngle = 45,
  blur = 0.5,
  chroma = 0.025,
  glint = 36,
  frost = 0.05,
  tint = 0,
  tintColor = '#ffffff',
  repaintKey,
  children,
  className,
  style,
}: LiquidGlassProps) {
  const rawId = useId()
  const versionRef = useRef(0)

  const lensRef = useRef<HTMLDivElement>(null)
  const refractionRef = useRef<HTMLDivElement>(null)
  const cloneWrapRef = useRef<HTMLDivElement>(null)
  const housingRef = useRef<SVGSVGElement>(null)

  const MAP_W = (width + 2 * PAD) * SS
  const MAP_H = (height + 2 * PAD) * SS

  // 注入 filter（每次换新 id，绕过 Safari 缓存）
  const applyFilter = (mapUrl: string) => {
    const housing = housingRef.current
    const refraction = refractionRef.current
    if (!housing || !refraction) return
    const id = `${rawId.replace(/[:]/g, '')}-v${++versionRef.current}`
    const sc = depth * SS

    // 色散：红色用更大位移、绿/蓝用更小位移，分两次位移后按通道合成（移植自原版）
    let disp: string
    if (chroma > 0) {
      const sR = sc * (1 + chroma)
      const sB = sc * (1 - chroma)
      disp = `
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${sR}" xChannelSelector="R" yChannelSelector="G" result="dR"/>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${sB}" xChannelSelector="R" yChannelSelector="G" result="dGB"/>
        <feColorMatrix in="dR"  type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>
        <feColorMatrix in="dGB" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cGB"/>
        <feComposite in="cR" in2="cGB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="disp"/>`
    } else {
      disp = `<feDisplacementMap in="SourceGraphic" in2="map" scale="${sc}" xChannelSelector="R" yChannelSelector="G" result="disp"/>`
    }

    housing.innerHTML = `
      <defs>
        <filter id="${id}" x="0" y="0" width="100%" height="100%"
                filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
          <feImage href="${mapUrl}" xlink:href="${mapUrl}"
                   x="0" y="0" width="${MAP_W}" height="${MAP_H}" preserveAspectRatio="none" result="map"/>
          ${disp}
        </filter>
      </defs>`
    refraction.style.filter = `url(#${id})`
  }

  // 把场景克隆进镜片，并对齐
  const repaint = () => {
    const scene = sceneRef.current
    const lens = lensRef.current
    const cloneWrap = cloneWrapRef.current
    const refraction = refractionRef.current
    if (!scene || !lens || !cloneWrap || !refraction) return

    const sceneRect = scene.getBoundingClientRect()
    const lensRect = lens.getBoundingClientRect()
    const lensLeftInScene = lensRect.left - sceneRect.left
    const lensTopInScene = lensRect.top - sceneRect.top

    // 克隆场景内容并铺成场景原尺寸
    cloneWrap.innerHTML = scene.innerHTML
    cloneWrap.style.width = `${sceneRect.width}px`
    cloneWrap.style.height = `${sceneRect.height}px`
    cloneWrap.style.left = `${-(lensLeftInScene - PAD)}px`
    cloneWrap.style.top = `${-(lensTopInScene - PAD)}px`

    applyFilter(
      buildLensMap(
        MAP_W,
        MAP_H,
        width * SS,
        height * SS,
        radius * SS,
        splay * SS,
        curve,
        feather * SS,
        bias,
        biasAngle,
      ),
    )
  }

  useLayoutEffect(() => {
    repaint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, radius, depth, splay, feather, curve, bias, biasAngle, chroma, repaintKey])

  // 跟随滚动 / 窗口尺寸变化重绘对齐
  useEffect(() => {
    const onChange = () => repaint()
    window.addEventListener('scroll', onChange, true)
    window.addEventListener('resize', onChange)
    const ro = new ResizeObserver(onChange)
    if (sceneRef.current) ro.observe(sceneRef.current)
    return () => {
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('resize', onChange)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={lensRef}
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: radius,
        isolation: 'isolate',
        // 极淡投影：只留一点点悬浮感，不要厚重黑边
        boxShadow: '0 6px 22px rgba(0,0,0,0.12)',
        ...style,
      }}
    >
      {/* 内层裁剪：把带 filter/blend 的合成层裁成圆角（WebKit 下这些层会逃出父级 overflow 裁剪） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 round ${radius}px)`,
        }}
      >
        {/* 模糊层（独立于 url() filter，跨浏览器一致） */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            filter: blur > 0 ? `blur(${blur}px)` : 'none',
            willChange: 'filter',
          }}
        >
          {/* 折射层：承载场景克隆，应用位移滤镜 */}
          <div
            ref={refractionRef}
            style={{
              position: 'absolute',
              left: -PAD,
              top: -PAD,
              width: MAP_W,
              height: MAP_H,
              clipPath: `inset(${PAD * SS}px round ${radius * SS}px)`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              willChange: 'filter',
            }}
          >
            <div ref={cloneWrapRef} style={{ position: 'absolute', top: 0, left: 0 }} />
          </div>
        </div>

        {/* 磨砂底：给玻璃实体厚度感（无论背景多杂，玻璃都有一层淡淡的体积） */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            pointerEvents: 'none',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.10))',
            opacity: frost,
          }}
        />

        {/* 染色层 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
            background: tintColor,
            opacity: tint,
          }}
        />

        {/* 玻璃斜面：极淡的内高光，营造一点厚度但不出白边。强度由 glint 控制 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            pointerEvents: 'none',
            boxShadow:
              'inset 0.5px 0.5px 1px rgba(255,255,255,0.35), inset -0.5px -0.5px 1px rgba(255,255,255,0.18)',
            opacity: Math.min(1, glint / 100) * 0.6,
          }}
        />
      </div>

      {/* filter 容器（每帧重新注入） */}
      <svg
        ref={housingRef}
        width="0"
        height="0"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{ position: 'absolute' }}
      />

      {/* 真实内容：渲染在玻璃之上，不被折射 */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  )
}

export default LiquidGlass
