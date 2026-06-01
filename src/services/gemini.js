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

  // Use the first available model (strip "models/" prefix)
  const modelId = imageModels[0].name.replace('models/', '')
  console.log(`[Gemini] Знайдена image модель: ${modelId}`)
  console.log(`[Gemini] Всі image моделі: ${imageModels.map((m) => m.name).join(', ')}`)

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
        responseModalities: ['Image'],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inline_data)
  if (!part) throw new Error(`Модель ${modelId} не повернула зображення`)

  return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
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
