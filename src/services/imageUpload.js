/**
 * Upload a base64 data URL to Cloudinary and return the public HTTPS URL.
 *
 * Requires in .env:
 *   VITE_CLOUDINARY_CLOUD_NAME   — your cloud name (e.g. dgwiuq1lr)
 *   VITE_CLOUDINARY_UPLOAD_PRESET — an unsigned upload preset
 */
export async function uploadImageToCloudinary(dataUrl, filename) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('CLOUDINARY_NOT_CONFIGURED')
  }

  const formData = new FormData()
  formData.append('file', dataUrl)
  formData.append('upload_preset', uploadPreset)
  if (filename) {
    const base = filename.replace(/\.[^.]+$/, '')
    const publicId = `${base}_${Date.now()}`
    formData.append('public_id', publicId)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Cloudinary upload failed ${response.status}${text ? ': ' + text : ''}`)
  }

  const data = await response.json()
  return data.secure_url
}
