/**
 * Vectorization service.
 *
 * Primary path:  POST to Hetzner server  (rembg bg-removal + vtracer quality)
 * Fallback path: ImageTracer.js          (runs in browser, no server needed)
 */
import ImageTracer from 'imagetracerjs'

const HETZNER_URL = import.meta.env.VITE_HETZNER_VECTORIZE_URL // e.g. https://embroider.duckdns.org:8443

// Presets tuned for embroidery: clean paths, limited colors, no tiny noise
const EMBROIDERY_OPTIONS = {
  numberofcolors: 16,
  colorsampling: 1,
  colorquantcycles: 3,
  ltres: 2,
  qtres: 2,
  pathomit: 48,
  rightangleenhance: false,
  strokewidth: 0,
  linefilter: true,
  blurradius: 1,
  blurdelta: 20,
  scale: 1,
  roundcoords: 1,
}

/**
 * Vectorize an image URL via the Hetzner server.
 * Server performs rembg background removal + vtracer vectorization.
 * @param {string} imageUrl — publicly reachable image URL
 * @returns {Promise<string>} SVG content
 */
export async function vectorizeFromUrl(imageUrl) {
  if (!HETZNER_URL) throw new Error('VITE_HETZNER_VECTORIZE_URL not configured')
  const res = await fetch(`${HETZNER_URL}/api/vectorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Hetzner vectorize ${res.status}: ${text}`)
  }
  return res.text()
}

/**
 * Vectorize a raster image File/Blob → SVG string (browser fallback).
 * Runs entirely in the browser — no server needed.
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
