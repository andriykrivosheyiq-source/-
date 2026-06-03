/**
 * CRM integration for sending client files.
 *
 * To connect your CRM, set these env vars in .env:
 *   VITE_CRM_API_URL  — e.g. https://api.your-crm.com
 *   VITE_CRM_API_KEY  — bearer token or API key
 *
 * The endpoint is expected to accept multipart/form-data:
 *   POST {VITE_CRM_API_URL}/send-files
 *   Authorization: Bearer {VITE_CRM_API_KEY}
 *   fields:  clientPhone, note (optional)
 *   files[]: each file as a blob with its filename
 */
export async function sendToClientCRM({ clientPhone, files, note }) {
  const apiUrl = import.meta.env.VITE_CRM_API_URL
  const apiKey = import.meta.env.VITE_CRM_API_KEY

  if (!apiUrl) {
    throw new Error('CRM_NOT_CONFIGURED')
  }

  const formData = new FormData()
  formData.append('clientPhone', clientPhone)
  if (note) formData.append('note', note)

  for (const file of files) {
    const res = await fetch(file.dataUrl)
    const blob = await res.blob()
    formData.append('files', blob, file.filename)
  }

  const headers = {}
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const response = await fetch(`${apiUrl}/send-files`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${text ? ': ' + text : ''}`)
  }

  return response.json().catch(() => ({}))
}
