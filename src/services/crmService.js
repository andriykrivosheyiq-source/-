/**
 * Sitniks CRM integration
 *
 * Required env vars:
 *   VITE_CRM_API_URL  — Cloudflare Worker URL (proxies crm.sitniks.com, adds Auth header, adds CORS)
 *
 * Flow for sending to client:
 *   1. getOrderByCrmNumber(num) → { chatId, clientName, ... }
 *   2. Upload images to Cloudinary → get public HTTPS URLs
 *   3. POST /chats/{chatId}/messages  { text: "..." with URLs }
 */
import { uploadImageToCloudinary } from './imageUpload.js'

function apiUrl() {
  const url = import.meta.env.VITE_CRM_API_URL
  if (!url) throw new Error('CRM_NOT_CONFIGURED')
  return url.replace(/\/$/, '')
}

async function crmFetch(path, options = {}) {
  const base = apiUrl()
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = `HTTP ${res.status}`
    try { msg = JSON.parse(text)?.message || msg } catch {}
    throw new Error(msg)
  }
  return res.json().catch(() => ({}))
}

/** Fetch a Sitniks order by its number and return the full order object. */
export async function getOrderByCrmNumber(orderNumber) {
  return crmFetch(`/orders/${encodeURIComponent(orderNumber)}`)
}

/** Change the status of a Sitniks order. */
export async function updateOrderStatus(orderId, statusId) {
  return crmFetch(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ statusId }),
  })
}

/**
 * Upload order files to Cloudinary then send order details + files to
 * the designer Telegram group via the Cloudflare Worker.
 */
export async function sendOrderToDesignerTelegram({ order, files }) {
  const uploaded = await Promise.all(
    files.map(async (file) => {
      if (!file.dataUrl) return null
      try {
        const url = await uploadImageToCloudinary(file.dataUrl, file.filename)
        return { label: file.label, url }
      } catch { return null }
    })
  )
  return crmFetch('/tg/send-order', {
    method: 'POST',
    body: JSON.stringify({ order, files: uploaded.filter(Boolean) }),
  })
}

/** Upload files to Cloudinary then send their URLs as a text message to a Sitniks chat. */
export async function sendToClientCRM({ chatId, files, note }) {
  const base = apiUrl()

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

  let text = '🎨 Ваш дизайн готовий!\n\n'
  for (const f of uploaded) {
    text += `${f.label}: ${f.url}\n`
  }
  if (note) text += `\n${note}`

  let response
  try {
    response = await fetch(`${base}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (e) {
    throw new Error(`Мережева помилка: ${e.message}`)
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let msg = `Sitniks HTTP ${response.status}`
    try { msg = JSON.parse(errText)?.message || msg } catch {}
    throw new Error(msg)
  }

  return response.json().catch(() => ({}))
}
