import { PROMPTS } from './prompts'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

let _cachedModel = null
let _cachedRefs = null
const _resultsCache = new Map()

const REF_FILES = [
  'image-1780403071670.png',
  'image-1780403071692.png',
]

async function loadReferenceImages() {
  if (_cachedRefs !== null) return _cachedRefs
  const base = import.meta.env.BASE_URL || '/'
  const results = []
  for (const name of REF_FILES) {
    try {
      const res = await fetch(`${base}references/${name}`)
      if (!res.ok) continue
      const blob = await res.blob()
      const mimeType = blob.type || 'image/png'
      const b64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      results.push({ b64, mimeType })
      console.log(`[Gemini] Reference loaded: ${name}`)
    } catch {
      // file not present — skip silently
    }
  }
  _cachedRefs = results
  return results
}

async function findImageModel(apiKey) {
  if (_cachedModel) return _cachedModel

  const res = await fetch(`${BASE_URL}/models?key=${apiKey}&pageSize=200`)
  if (!res.ok) throw new Error(`Не вдалось отримати список моделей: HTTP ${res.status}`)

  const data = await res.json()
  const models = data.models || []

  const imageModels = models.filter((m) => {
    const name = (m.name || '').toLowerCase()
    const methods = m.supportedGenerationMethods || []
    return (
      methods.includes('generateContent') &&
      (name.includes('image') || name.includes('imagen'))
    )
  })

  if (imageModels.length === 0) {
    throw new Error(
      `Жодна image generation модель не знайдена. Доступні моделі: ${models.map((m) => m.name).join(', ')}`
    )
  }

  console.log(`[Gemini] Всі image моделі: ${imageModels.map((m) => m.name).join(', ')}`)

  const preferenceOrder = [
    'gemini-2.5-pro-image',
    'gemini-2.5-pro-preview-image',
    'gemini-3-pro-image',
    'gemini-3-pro-image-preview',
    'gemini-2.0-pro-image',
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-2.0-flash-image',
  ]

  let selected = null
  for (const pref of preferenceOrder) {
    selected = imageModels.find((m) => m.name.includes(pref))
    if (selected) break
  }
  if (!selected) selected = imageModels[0]

  const modelId = selected.name.replace('models/', '')
  console.log(`[Gemini] Використовую модель: ${modelId}`)

  _cachedModel = modelId
  return modelId
}

function resizeToBlob(file, maxPx = 768) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

async function fileToBase64(file) {
  const blob = await resizeToBlob(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function callGemini(apiKey, modelId, base64, mimeType, prompt, refs) {
  const url = `${BASE_URL}/models/${modelId}:generateContent?key=${apiKey}`

  const parts = [{ text: prompt }]

  if (refs.length > 0) {
    parts.push({ text: 'STYLE REFERENCE EXAMPLES — your output must match this exact visual style:' })
    for (const { b64, mimeType: refMime } of refs) {
      parts.push({ inline_data: { mime_type: refMime, data: b64 } })
    }
    parts.push({ text: 'Now generate the same style for this family photo:' })
  }

  parts.push({ inline_data: { mime_type: mimeType, data: base64 } })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['image', 'text'],
        temperature: 0.2,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const resParts = data.candidates?.[0]?.content?.parts || []
  console.log('[Gemini] parts keys:', resParts.map(p => Object.keys(p).join(',')))

  const part = resParts.find((p) => p.inline_data || p.inlineData)
  if (!part) {
    const textPart = resParts.find((p) => p.text)
    throw new Error(`Модель ${modelId} не повернула зображення. ${textPart ? 'Текст: ' + textPart.text.slice(0, 200) : 'Відповідь порожня'}`)
  }

  const imgData = part.inline_data || part.inlineData
  return `data:${imgData.mime_type || imgData.mimeType};base64,${imgData.data}`
}

export async function generateDesigns(photoFile, styleId) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('API ключ не налаштований (VITE_GEMINI_API_KEY)')

  const cacheKey = `${photoFile.size}-${photoFile.lastModified}-${styleId}`
  if (_resultsCache.has(cacheKey)) {
    console.log('[Gemini] Повертаю кешований результат')
    return _resultsCache.get(cacheKey)
  }

  const [base64, modelId, refs] = await Promise.all([
    fileToBase64(photoFile),
    findImageModel(apiKey),
    styleId === 'dad-face' ? loadReferenceImages() : Promise.resolve([]),
  ])

  const mimeType = 'image/jpeg'
  const pair = PROMPTS[styleId]
  if (!pair) throw new Error(`Немає промпту для стилю: ${styleId}`)

  const results = await Promise.all(
    pair.map((p) =>
      callGemini(apiKey, modelId, base64, mimeType, p.prompt, refs).then((image) => ({
        label: p.label,
        image,
      }))
    )
  )

  _resultsCache.set(cacheKey, results)
  return results
}

export async function editDesign(currentImageDataUrl, editPrompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('API ключ не налаштований (VITE_GEMINI_API_KEY)')

  const modelId = await findImageModel(apiKey)

  const [header, base64] = currentImageDataUrl.split(',')
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'

  const parts = [
    {
      text: `You are editing an existing design image. Apply the following changes while preserving the overall style, composition, and all other elements exactly as they are. Only change what is explicitly requested.\n\nRequested edits: ${editPrompt}`,
    },
    { inline_data: { mime_type: mimeType, data: base64 } },
  ]

  const url = `${BASE_URL}/models/${modelId}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['image', 'text'], temperature: 0.2 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const resParts = data.candidates?.[0]?.content?.parts || []
  const part = resParts.find((p) => p.inline_data || p.inlineData)
  if (!part) {
    const textPart = resParts.find((p) => p.text)
    throw new Error(`Модель не повернула зображення. ${textPart ? 'Текст: ' + textPart.text.slice(0, 200) : 'Відповідь порожня'}`)
  }

  const imgData = part.inline_data || part.inlineData
  return `data:${imgData.mime_type || imgData.mimeType};base64,${imgData.data}`
}

export const GENERATIVE_STYLES = ['dad-face', 'est-face', 'faceless-face']

export function clearCache(photoFile, styleId) {
  const cacheKey = `${photoFile.size}-${photoFile.lastModified}-${styleId}`
  _resultsCache.delete(cacheKey)
}
