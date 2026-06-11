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

const REF = 1000
const CAP_H = 1800
const BASE_STROKE_FRAC = 0.07  // base stroke as fraction of cap height

/**
 * Build path + padded viewBox for rendering `text`.
 *
 * strokeWidthMult scales the visible border width for TWO_COLOR and HOLLOW.
 * The viewBox is padded so the outer half of the rendered stroke is never clipped.
 */
export function buildCollegeGlyphs(font, text, strokeWidthMult = 1) {
  const upper = (text || '').toUpperCase()
  const fontSize = REF * font.unitsPerEm / CAP_H
  const path = font.getPath(upper, 0, REF, fontSize)
  const d = path.toPathData(2)
  const bb = path.getBoundingBox()

  const baseStrokeW = REF * BASE_STROKE_FRAC
  // For TWO_COLOR and HOLLOW the actual SVG strokeWidth = baseStrokeW * strokeWidthMult * 2.
  // paint-order="stroke" makes the fill cover the INNER half, so the visible border outside
  // the fill region = baseStrokeW * strokeWidthMult. That's what needs to fit in the padding.
  const pad = baseStrokeW * strokeWidthMult + 6

  const vbX = bb.x1 - pad
  const vbY = bb.y1 - pad
  const vbW = Math.max(bb.x2 - bb.x1, 1) + pad * 2
  const vbH = Math.max(bb.y2 - bb.y1, 1) + pad * 2

  return { d, baseStrokeW, strokeWidthMult, vbX, vbY, vbW, vbH }
}

/**
 * Draw college font text onto a canvas 2d context.
 * Matches the SVG preview behaviour (paint-order="stroke" equivalent).
 */
export async function drawCollegeFontOnCanvas(ctx, el, W, H) {
  if (!el?.text?.trim()) return
  const font = await loadCollegeFont()
  const mlt = el.strokeWidthMult ?? 1
  const g = buildCollegeGlyphs(font, el.text, mlt)

  const drawnW = el.size / 100 * W
  const scale = drawnW / g.vbW
  const drawnH = g.vbH * scale
  const topLeftX = el.x / 100 * W - drawnW / 2
  const topLeftY = el.y / 100 * H - drawnH / 2

  const p2d = new Path2D(g.d)
  ctx.save()
  ctx.translate(topLeftX, topLeftY)
  ctx.scale(scale, scale)
  ctx.translate(-g.vbX, -g.vbY)
  ctx.lineJoin = 'round'

  const actualStrokeW = g.baseStrokeW * mlt * 2

  if (el.style === 'TWO_COLOR') {
    // stroke first (border behind fill), then fill on top
    ctx.strokeStyle = el.strokeColor || '#888888'
    ctx.lineWidth = actualStrokeW
    ctx.stroke(p2d)
    ctx.fillStyle = el.color
    ctx.fill(p2d, 'evenodd')

  } else if (el.style === 'HOLLOW') {
    const fc = el.fillColor
    const transparent = !fc || fc === 'transparent' || fc === 'none'
    if (transparent) {
      // pure outline: single-width centered stroke, interior shows the product
      ctx.strokeStyle = el.color
      ctx.lineWidth = g.baseStrokeW * mlt
      ctx.stroke(p2d)
    } else {
      // opaque interior: thick stroke first, fill covers the inner half
      ctx.strokeStyle = el.color
      ctx.lineWidth = actualStrokeW
      ctx.stroke(p2d)
      ctx.fillStyle = fc
      ctx.fill(p2d, 'evenodd')
    }

  } else {
    ctx.fillStyle = el.color
    ctx.fill(p2d, 'evenodd')
  }

  ctx.restore()
}
