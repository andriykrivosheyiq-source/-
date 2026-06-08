/**
 * Vectorization service — converts raster image (PNG/JPG) to SVG
 * using Vectorizer.ai API (https://vectorizer.ai/api).
 *
 * Set in .env:
 *   VITE_VECTORIZER_API_ID=vk-...
 *   VITE_VECTORIZER_API_SECRET=...
 */

const API_URL = 'https://api.vectorizer.ai/api/v1/vectorize'
const API_ID = import.meta.env.VITE_VECTORIZER_API_ID || ''
const API_SECRET = import.meta.env.VITE_VECTORIZER_API_SECRET || ''

/**
 * Vectorize a raster image (PNG/JPG/etc) → SVG string via Vectorizer.ai.
 * @param {File|Blob} imageFile
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} SVG content
 */
export async function vectorizeImage(imageFile, signal) {
  if (!API_ID || !API_SECRET) {
    throw new Error(
      'Vectorizer.ai API credentials missing. ' +
      'Add VITE_VECTORIZER_API_ID and VITE_VECTORIZER_API_SECRET to .env'
    )
  }

  const form = new FormData()
  form.append('image', imageFile)
  // mode=test is free but adds watermark; mode=production uses credits
  const mode = import.meta.env.VITE_VECTORIZER_MODE || 'test'
  form.append('mode', mode)

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${API_ID}:${API_SECRET}`),
    },
    body: form,
    signal,
  })

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText)
    throw new Error(`Vectorizer.ai error ${resp.status}: ${msg}`)
  }

  return resp.text()
}
