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

// Reference glyph cap-height in path units. All geometry is computed at this
// scale, then mapped through a viewBox so preview (SVG) and export (canvas)
// render identically.
const REF = 1000
const CAP_H = 1800           // font cap height in font units
const STROKE_FRAC = 0.07     // outline thickness relative to cap height

/**
 * Build the glyph path + a padded viewBox for `text`.
 * The viewBox is padded by the stroke width so the OUTER outline is never
 * clipped (this was the "contours not always drawn" bug). Returns geometry
 * in REF units; the consumer maps it to pixels via the viewBox.
 */
export function buildCollegeGlyphs(font, text, style = 'SOLID') {
  const upper = (text || '').toUpperCase()
  const fontSize = REF * font.unitsPerEm / CAP_H
  const path = font.getPath(upper, 0, REF, fontSize)   // baseline at y=REF
  const d = path.toPathData(2)
  const bb = path.getBoundingBox()                      // tight ink bounds

  const strokeW = REF * STROKE_FRAC
  // TWO_COLOR draws a stroke of width strokeW*2 (half = strokeW outside the
  // ink), so pad by strokeW plus a small margin to guarantee no clipping.
  const pad = strokeW + 6

  const vbX = bb.x1 - pad
  const vbY = bb.y1 - pad
  const vbW = Math.max(bb.x2 - bb.x1, 1) + pad * 2
  const vbH = Math.max(bb.y2 - bb.y1, 1) + pad * 2

  return { d, strokeW, vbX, vbY, vbW, vbH }
}

/**
 * Draw the College Block text onto a 2d canvas context, mapping the padded
 * viewBox so the result matches the on-screen SVG preview exactly.
 * el: { x, y, size, style, color, fillColor, strokeColor, text }
 *   style: 'SOLID' | 'TWO_COLOR' | 'HOLLOW'
 */
export async function drawCollegeFontOnCanvas(ctx, el, W, H) {
  if (!el?.text?.trim()) return
  const font = await loadCollegeFont()
  const g = buildCollegeGlyphs(font, el.text, el.style)

  const drawnW = el.size / 100 * W          // word width on the product
  const scale = drawnW / g.vbW
  const drawnH = g.vbH * scale
  const topLeftX = el.x / 100 * W - drawnW / 2
  const topLeftY = el.y / 100 * H - drawnH / 2

  const p2d = new Path2D(g.d)
  ctx.save()
  ctx.translate(topLeftX, topLeftY)
  ctx.scale(scale, scale)
  ctx.translate(-g.vbX, -g.vbY)             // map viewBox origin (mirrors SVG)
  ctx.lineJoin = 'round'

  if (el.style === 'TWO_COLOR') {
    ctx.strokeStyle = el.strokeColor || '#888888'
    ctx.lineWidth = g.strokeW * 2
    ctx.stroke(p2d)                          // border behind the fill
    ctx.fillStyle = el.color
    ctx.fill(p2d, 'evenodd')
  } else if (el.style === 'HOLLOW') {
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fillStyle = el.fillColor
      ctx.fill(p2d, 'evenodd')
    }
    ctx.strokeStyle = el.color
    ctx.lineWidth = g.strokeW
    ctx.stroke(p2d)
  } else {
    ctx.fillStyle = el.color
    ctx.fill(p2d, 'evenodd')
  }
  ctx.restore()
}
