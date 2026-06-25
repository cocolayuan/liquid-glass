// 液态玻璃参数类型 + 默认值 + 预设（被各组件复用）

export interface GlassParams {
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

// 当前调好的「清透绕圈」默认外观
export const DEFAULT_GLASS: GlassParams = {
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
}

// 5 套快捷预设
export const PRESETS: Record<string, GlassParams> = {
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
