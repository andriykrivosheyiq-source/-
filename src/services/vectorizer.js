/**
 * Vectorization — converts raster PNG (already background-removed) to SVG.
 * Uses ImageTracer.js, runs entirely in the browser, no API key needed.
 */
import ImageTracer from 'imagetracerjs'

const OPTIONS = {
  numberofcolors: 16,
  colorsampling: 1,
  colorquantcycles: 3,
  ltres: 1,
  qtres: 1,
  pathomit: 32,
  rightangleenhance: false,
  strokewidth: 0,
  linefilter: true,
  blurradius: 0,
  scale: 1,
  roundcoords: 1,
}

/**
 * Crop a PNG blob to non-transparent/non-white content with 4% padding,
 * then resize to max 800px. Speeds up vectorization and avoids empty space.
 */
export function preprocessBlob(blob) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const { data } = ctx.getImageData(0, 0, W, H)
      let x0 = W, y0 = H, x1 = 0, y1 = 0, found = false
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4
          const a = data[i + 3], r = data[i], g = data[i + 1], b = data[i + 2]
          if (a > 30 && (r < 240 || g < 240 || b < 240)) {
            if (x < x0) x0 = x; if (y < y0) y0 = y
            if (x > x1) x1 = x; if (y > y1) y1 = y
            found = true
          }
        }
      }
      if (!found || x1 <= x0 || y1 <= y0) { resolve(blob); return }
      const pad = Math.max(8, Math.round(Math.max(x1 - x0, y1 - y0) * 0.04))
      const sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad)
      const sw = Math.min(W - sx, x1 - x0 + pad * 2)
      const sh = Math.min(H - sy, y1 - y0 + pad * 2)
      const MAX = 800
      const scale = Math.min(1, MAX / Math.max(sw, sh))
      const out = document.createElement('canvas')
      out.width = Math.round(sw * scale); out.height = Math.round(sh * scale)
      out.getContext('2d').drawImage(c, sx, sy, sw, sh, 0, 0, out.width, out.height)
      out.toBlob(b => resolve(b || blob), 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob) }
    img.src = url
  })
}

/**
 * Vectorize a PNG Blob → SVG string.
 * @param {Blob} blob - PNG with transparent or white background
 * @returns {Promise<string>} SVG markup
 */
export function vectorizeBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth; c.height = img.naturalHeight
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const svg = ImageTracer.imagedataToSVG(ctx.getImageData(0, 0, c.width, c.height), OPTIONS)
        resolve(svg)
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}
