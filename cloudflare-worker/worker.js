/**
 * Cloudflare Worker — проксі для Sitniks CRM Open API
 *
 * Розгортання:
 *   1. workers.cloudflare.com → Create Worker → замінити код на цей
 *   2. Settings → Variables → Add variable:
 *        SITNIKS_API_KEY = Bvx5NlipuqUYJ1p8YrcxuzX7JAvnQOiVAPKPnxOjHzn
 *        (обов'язково позначте "Encrypt" щоб це був секрет)
 *   3. Save and Deploy → скопіюйте URL виду https://sitniks-proxy.YOUR.workers.dev
 *   4. У GitHub Secrets:
 *        VITE_CRM_API_URL = https://sitniks-proxy.YOUR.workers.dev
 *        VITE_CRM_API_KEY = (залиште будь-яке значення або видаліть — воно вже не використовується)
 */

const SITNIKS_BASE = 'https://crm.sitniks.com/open-api'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export default {
  async fetch(request, env) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
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
