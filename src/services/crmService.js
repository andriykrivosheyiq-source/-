/**
 * Sitniks CRM integration — sends design/mockup links to a client chat.
 *
 * Required env vars in .env:
 *   VITE_CRM_API_URL              — https://crm.sitniks.com/open-api
 *   VITE_CRM_API_KEY              — Bearer token
 *   VITE_CLOUDINARY_CLOUD_NAME    — e.g. dgwiuq1lr
 *   VITE_CLOUDINARY_UPLOAD_PRESET — unsigned preset name
 *
 * Flow:
 *   1. Upload each selected image to Cloudinary → get public HTTPS URL
 *   2. POST /open-api/chats/{chatId}/messages  { text: "..." with URLs }
 */
import { uploadImageToCloudinary } from './imageUpload.js'

export async function sendToClientCRM({ chatId, files, note }) {
  const apiUrl = import.meta.env.VITE_CRM_API_URL
  const apiKey = import.meta.env.VITE_CRM_API_KEY

  if (!apiUrl || !apiKey) {
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text }),
    })
  } catch (e) {
    throw new Error(`Sitniks CORS/network: ${e.message}`)
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Sitniks HTTP ${response.status}${errText ? ': ' + errText : ''}`)
  }

  return response.json().catch(() => ({}))
}
