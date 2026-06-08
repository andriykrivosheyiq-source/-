const API_KEY = import.meta.env.VITE_CLIPDROP_API_KEY

/**
 * Remove background via Clipdrop API (~$0.001/image).
 * Returns a PNG data URL with transparent background.
 */
export async function removeBackgroundClipdrop(imageUrl) {
  if (!API_KEY) throw new Error('VITE_CLIPDROP_API_KEY not configured')

  const resp = await fetch(imageUrl)
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`)
  const blob = await resp.blob()

  const form = new FormData()
  form.append('image_file', blob, 'image.png')

  const res = await fetch('https://clipdrop-api.co/remove-background/v1', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Clipdrop ${res.status}: ${text}`)
  }

  const resultBlob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(resultBlob)
  })
}
