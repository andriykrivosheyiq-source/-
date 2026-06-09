/**
 * Vectorizer.ai via Cloudflare Worker proxy (avoids browser CORS).
 * Worker handles Basic auth server-side — no credentials in the browser bundle.
 */
const PROXY_URL = 'https://sitniks-proxy.stvory.workers.dev/vectorize'

export function isVectorizerAIConfigured() {
  return true
}

/**
 * Vectorize a PNG Blob using vectorizer.ai (via Worker proxy).
 * @param {Blob} blob
 * @returns {Promise<string>} SVG markup
 */
export async function vectorizeWithAI(blob) {
  const form = new FormData()
  form.append('image', blob, 'image.png')
  form.append('output.svg.version', 'svg_1_1')

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Vectorizer proxy ${res.status}: ${text}`)
  }

  return await res.text()
}
