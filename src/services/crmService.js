/**
 * Sitniks CRM integration — sends design/mockup links to a client chat.
 *
 * Required env vars in .env (and GitHub Secrets):
 *   VITE_CRM_API_URL              — Cloudflare Worker URL (NOT crm.sitniks.com directly — CORS)
 *                                    e.g. https://sitniks-proxy.YOUR.workers.dev
 *   VITE_CLOUDINARY_CLOUD_NAME    — e.g. dgwiuq1lr
 *   VITE_CLOUDINARY_UPLOAD_PRESET — unsigned preset name
 *
 * The Cloudflare Worker (cloudflare-worker/worker.js) adds Authorization header
 * and CORS headers server-side, so VITE_CRM_API_KEY is no longer needed here.
 *
 * Flow:
 *   1. Upload each selected image to Cloudinary → get public HTTPS URL
 *   2. POST {VITE_CRM_API_URL}/chats/{chatId}/messages  { text: "..." with URLs }
 */
import { uploadImageToCloudinary } from './imageUpload.js'

export async function sendToClientCRM({ chatId, files, note }) {
  const apiUrl = import.meta.env.VITE_CRM_API_URL

  if (!apiUrl) {
    throw new Error('CRM_NOT_CONFIGURED')
  }

  // Upload each image to Cloudinary to get a public URL
  const uploaded = await Promise.all(
    files.map(async (file) => {
      let url
      try {
        url = await uploadImageToCloudinary(file.dataUrl, file.filename)
      } catch (e) {
        throw new Error(`Cloudinary: ${e.message}`)
      }
      return { label: file.label, url }
    })
  )

  // Build the message text
  let text = '🎨 Ваш дизайн готовий!\n\n'
  for (const f of uploaded) {
    text += `${f.label}: ${f.url}\n`
  }
  if (note) text += `\n${note}`

  let response
  try {
    response = await fetch(`${apiUrl}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (e) {
    throw new Error(`Мережева помилка: ${e.message}`)
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Sitniks HTTP ${response.status}${errText ? ': ' + errText : ''}`)
  }

  return response.json().catch(() => ({}))
}
