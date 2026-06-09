/**
 * Cloudflare Worker — проксі для Sitniks CRM Open API + Telegram сповіщення
 *
 * Розгортання:
 *   1. workers.cloudflare.com → Create Worker → замінити код на цей
 *   2. Settings → Variables → Add variable (обов'язково "Encrypt"):
 *        SITNIKS_API_KEY     = Bvx5NlipuqUYJ1p8YrcxuzX7JAvnQOiVAPKPnxOjHzn
 *        TELEGRAM_BOT_TOKEN  = <токен від @BotFather>
 *        TELEGRAM_CHAT_ID    = <chat_id групи, наприклад -5013412966>
 *   3. Save and Deploy
 */

const SITNIKS_BASE = 'https://crm.sitniks.com/open-api'
const TG_BASE      = 'https://api.telegram.org'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function tgCall(token, method, body) {
  const res = await fetch(`${TG_BASE}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function handleTelegramSendOrder(request, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return jsonResp({ error: 'TELEGRAM_NOT_CONFIGURED' }, 500)
  }

  let data
  try { data = await request.json() }
  catch { return jsonResp({ error: 'Invalid JSON' }, 400) }

  const { order = {}, files = [] } = data
  const chatId = env.TELEGRAM_CHAT_ID
  const token  = env.TELEGRAM_BOT_TOKEN

  const lines = [
    escapeHtml(order.id),
    order.productName    ? `👕 Товар: ${escapeHtml(order.productName)}`             : null,
    order.orderSize      ? `📏 Розмір: ${escapeHtml(order.orderSize)}`              : null,
    order.embroiderySize ? `✅ Вишивка: ${escapeHtml(order.embroiderySize)}`        : null,
    order.comment        ? `💬 Коментар: ${escapeHtml(order.comment)}`             : null,
  ].filter(Boolean).join('\n')

  await tgCall(token, 'sendMessage', {
    chat_id: chatId,
    text: lines,
  })

  for (const file of files) {
    if (!file.url) continue
    try {
      // Fetch file bytes so we can set a custom filename in Telegram
      const fileRes = await fetch(file.url)
      const blob = await fileRes.blob()
      const filename = `${file.label || 'file'}.png`
      const form = new FormData()
      form.append('chat_id', chatId)
      form.append('document', blob, filename)
      await fetch(`${TG_BASE}/bot${token}/sendDocument`, { method: 'POST', body: form })
    } catch {
      // fallback: send via URL if fetch fails
      await tgCall(token, 'sendDocument', {
        chat_id: chatId,
        document: file.url,
        caption: escapeHtml(file.label || ''),
      })
    }
  }

  return jsonResp({ ok: true })
}

async function handleVectorize(request, env) {
  if (!env.VECTORIZER_AI_ID || !env.VECTORIZER_AI_SECRET) {
    return new Response(JSON.stringify({ error: 'VECTORIZER_NOT_CONFIGURED' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
  let formData
  try { formData = await request.formData() }
  catch { return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400, headers: CORS_HEADERS }) }

  const res = await fetch('https://vectorizer.ai/api/v1/vectorize', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + btoa(`${env.VECTORIZER_AI_ID}:${env.VECTORIZER_AI_SECRET}`) },
    body: formData,
  })
  const text = await res.text()
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': res.ok ? 'image/svg+xml' : 'text/plain', ...CORS_HEADERS },
  })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

    // Vectorizer.ai proxy (avoids browser CORS block)
    if (url.pathname === '/vectorize' && request.method === 'POST') {
      return handleVectorize(request, env)
    }

    // Telegram order notification
    if (url.pathname === '/tg/send-order' && request.method === 'POST') {
      return handleTelegramSendOrder(request, env)
    }

    // Sitniks CRM proxy
    const target = `${SITNIKS_BASE}${url.pathname}${url.search}`

    let body = undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    let sResponse
    try {
      sResponse = await fetch(target, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SITNIKS_API_KEY}`,
        },
        body: body || undefined,
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: `Upstream error: ${e.message}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const responseText = await sResponse.text()
    return new Response(responseText, {
      status: sResponse.status,
      headers: {
        'Content-Type': sResponse.headers.get('Content-Type') || 'application/json',
        ...CORS_HEADERS,
      },
    })
  },
}
