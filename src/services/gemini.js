import { PROMPTS } from './prompts'

const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callGemini(apiKey, base64, mimeType, prompt) {
  const res = await fetch(`${API_URL}?key=${apiKey}`, {
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
        responseModalities: ['image'],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inline_data)
  if (!part) throw new Error('Gemini не повернув зображення')

  return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
}

export async function generateDesigns(photoFile, styleId) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('API ключ не налаштований (VITE_GEMINI_API_KEY)')

  const base64 = await fileToBase64(photoFile)
  const mimeType = photoFile.type
  const pair = PROMPTS[styleId]

  if (!pair) throw new Error(`Немає промпту для стилю: ${styleId}`)

  const [img1, img2] = await Promise.all([
    callGemini(apiKey, base64, mimeType, pair[0].prompt),
    callGemini(apiKey, base64, mimeType, pair[1].prompt),
  ])

  return [
    { label: pair[0].label, image: img1 },
    { label: pair[1].label, image: img2 },
  ]
}

export const GENERATIVE_STYLES = ['dad-no-face', 'dad-face']
