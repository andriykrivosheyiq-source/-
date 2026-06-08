import { removeBgML } from '../services/bgRemoval.js'

export function loadImgEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      const img2 = new Image()
      img2.onload = () => resolve(img2)
      img2.onerror = reject
      img2.src = src
    }
    img.src = src
  })
}

// Remove white/paper background via border-seeded BFS + dilation.
export function removeWhiteBg(img, threshold = 220, noDilation = false) {
  const canvas = document.createElement('canvas')
  const W = img.naturalWidth || img.width
  const H = img.naturalHeight || img.height
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, W, H)
  const px = imageData.data

  const GR = 232
  const TOL = 7
  const isBackground = noDilation
    ? (pos) => {
        const i = pos * 4
        if (px[i + 3] < 10) return true
        const r = px[i], g = px[i + 1], b = px[i + 2]
        return Math.abs(r - GR) <= TOL && Math.abs(g - GR) <= TOL && Math.abs(b - GR) <= TOL
      }
    : (pos) => {
        const i = pos * 4
        if (px[i + 3] < 10) return true
        return px[i] > threshold && px[i + 1] > threshold && px[i + 2] > threshold
      }

  const visited = new Uint8Array(W * H)

  const bfsFill = (seeds) => {
    let head = 0
    while (head < seeds.length) {
      const pos = seeds[head++]
      const x = pos % W, y = (pos / W) | 0
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
        const npos = ny * W + nx
        if (!visited[npos] && isBackground(npos)) { visited[npos] = 1; seeds.push(npos) }
      }
    }
  }

  const seeds1 = []
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) {
      const p = y * W + x
      if (!visited[p] && isBackground(p)) { visited[p] = 1; seeds1.push(p) }
    }
  }
  for (let y = 1; y < H - 1; y++) {
    for (const x of [0, W - 1]) {
      const p = y * W + x
      if (!visited[p] && isBackground(p)) { visited[p] = 1; seeds1.push(p) }
    }
  }
  bfsFill(seeds1)

  if (!noDilation) {
    const JUMP = Math.min(80, Math.max(20, Math.round((W + H) / 60)))
    const dist = new Int16Array(W * H).fill(-1)
    const dq = []
    for (let i = 0; i < W * H; i++) if (visited[i]) { dist[i] = 0; dq.push(i) }
    let dHead = 0
    while (dHead < dq.length) {
      const pos = dq[dHead++]
      if (dist[pos] >= JUMP) continue
      const x = pos % W, y = (pos / W) | 0
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
        const npos = ny * W + nx
        if (dist[npos] < 0) { dist[npos] = dist[pos] + 1; dq.push(npos) }
      }
    }
    const seeds2 = []
    for (let i = 0; i < W * H; i++) {
      if (dist[i] > 0 && !visited[i] && isBackground(i)) { visited[i] = 1; seeds2.push(i) }
    }
    bfsFill(seeds2)

    // Phase 3: remove any remaining enclosed background regions (e.g., counter of 'О').
    // After phases 1–2, any unvisited background pixel is fully enclosed by dark outlines.
    const seeds3 = []
    for (let i = 0; i < W * H; i++) {
      if (!visited[i] && isBackground(i)) { visited[i] = 1; seeds3.push(i) }
    }
    bfsFill(seeds3)
  }

  for (let i = 0; i < W * H; i++) {
    if (visited[i]) px[i * 4 + 3] = 0
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/** Convert a remote URL to a base64 data URL via fetch to avoid canvas CORS taint. */
async function toDataUrl(url) {
  if (!url.startsWith('http')) return url
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Remove background using ML + alpha hole-fill. Falls back to BFS-only if ML fails. */
export async function removeBgFromUrl(url) {
  try {
    const mlDataUrl = await removeBgML(url)

    // Post-process: fill interior transparent holes that BiRefNet incorrectly removed
    // (e.g., white shirt/dress that looks like white background to the model).
    // Strategy: BFS on the ML alpha channel from image borders — border-connected
    // transparent pixels are true background; unreachable transparent pixels are holes
    // inside the subject and should be restored.
    const dataUrl = await toDataUrl(url)
    const origImg = await loadImgEl(dataUrl)
    const W = origImg.naturalWidth || origImg.width
    const H = origImg.naturalHeight || origImg.height

    const origCanvas = document.createElement('canvas')
    origCanvas.width = W; origCanvas.height = H
    origCanvas.getContext('2d').drawImage(origImg, 0, 0)
    const origColors = origCanvas.getContext('2d').getImageData(0, 0, W, H).data

    const mlImg = await loadImgEl(mlDataUrl)
    const out = document.createElement('canvas')
    out.width = W; out.height = H
    const ctx = out.getContext('2d')
    ctx.drawImage(mlImg, 0, 0, W, H)
    const px = ctx.getImageData(0, 0, W, H)

    // BFS on ML alpha: mark all border-reachable transparent pixels as "true background"
    const isTrans = (i) => px.data[i * 4 + 3] < 128
    const bgVisited = new Uint8Array(W * H)
    const queue = []
    for (let x = 0; x < W; x++) {
      for (const y of [0, H - 1]) {
        const i = y * W + x
        if (isTrans(i) && !bgVisited[i]) { bgVisited[i] = 1; queue.push(i) }
      }
    }
    for (let y = 1; y < H - 1; y++) {
      for (const x of [0, W - 1]) {
        const i = y * W + x
        if (isTrans(i) && !bgVisited[i]) { bgVisited[i] = 1; queue.push(i) }
      }
    }
    let head = 0
    while (head < queue.length) {
      const i = queue[head++]
      const x = i % W, y = (i / W) | 0
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
        const ni = ny * W + nx
        if (!bgVisited[ni] && isTrans(ni)) { bgVisited[ni] = 1; queue.push(ni) }
      }
    }

    // Restore interior transparent holes (white clothing enclosed by opaque outlines)
    for (let i = 0; i < W * H; i++) {
      if (isTrans(i) && !bgVisited[i]) {
        px.data[i * 4]     = origColors[i * 4]
        px.data[i * 4 + 1] = origColors[i * 4 + 1]
        px.data[i * 4 + 2] = origColors[i * 4 + 2]
        px.data[i * 4 + 3] = 255
      }
    }

    ctx.putImageData(px, 0, 0)
    return out.toDataURL('image/png')

  } catch (e) {
    console.warn('ML bg removal failed, using BFS fallback:', e)
    const dataUrl = await toDataUrl(url)
    const img = await loadImgEl(dataUrl)
    return removeWhiteBg(img).toDataURL('image/png')
  }
}

/**
 * Remove background only if image is not already transparent (corner check).
 * Uses ML removal; falls back to BFS on error.
 */
export async function removeBgFromUrlIfNeeded(url) {
  const dataUrl = await toDataUrl(url)
  const img = await loadImgEl(dataUrl)
  const W = img.naturalWidth || img.width
  const H = img.naturalHeight || img.height
  const check = document.createElement('canvas')
  check.width = W; check.height = H
  const ctx = check.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const corners = [
    ctx.getImageData(0,     0,     1, 1).data,
    ctx.getImageData(W - 1, 0,     1, 1).data,
    ctx.getImageData(0,     H - 1, 1, 1).data,
    ctx.getImageData(W - 1, H - 1, 1, 1).data,
  ]
  if (corners.some(p => p[3] < 128)) {
    return check.toDataURL('image/png') // Already transparent — skip removal
  }
  return removeBgFromUrl(url) // Use ML
}
