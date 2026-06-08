const API_KEY = import.meta.env.VITE_PHOTOROOM_API_KEY

export async function removeBackgroundPhotoroom(imageUrl) {
  if (!API_KEY) throw new Error('VITE_PHOTOROOM_API_KEY not configured')

  const resp = await fetch(imageUrl)
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`)
  const blob = await resp.blob()

  const form = new FormData()
  form.append('image_file', blob, 'image.png')

  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PhotoRoom ${res.status}: ${text}`)
  }

  const resultBlob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(resultBlob)
  })
}
