/**
 * Vectorization service — converts raster image (PNG/JPG) to SVG
 * using ImageTracer.js (runs entirely in the browser, no API key needed).
 *
 * Same algorithm as vtracer on the Hetzner server:
 * raster pixels → color quantization → SVG paths.
 */
import ImageTracer from 'imagetracerjs'

// Presets tuned for embroidery: clean paths, limited colors, no tiny noise
const EMBROIDERY_OPTIONS = {
  // Color quantization
  numberofcolors: 16,
  colorsampling: 1,
  colorquantcycles: 5,
  // Path smoothing
  ltres: 1,
  qtres: 1,
  pathomit: 16,
  rightangleenhance: true,
  // Stroke / fill
  strokewidth: 0,
  linefilter: false,
  // Scale
  scale: 1,
  roundcoords: 1,
}

/**
 * Vectorize a raster image File (PNG/JPG) → SVG string.
 * Runs in the browser — no server, no API key, no cost.
 * @param {File|Blob} imageFile
 * @returns {Promise<string>} SVG content
 */
export function vectorizeImage(imageFile) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageFile)
    const img = new Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const svg = ImageTracer.imagedataToSVG(imageData, EMBROIDERY_OPTIONS)
        resolve(svg)
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не вдалось завантажити зображення для векторизації'))
    }

    img.src = url
  })
}
