# Liquid Glass

Apple-style **liquid glass** for the web — real edge refraction, chromatic aberration and specular highlights, implemented as a reusable React component.

**🔗 Live demo: https://cocolayuan.github.io/liquid-glass/**

> *English below · [中文见下方](#中文)*

---

## What this solves

Most "glassmorphism" on the web is just `backdrop-filter: blur()` — a flat frosted panel. Real glass **bends** the background at its edges. Doing that on the web has two hard problems, both solved here:

1. **Cross-browser refraction.** True refraction needs an SVG `feDisplacementMap`. Applying it through `backdrop-filter` only works in Chromium — **Safari and Firefox can't**. This project instead applies the displacement via CSS `filter: url(#…)` onto a **live clone of the scene behind the glass**, and re-mints the filter id every repaint to defeat Safari's filter caching. Result: the refraction works in **Chrome, Safari and Firefox**.

2. **Works over *any* webpage.** The glass doesn't need a special background — it clones whatever real DOM sits behind it, auto-aligns the clone, and **re-aligns on scroll & resize**. Drop `<LiquidGlass>` over an image, a video, a list, a map — it just refracts it.

## How it works

1. A canvas builds a **displacement map** from the rounded-rect **signed distance field (SDF)** — R channel = X shift, G = Y shift, concentrated near the edge.
2. The map feeds an SVG `<feDisplacementMap>`.
3. `filter: url(#id)` is applied to a **cloned, aligned copy** of the scene behind the glass (not `backdrop-filter`, which Safari can't do with SVG).
4. A **fresh filter id every repaint** bypasses Safari's filter-result cache (technique from the Aave team).
5. Layers on top: blur · color tint · specular bevel — composited and clipped to the rounded rect.

## Features

- 🌈 **Real edge refraction** + chromatic aberration + specular highlight
- 🧭 **Directional refraction** — `bias` + `biasAngle` enlarge the refraction on any chosen edge/corner ("thicker glass on one side")
- 🎛️ **Live control panel** — depth · splay · feather · curve · bias · blur · chroma · glint · frost · tint
- 🪟 **Presets** — Simple · Thick · Frosted · Cut · Dark glass
- 🖱️ **Draggable module** with click-to-minimize/expand animation (rAF size tween)
- ✨ **Magic-Move dropdown** — one shared glass that slides + morphs between menu items (Keynote-style)
- 🌀 **Parallax scrolling background** — the glass refraction follows the scroll, perfectly aligned

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build to /dist
```

## Use the component

```tsx
import LiquidGlass from './components/LiquidGlass'

// sceneRef points to the element you want refracted (the background)
<div ref={bgRef}>{/* any background content */}</div>

<LiquidGlass sceneRef={bgRef} width={230} height={280} depth={62} chroma={0.03}>
  {/* your menu / card content, rendered on top of the glass */}
</LiquidGlass>
```

The only requirement: the content you want refracted must live inside the `sceneRef` element.

## Tech

Vite · React · TypeScript · SVG filters · Canvas — **no runtime dependencies** beyond React.

---

<a name="中文"></a>

## 中文

Web 端的 **Apple 液态玻璃**效果 —— 真实的边缘折射、色散、镜面高光，封装成一个可复用的 React 组件。

**🔗 在线 Demo:https://cocolayuan.github.io/liquid-glass/**

### 解决了什么

网上大多数"玻璃拟态"只是 `backdrop-filter: blur()` —— 一块扁平的磨砂板。真正的玻璃会在**边缘折射**背后的内容。要在 Web 上做到这点有两个难题,本项目都解决了:

1. **跨浏览器折射。** 真折射需要 SVG `feDisplacementMap`,但把它用在 `backdrop-filter` 上**只有 Chromium 支持,Safari / Firefox 不行**。本项目改用 CSS `filter: url(#…)` 作用在**玻璃背后场景的实时克隆**上,并在每次重绘时换一个新的 filter id 绕过 Safari 的滤镜缓存 —— 于是折射在 **Chrome / Safari / Firefox 全部生效**。

2. **适配任意网页。** 玻璃不需要特制背景 —— 它克隆背后真实的 DOM、自动对齐,并在**滚动和缩放时重新对齐**。把 `<LiquidGlass>` 盖在图片、视频、列表、地图上,它都能折射。

### 原理

1. 用 canvas 按圆角矩形的**有向距离场(SDF)**生成**位移贴图**(R=X 位移、G=Y 位移,集中在边缘)。
2. 贴图喂进 SVG `<feDisplacementMap>`。
3. 用 `filter: url(#id)` 作用在**克隆并对齐**的背景副本上(不是 `backdrop-filter`,Safari 不支持 SVG 版)。
4. **每次重绘换新 filter id**,绕过 Safari 的滤镜结果缓存(技巧来自 Aave 团队)。
5. 上层叠加:模糊 · 染色 · 镜面斜面 —— 合成后裁剪成圆角。

### 功能

- 🌈 **真实边缘折射** + 色散 + 镜面高光
- 🧭 **有向折射** —— `bias` + `biasAngle` 把折射放大区放到任意边/角(模拟"一侧更厚的玻璃")
- 🎛️ **实时调参面板** —— 深度 · 边宽 · 羽化 · 曲率 · 偏向 · 模糊 · 色散 · 高光 · 磨砂 · 染色
- 🪟 **预设** —— 轻薄 · 厚玻璃 · 磨砂 · 切割 · 暗色玻璃
- 🖱️ **可拖动模块**,点击收起/展开动画(rAF 尺寸缓动)
- ✨ **Magic-Move 下拉** —— 单个共享玻璃在菜单间滑动 + 变形(Keynote 神奇移动)
- 🌀 **视差滚动背景** —— 玻璃折射跟随滚动,精确对齐

### 本地运行

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 打包到 /dist
```

### 组件用法

```tsx
import LiquidGlass from './components/LiquidGlass'

// sceneRef 指向你想被折射的元素(背景)
<div ref={bgRef}>{/* 任意背景内容 */}</div>

<LiquidGlass sceneRef={bgRef} width={230} height={280} depth={62} chroma={0.03}>
  {/* 你的菜单 / 卡片内容,渲染在玻璃之上 */}
</LiquidGlass>
```

唯一要求:想被折射的内容必须放在 `sceneRef` 元素内部。

### 技术栈

Vite · React · TypeScript · SVG 滤镜 · Canvas —— 除 React 外**零运行时依赖**。
