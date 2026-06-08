/**
 * Vectorization service — converts a raster image (PNG/JPG) to SVG
 * by calling the Hetzner FastAPI server (vtracer-based pipeline).
 *
 * Server: http://46.62.193.193  (set VITE_VECTORIZER_URL to override)
 * Endpoint: POST /api/vectorize  multipart/form-data { file: <binary> }
 * Response: SVG text (Content-Type: image/svg+xml) or JSON { svg: "..." }
 */

const BASE_URL = (import.meta.env.VITE_VECTORIZER_URL || 'http://46.62.193.193').replace(/\/$/, '')

/**
 * Vectorize a raster image file (PNG/JPG/etc) → SVG string.
 * @param {File|Blob} imageFile
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} SVG content
 */
export async function vectorizeImage(imageFile, signal) {
  const form = new FormData()
  form.append('file', imageFile)

  const resp = await fetch(`${BASE_URL}/api/vectorize`, {
    method: 'POST',
    body: form,
    signal,
  })

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText)
    throw new Error(`Vectorizer error ${resp.status}: ${msg}`)
  }

  const ct = resp.headers.get('content-type') || ''
  if (ct.includes('svg') || ct.includes('xml')) {
    return resp.text()
  }

  // JSON response: { svg: "..." }
  const json = await resp.json()
  if (json.svg) return json.svg
  if (json.result) return json.result
  throw new Error('Unexpected vectorizer response format')
}
