/**
 * Vectorizer.ai API — AI-powered raster→SVG conversion.
 * Credentials: VITE_VECTORIZER_AI_ID and VITE_VECTORIZER_AI_SECRET
 * from vectorizer.ai dashboard.
 */
const API_ID     = import.meta.env.VITE_VECTORIZER_AI_ID
const API_SECRET = import.meta.env.VITE_VECTORIZER_AI_SECRET

export function isVectorizerAIConfigured() {
  return !!(API_ID && API_SECRET)
}

/**
 * Vectorize a PNG Blob using vectorizer.ai API.
 * Falls back to null so caller can use ImageTracer.js as fallback.
 * @param {Blob} blob
 * @returns {Promise<string>} SVG markup
 */
export async function vectorizeWithAI(blob) {
  if (!API_ID || !API_SECRET) throw new Error('VITE_VECTORIZER_AI_ID / VITE_VECTORIZER_AI_SECRET not configured')

  const form = new FormData()
  form.append('image', blob, 'image.png')
  form.append('output.svg.version', 'svg_1_1')

  const res = await fetch('https://vectorizer.ai/api/v1/vectorize', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${API_ID}:${API_SECRET}`) },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Vectorizer.ai ${res.status}: ${text}`)
  }

  return await res.text()
}
