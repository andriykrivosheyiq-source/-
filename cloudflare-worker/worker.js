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
    '🎨 <b>Нове замовлення для дизайнера</b>',
    '',
    `📋 <b>Замовлення:</b> ${escapeHtml(order.id)}`,
    order.productName    ? `👕 <b>Товар:</b> ${escapeHtml(order.productName)}`        : null,
    order.orderSize      ? `📏 <b>Розмір:</b> ${escapeHtml(order.orderSize)}`         : null,
    order.embroiderySize ? `🪡 <b>Вишивка:</b> ${escapeHtml(order.embroiderySize)}`  : null,
    order.designer       ? `👨‍🎨 <b>Дизайнер:</b> ${escapeHtml(order.designer)}`      : null,
    order.comment        ? `💬 <b>Коментар:</b> ${escapeHtml(order.comment)}`        : null,
    order.date           ? `📅 <b>Дата:</b> ${escapeHtml(order.date)}`               : null,
  ].filter(Boolean).join('\n')

  await tgCall(token, 'sendMessage', {
    chat_id: chatId,
    text: lines,
    parse_mode: 'HTML',
  })

  for (const file of files) {
    if (!file.url) continue
    await tgCall(token, 'sendDocument', {
      chat_id: chatId,
      document: file.url,
      caption: escapeHtml(file.label || ''),
    })
  }

  return jsonResp({ ok: true })
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

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
