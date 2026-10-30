/** Cálculo de contraste WCAG 2.x (sin dependencias) para validar los tokens. */

export interface Rgb {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Color hexadecimal inválido: ${hex}`)
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Mezcla `top` con opacidad `alpha` sobre `bottom`. */
export function blend(top: Rgb, bottom: Rgb, alpha: number): Rgb {
  return {
    r: Math.round(top.r * alpha + bottom.r * (1 - alpha)),
    g: Math.round(top.g * alpha + bottom.g * (1 - alpha)),
    b: Math.round(top.b * alpha + bottom.b * (1 - alpha))
  }
}

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}
