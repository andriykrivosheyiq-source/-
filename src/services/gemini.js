import { PROMPTS } from './prompts'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

let _cachedModel = null

async function findImageModel(apiKey) {
  if (_cachedModel) return _cachedModel

  const res = await fetch(`${BASE_URL}/models?key=${apiKey}&pageSize=200`)
  if (!res.ok) throw new Error(`Не вдалось отримати список моделей: HTTP ${res.status}`)

  const data = await res.json()
  const models = data.models || []

  // Filter models that support generateContent AND have "image" in the name
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

  // Prefer newer higher-quality models for better layout adherence
  const preferenceOrder = [
    'gemini-3.1-flash-image',
    'gemini-3-pro-image',
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
    'gemini-2.5-flash-image',
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callGemini(apiKey, modelId, base64, mimeType, prompt) {
  const url = `${BASE_URL}/models/${modelId}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['image', 'text'],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  console.log('[Gemini] parts keys:', parts.map(p => Object.keys(p).join(',')))

  // Support both snake_case (inline_data) and camelCase (inlineData)
  const part = parts.find((p) => p.inline_data || p.inlineData)
  if (!part) {
    const textPart = parts.find((p) => p.text)
    throw new Error(`Модель ${modelId} не повернула зображення. ${textPart ? 'Текст: ' + textPart.text.slice(0, 200) : 'Відповідь порожня'}`)
  }

  const imgData = part.inline_data || part.inlineData
  return `data:${imgData.mime_type || imgData.mimeType};base64,${imgData.data}`
}

export async function generateDesigns(photoFile, styleId) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('API ключ не налаштований (VITE_GEMINI_API_KEY)')

  const [base64, modelId] = await Promise.all([
    fileToBase64(photoFile),
    findImageModel(apiKey),
  ])

  const mimeType = photoFile.type
  const pair = PROMPTS[styleId]
  if (!pair) throw new Error(`Немає промпту для стилю: ${styleId}`)

  const [img1, img2] = await Promise.all([
    callGemini(apiKey, modelId, base64, mimeType, pair[0].prompt),
    callGemini(apiKey, modelId, base64, mimeType, pair[1].prompt),
  ])

  return [
    { label: pair[0].label, image: img1 },
    { label: pair[1].label, image: img2 },
  ]
}

export const GENERATIVE_STYLES = ['dad-no-face', 'dad-face']
