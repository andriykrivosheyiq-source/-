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

/**
 * Border-only BFS background removal for user-uploaded sketches.
 * Floods white inward from the image border only — NO dilation, so it never
 * jumps over outlines into white clothing/teeth inside the design.
 * Skips removal entirely if corners are already transparent.
 */
export async function removeBgForUpload(dataUrl) {
  const img = await loadImgEl(dataUrl)
  const W = img.naturalWidth || img.width
  const H = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  const corners = [
    ctx.getImageData(0,     0,     1, 1).data,
    ctx.getImageData(W - 1, 0,     1, 1).data,
    ctx.getImageData(0,     H - 1, 1, 1).data,
    ctx.getImageData(W - 1, H - 1, 1, 1).data,
  ]
  if (corners.some(p => p[3] < 128)) return canvas.toDataURL('image/png')

  // Sample the actual background colour from the corners (handles white AND
  // grey/coloured uniform backgrounds — not just near-white).
  let br = 0, bgc = 0, bb = 0
  for (const c of corners) { br += c[0]; bgc += c[1]; bb += c[2] }
  br /= 4; bgc /= 4; bb /= 4

  const imageData = ctx.getImageData(0, 0, W, H)
  const px = imageData.data
  const THR = 220              // near-white fallback
  const TOL = 40               // per-channel tolerance around sampled bg colour
  const isWhiteBg = (pos) => {
    const i = pos * 4
    if (px[i + 3] < 10) return true
    const r = px[i], g = px[i + 1], b = px[i + 2]
    if (r > THR && g > THR && b > THR) return true        // near-white
    return Math.abs(r - br) <= TOL && Math.abs(g - bgc) <= TOL && Math.abs(b - bb) <= TOL // matches bg colour
  }

  const visited = new Uint8Array(W * H)
  const seeds = []
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) {
      const p = y * W + x
      if (!visited[p] && isWhiteBg(p)) { visited[p] = 1; seeds.push(p) }
    }
  }
  for (let y = 1; y < H - 1; y++) {
    for (const x of [0, W - 1]) {
      const p = y * W + x
      if (!visited[p] && isWhiteBg(p)) { visited[p] = 1; seeds.push(p) }
    }
  }
  let head = 0
  while (head < seeds.length) {
    const pos = seeds[head++]
    const x = pos % W, y = (pos / W) | 0
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
      const npos = ny * W + nx
      if (!visited[npos] && isWhiteBg(npos)) { visited[npos] = 1; seeds.push(npos) }
    }
  }

  // Phase 2: remove enclosed background pockets (e.g. the gap trapped between
  // two heads) that the border flood couldn't reach. Only runs when the
  // background is distinctly grey/coloured — NOT paper-white — so that white
  // clothing/blanket pockets stay protected. Matches the sampled bg colour
  // tightly, with a brightness guard against brighter (white) content.
  const bgMax = Math.max(br, bgc, bb)
  const bgAvg = (br + bgc + bb) / 3
  if (bgMax < 244) {
    // Phase 2: enclosed pockets for grey/coloured backgrounds
    const POCKET_TOL = 18
    for (let i = 0; i < W * H; i++) {
      if (visited[i]) continue
      const j = i * 4
      if (px[j + 3] < 10) { visited[i] = 1; continue }
      const r = px[j], g = px[j + 1], b = px[j + 2]
      const matchesBg = Math.abs(r - br) <= POCKET_TOL && Math.abs(g - bgc) <= POCKET_TOL && Math.abs(b - bb) <= POCKET_TOL
      const brighterThanBg = (r + g + b) / 3 > bgAvg + 10   // protects white content
      if (matchesBg && !brighterThanBg) visited[i] = 1
    }
  } else {
    // Phase 3: enclosed near-white regions on a white/paper background.
    // These are either letter counters (the hole inside О, В, D, A, P — bordered
    // almost entirely by solid dark ink) OR white clothing/objects inside the
    // illustration (bordered by skin/hair/colour). We only erase a region when
    // its border is overwhelmingly dark ink, so white clothing stays protected.
    const isNearWhite = (idx) => {
      const j = idx * 4
      return px[j + 3] >= 10 && px[j] > THR && px[j + 1] > THR && px[j + 2] > THR
    }
    const INK_BRIGHT = 90      // a border pixel darker than this counts as "ink"
    const DARK_FRAC = 0.9      // require ≥90% of the border to be ink
    const comp = new Int32Array(W * H).fill(-1)
    for (let s = 0; s < W * H; s++) {
      if (visited[s] || comp[s] !== -1 || !isNearWhite(s)) continue
      // Flood this enclosed white component and inspect its border.
      const stack = [s]
      comp[s] = s
      const members = [s]
      let darkBorder = 0, totalBorder = 0, touchesEdge = false
      let h = 0
      while (h < stack.length) {
        const pos = stack[h++]
        const x = pos % W, y = (pos / W) | 0
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesEdge = true
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
          const np = ny * W + nx
          if (isNearWhite(np)) {
            if (comp[np] === -1) { comp[np] = s; stack.push(np); members.push(np) }
          } else {
            totalBorder++
            const jj = np * 4
            if ((px[jj] + px[jj + 1] + px[jj + 2]) / 3 < INK_BRIGHT) darkBorder++
          }
        }
      }
      // Erase only if fully enclosed and ringed by dark ink (a letter counter),
      // never if the border is mixed with colour (white clothing).
      if (!touchesEdge && totalBorder > 0 && darkBorder / totalBorder >= DARK_FRAC) {
        for (const m of members) visited[m] = 1
      }
    }
  }

  for (let i = 0; i < W * H; i++) {
    if (visited[i]) px[i * 4 + 3] = 0
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
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

/** Remove background via BFS flood-fill. */
export async function removeBgFromUrl(url) {
  const dataUrl = await toDataUrl(url)
  const img = await loadImgEl(dataUrl)
  return removeWhiteBg(img).toDataURL('image/png')
}

/** Stamp a size label (e.g. "3XL") onto the bottom-left corner of a PNG data URL. */
export async function stampSizeOnImage(dataUrl, sizeText) {
  if (!sizeText || !sizeText.trim()) return dataUrl
  const img = await loadImgEl(dataUrl)
  const W = img.naturalWidth || img.width
  const H = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const fontSize = Math.round(W * 0.08)
  const text = sizeText.trim().toUpperCase()
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  const tw = ctx.measureText(text).width
  const pad = fontSize * 0.35
  const rx = pad, ry = H - fontSize - pad * 2
  ctx.fillStyle = 'rgba(0,0,0,0.62)'
  ctx.fillRect(rx - pad * 0.5, ry - pad * 0.5, tw + pad, fontSize + pad)
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'
  ctx.fillText(text, rx, ry)
  return canvas.toDataURL('image/png')
}

/**
 * Remove background only if image is not already transparent (corner check).
 * Uses BFS flood-fill; skips if corners are already transparent.
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
  return removeWhiteBg(img).toDataURL('image/png')
}
