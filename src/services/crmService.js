/**
 * CRM integration for sending client files via Sitniks API.
 *
 * Required env vars in .env:
 *   VITE_CRM_API_URL              — e.g. https://api.sitniks.com
 *   VITE_CRM_API_KEY              — bearer token / API key
 *   VITE_CLOUDINARY_CLOUD_NAME    — e.g. dgwiuq1lr
 *   VITE_CLOUDINARY_UPLOAD_PRESET — unsigned upload preset name
 *
 * Flow:
 *   1. Each file (base64 dataUrl) is uploaded to Cloudinary → public URL
 *   2. URLs are sent to Sitniks via POST /send-files as JSON
 *      { clientPhone, note?, files: [{ filename, url }] }
 */
import { uploadImageToCloudinary } from './imageUpload.js'

export async function sendToClientCRM({ clientPhone, files, note }) {
  const apiUrl = import.meta.env.VITE_CRM_API_URL
  const apiKey = import.meta.env.VITE_CRM_API_KEY

  if (!apiUrl) {
    throw new Error('CRM_NOT_CONFIGURED')
  }

  // Upload each image to Cloudinary to get a public URL
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      const url = await uploadImageToCloudinary(file.dataUrl, file.filename)
      return { filename: file.filename, url }
    })
  )

  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const body = { clientPhone, files: uploadedFiles }
  if (note) body.note = note

  const response = await fetch(`${apiUrl}/send-files`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${text ? ': ' + text : ''}`)
  }

  return response.json().catch(() => ({}))
}
