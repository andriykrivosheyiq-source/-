/**
 * ML-based background removal using BiRefNet-lite (onnx-community) via Transformers.js.
 * Model runs entirely in the browser (WebGPU → WASM fallback).
 * The model is downloaded once and cached by the browser.
 */
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers'

// Single-threaded WASM fallback — no SharedArrayBuffer / COOP headers required
env.backends.onnx.wasm.numThreads = 1

const MODEL_ID = 'onnx-community/BiRefNet-ONNX'

// Singleton model + processor
let _model = null
let _processor = null
let _loadPromise = null

// Status listeners — components subscribe to know when model is loading/ready
const _listeners = new Set()
function _notify(status) { _listeners.forEach(fn => fn(status)) }

/** Subscribe to model status: 'loading' | 'ready' | 'error'. Returns unsubscribe fn. */
export function onBgModelStatus(cb) {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

export function isBgModelReady() { return _model !== null }

async function _detectDevice() {
  if (!navigator.gpu) return 'wasm'
  try {
    const adapter = await navigator.gpu.requestAdapter()
    return adapter ? 'webgpu' : 'wasm'
  } catch { return 'wasm' }
}

async function _loadModel() {
  if (_model) return
  if (_loadPromise) return _loadPromise

  _loadPromise = (async () => {
    _notify('loading')
    try {
      const device = await _detectDevice()
      const dtype = device === 'webgpu' ? 'fp16' : 'fp32'

      ;[_model, _processor] = await Promise.all([
        AutoModel.from_pretrained(MODEL_ID, { dtype, device }),
        AutoProcessor.from_pretrained(MODEL_ID),
      ])

      _notify('ready')
    } catch (e) {
      _loadPromise = null
      _notify('error')
      throw e
    }
  })()

  return _loadPromise
}

/** Start downloading the model in the background (call early so it's ready when needed). */
export function preloadBgModel() {
  if (_model || _loadPromise) return
  _loadModel().catch(() => {})
}

/**
 * Remove background from an image URL using BiRefNet-lite ML model.
 * Returns a PNG data URL with transparent background.
 */
export async function removeBgML(imageUrl) {
  await _loadModel()

  // Fetch as blob URL to avoid Cloudinary CORS canvas taint
  let blobUrl = imageUrl
  let createdBlob = false
  if (imageUrl.startsWith('http')) {
    const resp = await fetch(imageUrl)
    const blob = await resp.blob()
    blobUrl = URL.createObjectURL(blob)
    createdBlob = true
  }

  try {
    const image = await RawImage.fromURL(blobUrl)
    const { pixel_values } = await _processor(image)

    // BiRefNet uses input_image / output_image tensor names + sigmoid activation
    const { output_image } = await _model({ input_image: pixel_values })
    const mask = await RawImage.fromTensor(
      output_image[0].sigmoid().mul(255).to('uint8')
    ).resize(image.width, image.height)

    // Composite: draw original image, then apply mask as alpha channel
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image.toCanvas(), 0, 0)

    const pixelData = ctx.getImageData(0, 0, image.width, image.height)
    for (let i = 0; i < mask.data.length; i++) {
      pixelData.data[4 * i + 3] = mask.data[i]
    }
    ctx.putImageData(pixelData, 0, 0)

    return canvas.toDataURL('image/png')
  } finally {
    if (createdBlob) URL.revokeObjectURL(blobUrl)
  }
}
