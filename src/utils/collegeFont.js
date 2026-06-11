import opentype from 'opentype.js'

let _promise = null

export function loadCollegeFont() {
  if (!_promise) {
    _promise = fetch(import.meta.env.BASE_URL + 'fonts/College_Block_2.0.otf')
      .then(r => r.arrayBuffer())
      .then(ab => opentype.parse(ab))
      .catch(e => { _promise = null; throw e })
  }
  return _promise
}

// Glyph height reference (cap height in font units ≈ 1800)
const CAP_H = 1800

/**
 * Return SVG path data + total advance width for rendering `text` at `targetPx` tall.
 * The path origin is (0, 0); total bounding box: width=totalW, height=targetPx.
 */
export function getCollegePath(font, text, targetPx) {
  const fontSize = targetPx * font.unitsPerEm / CAP_H
  const upper = text.toUpperCase()
  const path = font.getPath(upper, 0, targetPx, fontSize)
  const d = path.toPathData(2)
  const totalW = font.getAdvanceWidth(upper, fontSize)
  return { d, w: Math.max(totalW, 1), h: targetPx }
}

/**
 * Draw college font text onto a canvas 2d context.
 * style: 'SOLID' | 'TWO_COLOR' | 'HOLLOW'
 * el: { x, y, size, color, fillColor, style, text }
 */
export async function drawCollegeFontOnCanvas(ctx, el, W, H) {
  if (!el?.text?.trim()) return
  const font = await loadCollegeFont()
  const targetPx = el.size / 100 * W
  const fontSize = targetPx * font.unitsPerEm / CAP_H
  const upper = el.text.trim().toUpperCase()
  const totalW = font.getAdvanceWidth(upper, fontSize)
  const ox = el.x / 100 * W - totalW / 2
  const oy = el.y / 100 * H - targetPx / 2
  const path = font.getPath(upper, ox, oy + targetPx, fontSize)
  const p2d = new Path2D(path.toPathData(2))

  const strokeW = targetPx * 0.07

  if (el.style === 'TWO_COLOR') {
    ctx.save()
    ctx.strokeStyle = el.strokeColor || '#888888'
    ctx.lineWidth = strokeW * 2
    ctx.lineJoin = 'round'
    ctx.stroke(p2d)
    ctx.fillStyle = el.color
    ctx.fill(p2d, 'evenodd')
    ctx.restore()
  } else if (el.style === 'HOLLOW') {
    ctx.save()
    ctx.fillStyle = el.fillColor || 'transparent'
    if (el.fillColor && el.fillColor !== 'transparent') ctx.fill(p2d, 'evenodd')
    ctx.strokeStyle = el.color
    ctx.lineWidth = strokeW
    ctx.lineJoin = 'round'
    ctx.stroke(p2d)
    ctx.restore()
  } else {
    ctx.save()
    ctx.fillStyle = el.color
    ctx.fill(p2d, 'evenodd')
    ctx.restore()
  }
}
