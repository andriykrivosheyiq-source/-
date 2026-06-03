import React, { useState, useEffect, useRef, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'
import { products as allProducts, productCategories } from '../data/mockData'
import { generateDesigns, clearCache, editDesign } from '../services/gemini'

const D_PATH =
  'M291 123L78 153L88 232L114 229L116 233L148 467L143 471L121 474L132 555L349 526L400 459L360 176Z ' +
  'M289 135L350 183L388 456L343 515L142 542L140 537L133 484L159 480L160 476L125 219L124 217L102 220L98 219L90 163L115 158Z ' +
  'M262 198L191 207L227 470L298 461L317 436L288 221L285 215Z ' +
  'M259 209L277 224L306 433L291 451L238 458L235 453L203 218L205 216Z'

const PRESET_COLORS = ['#000000', '#1e3a5f', '#c0392b', '#2d5a27', '#d97706', '#7c3aed', '#9ca3af', '#8b5e3c']

// ─── Canvas utilities ─────────────────────────────────────────────────────────

function loadImgEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // retry without crossOrigin (some local/data URLs don't support it)
      const img2 = new Image()
      img2.onload = () => resolve(img2)
      img2.onerror = reject
      img2.src = src
    }
    img.src = src
  })
}

// Remove white background by setting alpha based on pixel brightness
function removeWhiteBg(img, threshold = 235) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    const whiteness = Math.min(px[i], px[i + 1], px[i + 2])
    if (whiteness > threshold) {
      px[i + 3] = Math.round(255 * (1 - (whiteness - threshold) / (255 - threshold)))
    }
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

function drawDLetters(ctx, letters, W, H) {
  for (const letter of letters) {
    const lx = letter.x / 100 * W
    const ly = letter.y / 100 * H
    const lw = letter.size / 100 * W
    const lh = lw * 460 / 360
    const sc = lw / 360
    ctx.save()
    ctx.translate(lx + lw / 2, ly + lh / 2)
    ctx.rotate(letter.rotation * Math.PI / 180)
    ctx.translate(-lw / 2, -lh / 2)
    ctx.scale(sc, sc)
    ctx.translate(-60, -110)
    ctx.fillStyle = letter.color
    ctx.fill(new Path2D(D_PATH), 'evenodd')
    ctx.restore()
  }
}

function drawRR(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
}

function drawTTOLetters(ctx, ttoLetters, W, H) {
  for (const letter of ttoLetters) {
    const lx = letter.x / 100 * W
    const ly = letter.y / 100 * H
    ctx.save()
    ctx.fillStyle = letter.color
    if (letter.id === 'o') {
      const lw = letter.size / 100 * W
      const lh = lw * 300 / 270
      ctx.translate(lx + lw / 2, ly + lh / 2)
      ctx.rotate(letter.rotation * Math.PI / 180)
      const path = new Path2D()
      path.ellipse(0, 0, lw / 2, lh / 2, 0, 0, Math.PI * 2)
      path.ellipse(0, 0, lw * 95 / 270, lh * 110 / 300, 0, 0, Math.PI * 2)
      ctx.fill(path, 'evenodd')
    } else {
      const lw = letter.size / 100 * W
      const lh = lw * 300 / 260
      ctx.translate(lx + lw / 2, ly + lh / 2)
      ctx.rotate(letter.rotation * Math.PI / 180)
      ctx.translate(-lw / 2, -lh / 2)
      const r = lw * 20 / 260
      drawRR(ctx, 0, 0, lw, lw * 40 / 260, r)
      drawRR(ctx, lw * 110 / 260, lh * 20 / 300, lw * 40 / 260, lh * 280 / 300, r)
    }
    ctx.restore()
  }
}

function drawEstText(ctx, estEl, estText, W, H) {
  const fontPx = estEl.fontSize * W / 100
  ctx.font = `bold ${fontPx}px Arial, Helvetica, sans-serif`
  ctx.fillStyle = estEl.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  try { ctx.letterSpacing = '6px' } catch { /* older browsers */ }
  ctx.fillText((estText || 'EST.2025').toUpperCase(), estEl.x / 100 * W, estEl.y / 100 * H)
}

// Full composite with white background (for regular download)
async function renderEstToCanvas(letters, estEl, estText, showEstText, imageUrl, illus, letterStyle, ttoLetters) {
  const W = 1600, H = 900
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  if (imageUrl) {
    try {
      const img = await loadImgEl(imageUrl)
      const iW = illus.size / 100 * W
      const iH = iW * img.height / img.width
      const cropFrac = (illus.cropBottom || 0) / 100
      const srcH = img.height * (1 - cropFrac)
      const destH = iH * (1 - cropFrac)
      const iX = illus.x / 100 * W - iW / 2
      const iY = illus.y / 100 * H - iH / 2
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(img, 0, 0, img.width, srcH, iX, iY, iW, destH)
      ctx.restore()
    } catch { /* skip */ }
  }

  if (letterStyle === 'TTO') drawTTOLetters(ctx, ttoLetters, W, H)
  else drawDLetters(ctx, letters, W, H)
  if (showEstText) drawEstText(ctx, estEl, estText, W, H)
  return canvas
}

// Transparent composite for mockup (no white fill, illustration bg removed)
async function renderEstTransparent(letters, estEl, estText, showEstText, imageUrl, illus, letterStyle, ttoLetters) {
  const W = 1600, H = 900
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  if (imageUrl) {
    try {
      const img = await loadImgEl(imageUrl)
      const cleaned = removeWhiteBg(img)
      const iW = illus.size / 100 * W
      const iH = iW * cleaned.height / cleaned.width
      const cropFrac = (illus.cropBottom || 0) / 100
      const srcH = cleaned.height * (1 - cropFrac)
      const destH = iH * (1 - cropFrac)
      const iX = illus.x / 100 * W - iW / 2
      const iY = illus.y / 100 * H - iH / 2
      ctx.drawImage(cleaned, 0, 0, cleaned.width, srcH, iX, iY, iW, destH)
    } catch { /* skip */ }
  }

  if (letterStyle === 'TTO') drawTTOLetters(ctx, ttoLetters, W, H)
  else drawDLetters(ctx, letters, W, H)
  if (showEstText) drawEstText(ctx, estEl, estText, W, H)
  return canvas
}

// ─── EstPosterView ────────────────────────────────────────────────────────────

const EstPosterView = React.forwardRef(function EstPosterView({ imageUrl, estText, showEstText }, ref) {
  const containerRef = useRef(null)
  const illusImgRef = useRef(null)
  const dragRef = useRef(null)
  const dragMovedRef = useRef(false)
  const wasSelectedRef = useRef(false)

  const [letters, setLetters] = useState([
    { id: 'left',  x: 1,  y: 15, size: 22, rotation: -4,  color: '#000000' },
    { id: 'right', x: 77, y: 15, size: 22, rotation: 19,  color: '#000000' },
  ])
  const [letterStyle, setLetterStyle] = useState('D')
  const [ttoLetters, setTtoLetters] = useState([
    { id: 'tLeft',  x: 4,  y: 8, size: 23, rotation: 0, color: '#000000' },
    { id: 'tRight', x: 29, y: 8, size: 23, rotation: 0, color: '#000000' },
    { id: 'o',      x: 54, y: 8, size: 23, rotation: 0, color: '#000000' },
  ])
  const [estEl, setEstEl] = useState({ x: 50, y: 88, color: '#000000', fontSize: 2.8 })
  const [illus, setIllus] = useState({ x: 50, y: 45, size: 52, cropBottom: 0 })
  const [cleanedUrl, setCleanedUrl] = useState(null)
  const [selected, setSelected] = useState(null)

  // Pre-process illustration: remove white background for transparent preview
  useEffect(() => {
    if (!imageUrl) { setCleanedUrl(null); return }
    let active = true
    loadImgEl(imageUrl).then(img => {
      if (!active) return
      const c = removeWhiteBg(img)
      c.toBlob(blob => {
        if (!active) return
        const url = URL.createObjectURL(blob)
        setCleanedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
      }, 'image/png')
    }).catch(() => { if (active) setCleanedUrl(imageUrl) })
    return () => { active = false }
  }, [imageUrl])

  useImperativeHandle(ref, () => ({
    exportToCanvas:      () => renderEstToCanvas(letters, estEl, estText, showEstText, imageUrl, illus, letterStyle, ttoLetters),
    exportTransparent:   () => renderEstTransparent(letters, estEl, estText, showEstText, imageUrl, illus, letterStyle, ttoLetters),
  }), [letters, estEl, estText, showEstText, imageUrl, illus, letterStyle, ttoLetters])

  useEffect(() => {
    const onMove = (e) => {
      const dr = dragRef.current
      if (!dr) return
      if (e.cancelable) e.preventDefault()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const dx = (clientX - dr.sx) / dr.cw * 100
      const dy = (clientY - dr.sy) / dr.ch * 100
      if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) dragMovedRef.current = true

      if (dr.id === 'est') {
        if (dr.type === 'move')   setEstEl(prev => ({ ...prev, x: dr.ox + dx, y: dr.oy + dy }))
        if (dr.type === 'resize') setEstEl(prev => ({ ...prev, fontSize: Math.max(1, Math.min(8, dr.os + (dx + dy) * 0.04)) }))
      } else if (dr.id === 'illus') {
        if (dr.type === 'move')    setIllus(prev => ({ ...prev, x: dr.ox + dx, y: dr.oy + dy }))
        if (dr.type === 'resize')  setIllus(prev => ({ ...prev, size: Math.max(10, Math.min(100, dr.os + (dx + dy) * 0.5)) }))
        if (dr.type === 'cropBottom') {
          const pixelDy = dr.sy - clientY  // positive = dragging up = more crop from bottom
          const newCropPx = dr.os / 100 * dr.imgH + pixelDy
          setIllus(prev => ({ ...prev, cropBottom: Math.max(0, Math.min(80, newCropPx / dr.imgH * 100)) }))
        }
      } else {
        const isTTO = dr.id === 'tLeft' || dr.id === 'tRight' || dr.id === 'o'
        const setter = isTTO ? setTtoLetters : setLetters
        setter(prev => prev.map(l => {
          if (l.id !== dr.id) return l
          if (dr.type === 'move')   return { ...l, x: dr.ox + dx, y: dr.oy + dy }
          if (dr.type === 'resize') return { ...l, size: Math.max(8, Math.min(55, dr.os + (dx + dy) * 0.5)) }
          if (dr.type === 'rotate') return { ...l, rotation: dr.os + dx * 0.4 }
          return l
        }))
      }
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  const startDrag = (id, type, e) => {
    e.preventDefault(); e.stopPropagation()
    dragMovedRef.current = false
    wasSelectedRef.current = selected === id
    setSelected(id)
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    if (id === 'est') {
      dragRef.current = { id, type, sx: clientX, sy: clientY, ox: estEl.x, oy: estEl.y, os: estEl.fontSize, cw: rect.width, ch: rect.height }
    } else if (id === 'illus') {
      const imgH = illusImgRef.current?.getBoundingClientRect().height || 100
      const os = type === 'cropBottom' ? illus.cropBottom : illus.size
      dragRef.current = { id, type, sx: clientX, sy: clientY, ox: illus.x, oy: illus.y, os, imgH, cw: rect.width, ch: rect.height }
    } else {
      const letter = letters.find(l => l.id === id) || ttoLetters.find(l => l.id === id)
      dragRef.current = { id, type, sx: clientX, sy: clientY, ox: letter.x, oy: letter.y, os: type === 'rotate' ? letter.rotation : letter.size, cw: rect.width, ch: rect.height }
    }
  }

  const handleClick = (id, e) => {
    e.stopPropagation()
    if (wasSelectedRef.current && !dragMovedRef.current) setSelected(null)
  }

  const selectedLetter = letters.find(l => l.id === selected)
  const selectedTTOLetter = ttoLetters.find(l => l.id === selected)
  const isEstSelected = selected === 'est'
  const isIllusSelected = selected === 'illus'
  const currentColor = isEstSelected ? estEl.color : (selectedLetter || selectedTTOLetter)?.color
  const setColor = (color) => {
    if (isEstSelected) setEstEl(prev => ({ ...prev, color }))
    else if (selectedLetter) setLetters(prev => prev.map(l => l.id === selected ? { ...l, color } : l))
    else if (selectedTTOLetter) setTtoLetters(prev => prev.map(l => l.id === selected ? { ...l, color } : l))
  }

  return (
    <div style={{ background: '#ffffff', width: '100%', borderRadius: '12px' }}>
      <div ref={containerRef} onClick={() => setSelected(null)} style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#ffffff', userSelect: 'none', touchAction: 'none', overflow: 'hidden' }}>

        {/* Letter style switcher */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 25, display: 'flex', background: 'rgba(255,255,255,0.92)', borderRadius: '10px', padding: '3px', gap: '2px', boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setLetterStyle('D'); setSelected(null) }}
            style={{ padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: letterStyle === 'D' ? '#4f46e5' : 'transparent', color: letterStyle === 'D' ? '#fff' : '#6b7280' }}
          >D D</button>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setLetterStyle('TTO'); setSelected(null); setTtoLetters(prev => [
              { id: 'tLeft',  x: 4,  y: 8, size: 23, rotation: 0, color: prev[0]?.color || '#000000' },
              { id: 'tRight', x: 29, y: 8, size: 23, rotation: 0, color: prev[1]?.color || '#000000' },
              { id: 'o',      x: 54, y: 8, size: 23, rotation: 0, color: prev[2]?.color || '#000000' },
            ]) }}
            style={{ padding: '3px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: letterStyle === 'TTO' ? '#4f46e5' : 'transparent', color: letterStyle === 'TTO' ? '#fff' : '#6b7280' }}
          >T T O</button>
        </div>

        {!imageUrl && (
          <div style={{ position: 'absolute', top: '4%', bottom: '14%', left: '24%', right: '24%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ color: '#9ca3af', textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Завантажте фото для EST стилю</p>
            </div>
          </div>
        )}

        {imageUrl && (
          <div
            onMouseDown={e => startDrag('illus', 'move', e)}
            onTouchStart={e => startDrag('illus', 'move', e)}
            onClick={e => handleClick('illus', e)}
            style={{ position: 'absolute', left: `${illus.x}%`, top: `${illus.y}%`, width: `${illus.size}%`, transform: 'translate(-50%, -50%)', cursor: selected === 'illus' ? 'grab' : 'pointer', zIndex: selected === 'illus' ? 15 : 5 }}
          >
            {/* Clip wrapper: clips from bottom (cropBottom%), dashed border inside clips too */}
            <div style={{ clipPath: illus.cropBottom > 0 ? `inset(0 0 ${illus.cropBottom}% 0)` : undefined }}>
              {selected === 'illus' && <div style={{ position: 'absolute', inset: '-5px', border: '2px dashed #4f46e5', borderRadius: '6px', pointerEvents: 'none' }} />}
              <img ref={illusImgRef} src={cleanedUrl || imageUrl} alt="EST illustration" style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
            </div>
            {/* Resize handle — outside clip, always at visual bottom-right */}
            {selected === 'illus' && (
              <div onMouseDown={e => startDrag('illus', 'resize', e)} onTouchStart={e => startDrag('illus', 'resize', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', background: '#4f46e5', border: '2px solid #fff', borderRadius: '4px', cursor: 'nwse-resize', zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            )}
            {/* Crop-bottom handle — sits at the crop boundary line (bottom center) */}
            {selected === 'illus' && (
              <div onMouseDown={e => startDrag('illus', 'cropBottom', e)} onTouchStart={e => startDrag('illus', 'cropBottom', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: `${100 - (illus.cropBottom || 0)}%`, left: '50%', transform: 'translate(-50%, -50%)', width: '28px', height: '14px', background: '#4f46e5', border: '2px solid #fff', borderRadius: '4px', cursor: 'ns-resize', zIndex: 31, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M5 7L2 4M5 7L8 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="1" x2="9" y2="1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            )}
          </div>
        )}

        {showEstText && <div onMouseDown={e => startDrag('est', 'move', e)} onTouchStart={e => startDrag('est', 'move', e)} onClick={e => handleClick('est', e)} style={{ position: 'absolute', left: `${estEl.x}%`, top: `${estEl.y}%`, transform: 'translate(-50%, -50%)', fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: `${estEl.fontSize}vw`, letterSpacing: '6px', color: estEl.color, cursor: isEstSelected ? 'grab' : 'pointer', zIndex: isEstSelected ? 20 : 10, whiteSpace: 'nowrap' }}>
          {isEstSelected && <div style={{ position: 'absolute', inset: '-5px', border: '2px dashed #4f46e5', borderRadius: '6px', pointerEvents: 'none' }} />}
          {(estText || 'EST.2025').toUpperCase()}
          {isEstSelected && (
            <div onMouseDown={e => startDrag('est', 'resize', e)} onTouchStart={e => startDrag('est', 'resize', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', background: '#4f46e5', border: '2px solid #fff', borderRadius: '4px', cursor: 'nwse-resize', zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
          )}
        </div>}

        {letterStyle === 'D' && letters.map(letter => {
          const isSelected = selected === letter.id
          return (
            <div key={letter.id} onMouseDown={e => startDrag(letter.id, 'move', e)} onTouchStart={e => startDrag(letter.id, 'move', e)} onClick={e => handleClick(letter.id, e)} style={{ position: 'absolute', left: `${letter.x}%`, top: `${letter.y}%`, width: `${letter.size}%`, transform: `rotate(${letter.rotation}deg)`, transformOrigin: 'center center', cursor: isSelected ? 'grab' : 'pointer', zIndex: isSelected ? 20 : 10 }}>
              {isSelected && <div style={{ position: 'absolute', inset: '-5px', border: '2px dashed #4f46e5', borderRadius: '6px', pointerEvents: 'none' }} />}
              {isSelected && (
                <>
                  <div onMouseDown={e => startDrag(letter.id, 'rotate', e)} onTouchStart={e => startDrag(letter.id, 'rotate', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '-26px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '20px', background: '#ffffff', border: '2px solid #4f46e5', borderRadius: '50%', cursor: 'ew-resize', zIndex: 31, boxShadow: '0 1px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                  </div>
                  <div style={{ position: 'absolute', top: '-24px', left: 'calc(50% + 14px)', background: '#4f46e5', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none', whiteSpace: 'nowrap', lineHeight: '16px' }}>
                    {Math.round(letter.rotation)}° · {Math.round(letter.size)}%
                  </div>
                </>
              )}
              <svg viewBox="60 110 360 460" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <path d={D_PATH} fill={letter.color} fillRule="evenodd" />
              </svg>
              {isSelected && (
                <div onMouseDown={e => startDrag(letter.id, 'resize', e)} onTouchStart={e => startDrag(letter.id, 'resize', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', background: '#4f46e5', border: '2px solid #fff', borderRadius: '4px', cursor: 'nwse-resize', zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
              )}
            </div>
          )
        })}

        {letterStyle === 'TTO' && ttoLetters.map(letter => {
          const isSelected = selected === letter.id
          const isO = letter.id === 'o'
          return (
            <div key={letter.id} onMouseDown={e => startDrag(letter.id, 'move', e)} onTouchStart={e => startDrag(letter.id, 'move', e)} onClick={e => handleClick(letter.id, e)} style={{ position: 'absolute', left: `${letter.x}%`, top: `${letter.y}%`, width: `${letter.size}%`, transform: `rotate(${letter.rotation}deg)`, transformOrigin: 'center center', cursor: isSelected ? 'grab' : 'pointer', zIndex: isSelected ? 20 : 10 }}>
              {isSelected && <div style={{ position: 'absolute', inset: '-5px', border: '2px dashed #4f46e5', borderRadius: '6px', pointerEvents: 'none' }} />}
              {isSelected && (
                <>
                  <div onMouseDown={e => startDrag(letter.id, 'rotate', e)} onTouchStart={e => startDrag(letter.id, 'rotate', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '-26px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '20px', background: '#ffffff', border: '2px solid #4f46e5', borderRadius: '50%', cursor: 'ew-resize', zIndex: 31, boxShadow: '0 1px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                  </div>
                  <div style={{ position: 'absolute', top: '-24px', left: 'calc(50% + 14px)', background: '#4f46e5', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none', whiteSpace: 'nowrap', lineHeight: '16px' }}>
                    {Math.round(letter.rotation)}° · {Math.round(letter.size)}%
                  </div>
                </>
              )}
              {isO ? (
                <svg viewBox="285 0 270 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <ellipse cx="420" cy="150" rx="135" ry="150" fill={letter.color} />
                  <ellipse cx="420" cy="150" rx="95" ry="110" fill="white" />
                </svg>
              ) : (
                <svg viewBox="0 0 260 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                  <rect x="0" y="0" width="260" height="40" rx="20" fill={letter.color} />
                  <rect x="110" y="20" width="40" height="280" rx="20" fill={letter.color} />
                </svg>
              )}
              {isSelected && (
                <div onMouseDown={e => startDrag(letter.id, 'resize', e)} onTouchStart={e => startDrag(letter.id, 'resize', e)} onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', background: '#4f46e5', border: '2px solid #fff', borderRadius: '4px', cursor: 'nwse-resize', zIndex: 30, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (selectedLetter || selectedTTOLetter || isEstSelected || isIllusSelected) && (
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #f3f4f6', background: '#fafafa', borderRadius: '0 0 12px 12px', flexWrap: 'wrap' }}>
          {isIllusSelected ? (
            <>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>Ескіз:</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{Math.round(illus.size)}% розмір</span>
              {illus.cropBottom > 0 && <span style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}>обрізано знизу {Math.round(illus.cropBottom)}%</span>}
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto', whiteSpace: 'nowrap' }}>Тягни · ↑ обрізання · кут → розмір</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{isEstSelected ? 'EST текст' : selected === 'left' ? 'Ліва D' : selected === 'right' ? 'Права D' : selected === 'tLeft' ? 'Ліва T' : selected === 'tRight' ? 'Права T' : 'Буква O'}:</span>
              {PRESET_COLORS.map(color => (
                <button key={color} onClick={() => setColor(color)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, border: currentColor === color ? '3px solid #4f46e5' : '2px solid #d1d5db', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
              ))}
              <input type="color" value={currentColor || '#000000'} onChange={e => setColor(e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: '2px solid #d1d5db', cursor: 'pointer', borderRadius: '50%', background: 'none' }} title="Власний колір" />
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{isEstSelected ? 'Тягни • кут → розмір' : 'Тягни • ○ поворот • кут → розмір'}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
})

// ─── EditPromptBox ────────────────────────────────────────────────────────────

function EditPromptBox({ currentImage, onSubmit, onCancel, loading }) {
  const [text, setText] = useState('')
  const QUICK = ['Зроби яскравіше', 'Видали фон', 'Додай більше деталей', 'Зміни кольори на темніші', 'Зроби контраст сильніше', 'Прибери зайві елементи']
  return (
    <div className="mt-4 border border-indigo-200 rounded-2xl bg-indigo-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Внести правки в дизайн</p>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      {currentImage && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ maxHeight: '160px' }}>
          <img src={currentImage} alt="Поточний дизайн" className="w-full h-full object-contain" style={{ maxHeight: '160px' }} />
        </div>
      )}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Опишіть правки: що змінити, прибрати або додати..."
        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
      />
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map(q => (
          <button key={q} onClick={() => setText(q)} className="text-xs border border-indigo-200 text-indigo-600 rounded-lg px-2.5 py-1 hover:bg-indigo-100 transition-colors bg-white">
            {q}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 justify-center text-sm">Скасувати</button>
        <button
          onClick={() => onSubmit(text)}
          disabled={!text.trim() || loading}
          className="btn-primary flex-1 justify-center text-sm"
        >
          {loading
            ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg> Надсилаю...</>
            : 'Застосувати правки'}
        </button>
      </div>
    </div>
  )
}

// ─── MockupEditorModal ────────────────────────────────────────────────────────

function MockupEditorModal({ designImage, product, fileName, initialOverlay, onSave, onClose }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const dragRef = useRef(null)
  const [overlay, setOverlay] = useState(initialOverlay || { x: 50, y: 35, size: 32 })
  const [viewScale, setViewScale] = useState(1.0)
  const [downloading, setDownloading] = useState(false)

  // Drag & resize (uses innerRef so coords account for viewScale)
  useEffect(() => {
    const onMove = (e) => {
      const dr = dragRef.current
      if (!dr) return
      if (e.cancelable) e.preventDefault()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const rect = innerRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = (clientX - dr.sx) / rect.width * 100
      const dy = (clientY - dr.sy) / rect.height * 100
      if (dr.type === 'move')   setOverlay(prev => ({ ...prev, x: dr.ox + dx, y: dr.oy + dy }))
      if (dr.type === 'resize') setOverlay(prev => ({ ...prev, size: Math.max(8, Math.min(90, dr.os + (dx + dy) * 0.5)) }))
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  // Scroll to zoom whole mockup (t-shirt + design together)
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.12 : -0.12
      setViewScale(prev => Math.max(0.5, Math.min(3.0, prev + delta)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const startDrag = (type, e) => {
    e.preventDefault(); e.stopPropagation()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current = { type, sx: clientX, sy: clientY, ox: overlay.x, oy: overlay.y, os: overlay.size }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const SIZE = 1200
      const canvas = document.createElement('canvas')
      canvas.width = SIZE; canvas.height = SIZE
      const ctx = canvas.getContext('2d')

      const productImg = await loadImgEl(product.image)
      ctx.drawImage(productImg, 0, 0, SIZE, SIZE)

      if (designImage) {
        const designImg = await loadImgEl(designImage)
        const dW = overlay.size / 100 * SIZE
        const aspect = (designImg.naturalHeight || designImg.height) / (designImg.naturalWidth || designImg.width)
        const dH = dW * aspect
        const dX = overlay.x / 100 * SIZE - dW / 2
        const dY = overlay.y / 100 * SIZE - dH / 2
        ctx.drawImage(designImg, dX, dY, dW, dH)
      }

      const link = document.createElement('a')
      link.download = `${fileName || 'mockup'}.mokap.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Mockup download error:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">Мокап товару</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">Перетягніть дизайн · кут → розмір · скрол → зум футболки</p>
        </div>

        <div className="px-6 pb-4 flex-1 overflow-hidden">
          <div
            ref={outerRef}
            style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', userSelect: 'none', touchAction: 'none', cursor: 'default', overflow: 'hidden' }}
          >
            <div
              ref={innerRef}
              style={{ position: 'absolute', inset: 0, transform: `scale(${viewScale})`, transformOrigin: 'center center' }}
            >
              <img src={product?.image} alt={product?.nameUk} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }} />
              {designImage && (
                <div
                  onMouseDown={e => startDrag('move', e)}
                  onTouchStart={e => startDrag('move', e)}
                  style={{ position: 'absolute', left: `${overlay.x}%`, top: `${overlay.y}%`, width: `${overlay.size}%`, transform: 'translate(-50%, -50%)', cursor: 'grab', zIndex: 10 }}
                >
                  <img src={designImage} alt="design" style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
                  <div
                    onMouseDown={e => startDrag('resize', e)}
                    onTouchStart={e => startDrag('resize', e)}
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '22px', height: '22px', background: '#4f46e5', border: '2px solid #fff', borderRadius: '4px', cursor: 'nwse-resize', zIndex: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center gap-3 flex-shrink-0">
          <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 text-sm font-medium text-indigo-600 border border-indigo-300 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
            {downloading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            )}
            Завантажити мокап
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Закрити</button>
            <button onClick={() => { onSave?.(overlay); onClose() }} className="btn-primary">Готово</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AIEditModal ──────────────────────────────────────────────────────────────

function AIEditModal({ onClose }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const handleApply = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">AI Редагування</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Наприклад: зроби фон темнішим..." className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['Зроби яскравіше', 'Додай рамку', 'Видали фон', 'Зміни колір'].map(s => (
            <button key={s} onClick={() => setPrompt(s)} className="text-xs border border-indigo-200 text-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors">{s}</button>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Скасувати</button>
          <button onClick={handleApply} disabled={!prompt.trim() || loading} className="btn-primary flex-1 justify-center">
            {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg> Застосування...</> : 'Застосувати'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ChangeProductModal ───────────────────────────────────────────────────────

function ChangeProductModal({ current, onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !search.trim() || search.trim().toLowerCase().split(/\s+/).every(w => p.nameUk.toLowerCase().includes(w))
    return matchCat && matchSearch
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">Змінити товар</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>

        <div className="px-5 pt-3 pb-2 flex-shrink-0 space-y-2">
          {/* Search */}
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Пошук..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          {/* Category buttons */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setActiveCategory('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Всі</button>
            {productCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            {filtered.length === 0 && <p className="text-center py-6 text-gray-400 text-sm">Нічого не знайдено</p>}
            {filtered.map(p => (
              <button key={p.id} onClick={() => { onSelect(p.id); onClose() }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-colors ${current === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <img src={p.image} alt={p.nameUk} className="w-11 h-11 object-cover rounded-lg flex-shrink-0" />
                <span className="font-medium text-gray-800 text-sm">{p.nameUk}</span>
                {current === p.id && <span className="ml-auto flex-shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg></span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DesignPlacement ──────────────────────────────────────────────────────────

export default function DesignPlacement({ designData, onUpdate, onSaveOrder }) {
  const navigate = useNavigate()
  const estPosterRef = useRef(null)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(designData?.selectedProducts?.[0] || 'hoodie-black')
  const [showAIEdit, setShowAIEdit] = useState(false)
  const [showChangeProduct, setShowChangeProduct] = useState(false)
  const [showMockup, setShowMockup] = useState(false)
  const [mockupDesignUrl, setMockupDesignUrl] = useState(null)
  const [mockupOverlay, setMockupOverlay] = useState({ x: 50, y: 35, size: 32 })
  const [estText, setEstText] = useState('EST.2025')
  const [showEstText, setShowEstText] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState(null)
  const [showEditPrompt, setShowEditPrompt] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [preparingMockup, setPreparingMockup] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState(null)
  const [fileName, setFileName] = useState(() => {
    if (designData?.fileName) return designData.fileName
    const year = new Date().getFullYear()
    const style = designData?.selectedStyle
    if (style === 'dad-face') return `Dad_Est_${year}_Design`
    if (style === 'est-face') return `Est_${year}_Design`
    if (style === 'faceless-face') return `Faceless_${year}_Design`
    return `Design_${year}`
  })

  useEffect(() => {
    if (!designData?.uploadedFile) return
    const url = URL.createObjectURL(designData.uploadedFile)
    setOriginalImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [designData?.uploadedFile])

  const isEst = designData?.selectedStyle === 'est-face' || designData?.selectedStyle === 'faceless-face'
  const generatedDesigns = designData?.generatedDesigns || null
  const hasDesigns = generatedDesigns && generatedDesigns.length > 0
  const hasTwoDesigns = generatedDesigns && generatedDesigns.length > 1
  const currentDesignImage = hasDesigns ? generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].image : null
  const currentProduct = allProducts.find(p => p.id === selectedProduct) || allProducts[0]

  // Keep mockupDesignUrl in sync whenever the design or EST settings change
  useEffect(() => {
    let cancelled = false
    const update = async () => {
      if (!currentDesignImage) { setMockupDesignUrl(null); return }
      try {
        if (isEst && estPosterRef.current) {
          const canvas = await estPosterRef.current.exportTransparent()
          if (!cancelled) setMockupDesignUrl(canvas.toDataURL('image/png'))
        } else {
          if (!cancelled) setMockupDesignUrl(currentDesignImage)
        }
      } catch { if (!cancelled) setMockupDesignUrl(currentDesignImage) }
    }
    update()
    return () => { cancelled = true }
  }, [currentDesignImage, isEst, estText, showEstText])

  const handleRegenerate = async () => {
    if (!designData?.uploadedFile || !designData?.selectedStyle) { navigate('/create'); return }
    setRegenerating(true); setRegenError(null)
    try {
      clearCache(designData.uploadedFile, designData.selectedStyle)
      const newDesigns = await generateDesigns(designData.uploadedFile, designData.selectedStyle)
      onUpdate?.({ generatedDesigns: newDesigns })
      setActiveTab(0)
    } catch (e) {
      setRegenError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  const handleEdit = async (editText) => {
    if (!currentDesignImage || !editText.trim()) return
    setEditing(true); setEditError(null); setShowEditPrompt(false)
    try {
      const edited = await editDesign(currentDesignImage, editText)
      const updated = (generatedDesigns || []).map((d, i) =>
        i === Math.min(activeTab, (generatedDesigns?.length || 1) - 1) ? { ...d, image: edited } : d
      )
      onUpdate?.({ generatedDesigns: updated.length ? updated : [{ label: 'Редаговано', image: edited }] })
    } catch (e) {
      setEditError(e.message)
    } finally {
      setEditing(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      let dataUrl
      if (isEst && estPosterRef.current) {
        const canvas = await estPosterRef.current.exportToCanvas()
        dataUrl = canvas.toDataURL('image/png')
      } else if (currentDesignImage) {
        dataUrl = currentDesignImage
      }
      if (dataUrl) { const a = document.createElement('a'); a.download = `${fileName || 'design'}.png`; a.href = dataUrl; a.click() }
    } catch (e) { console.error(e) } finally { setDownloading(false) }
  }

  const handleOpenMockup = async () => {
    setPreparingMockup(true)
    try {
      let url = currentDesignImage
      if (isEst && estPosterRef.current) {
        const canvas = await estPosterRef.current.exportTransparent()
        url = canvas.toDataURL('image/png')
      }
      setMockupDesignUrl(url)
      setShowMockup(true)
    } catch (e) {
      setMockupDesignUrl(currentDesignImage)
      setShowMockup(true)
    } finally {
      setPreparingMockup(false)
    }
  }

  const handleDownloadMockup = async () => {
    setPreparingMockup(true)
    try {
      let designUrl = mockupDesignUrl
      if (!designUrl) {
        if (isEst && estPosterRef.current) {
          const canvas = await estPosterRef.current.exportTransparent()
          designUrl = canvas.toDataURL('image/png')
        } else {
          designUrl = currentDesignImage
        }
        setMockupDesignUrl(designUrl)
      }
      const SIZE = 1200
      const canvas = document.createElement('canvas')
      canvas.width = SIZE; canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      const productImg = await loadImgEl(currentProduct.image)
      ctx.drawImage(productImg, 0, 0, SIZE, SIZE)
      if (designUrl) {
        const designImg = await loadImgEl(designUrl)
        const dW = mockupOverlay.size / 100 * SIZE
        const aspect = (designImg.naturalHeight || designImg.height) / (designImg.naturalWidth || designImg.width)
        const dH = dW * aspect
        ctx.drawImage(designImg, mockupOverlay.x / 100 * SIZE - dW / 2, mockupOverlay.y / 100 * SIZE - dH / 2, dW, dH)
      }
      const link = document.createElement('a')
      link.download = `${fileName || 'mockup'}.mokap.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Mockup download error:', e)
    } finally {
      setPreparingMockup(false)
    }
  }

  const handleSaveDesign = async () => {
    const now = new Date()
    const dateStr = now.toLocaleString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const orderNum = fileName ? `#${fileName}` : `#${String(now.getTime()).slice(-5)}`

    // Build small design thumbnail (≤200px) to store alongside product image
    let thumb = currentProduct?.image || null
    let fullImage = null
    try {
      let srcCanvas = null
      if (isEst && estPosterRef.current) {
        srcCanvas = await estPosterRef.current.exportToCanvas()
      } else if (currentDesignImage && currentDesignImage.startsWith('data:')) {
        const img = await loadImgEl(currentDesignImage)
        srcCanvas = document.createElement('canvas')
        srcCanvas.width = img.width; srcCanvas.height = img.height
        srcCanvas.getContext('2d').drawImage(img, 0, 0)
      }
      if (srcCanvas) {
        fullImage = srcCanvas.toDataURL('image/png')
        const tw = 800, th = Math.round(srcCanvas.height * 800 / srcCanvas.width)
        const t = document.createElement('canvas'); t.width = tw; t.height = th
        t.getContext('2d').drawImage(srcCanvas, 0, 0, tw, th)
        thumb = t.toDataURL('image/jpeg', 0.85)
      }
    } catch {}

    const designSnapshot = {
      selectedProducts: designData?.selectedProducts || [selectedProduct],
      selectedStyle: designData?.selectedStyle,
      generatedDesigns: designData?.generatedDesigns,
      fileName,
      productColors: designData?.productColors,
      uploadedFile: null,
    }

    const catMap = { 'hoodie-basic': 'hoodie', 'hoodie-fleece': 'hoodie', 'hoodie-premium': 'hoodie', 'tshirt-basic': 'tshirt', 'tshirt-oversized': 'oversized', 'sweatshirt': 'sweatshirt', 'cap': 'cap', 'shopper': 'totebag' }
    const order = {
      id: orderNum,
      name: fileName || `Дизайн від ${dateStr}`,
      status: 'new',
      productId: catMap[currentProduct?.category] || currentProduct?.category || 'hoodie',
      productName: currentProduct?.nameUk || '',
      date: dateStr,
      colors: [designData?.productColors?.[selectedProduct] || '#1a1a1a'],
      image: thumb,
    }
    onSaveOrder?.(order, { fullImage, designSnapshot })
    navigate('/orders')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Розміщення дизайну</h1>
            <p className="text-sm text-gray-500">Ваш дизайн готовий! Оберіть варіант та розмістіть на товарі.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-sm text-gray-400">Створити дизайн</span>
            </div>
            <div className="w-8 h-px bg-indigo-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span className="text-sm font-medium text-indigo-600">Розміщення</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
      {/* ── Left: main design area ── */}
      <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6">
        {hasTwoDesigns && (
          <div className="flex gap-2 mb-5">
            {generatedDesigns.map((d, i) => (
              <button key={i} onClick={() => setActiveTab(i)} className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${activeTab === i ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}>
                {d.label}<span className="ml-2 text-xs opacity-70">{i + 1}/2</span>
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Згенерований дизайн</h2>
            {hasDesigns && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">{generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].label}</span>}
          </div>
          <div className="p-5">
            {regenerating ? (
              <div className="w-full bg-gray-50 rounded-xl flex flex-col items-center justify-center py-20 gap-4">
                <svg className="animate-spin w-10 h-10 text-indigo-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
                <p className="text-sm text-gray-500 font-medium">Генерую новий дизайн... (15–30 сек)</p>
              </div>
            ) : (
              <div className="w-full bg-gray-50 rounded-xl overflow-hidden">
                {isEst ? (
                  <EstPosterView ref={estPosterRef} imageUrl={currentDesignImage} estText={estText} showEstText={showEstText} />
                ) : currentDesignImage ? (
                  <img src={currentDesignImage} alt="Generated design" className="w-full h-auto block" style={{ maxHeight: '80vh' }} />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400 py-20">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p className="text-sm text-center max-w-xs">Завантажте фото та оберіть стиль для генерації</p>
                  </div>
                )}
              </div>
            )}

            {regenError && <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{regenError}</div>}

            {isEst && !regenerating && (
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">EST текст:</label>
                <input
                  type="text"
                  value={estText}
                  onChange={e => setEstText(e.target.value)}
                  placeholder="EST.2025"
                  disabled={!showEstText}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  onClick={() => setShowEstText(v => !v)}
                  title={showEstText ? 'Сховати EST текст' : 'Показати EST текст'}
                  className={`flex-shrink-0 p-2 rounded-xl border transition-colors ${showEstText ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  {showEstText
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
              </div>
            )}

            {editError && <div className="mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{editError}</div>}

            {showEditPrompt && (
              <EditPromptBox
                currentImage={currentDesignImage}
                onSubmit={handleEdit}
                onCancel={() => setShowEditPrompt(false)}
                loading={editing}
              />
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={handleRegenerate} disabled={regenerating || editing} className="btn-secondary flex-1 justify-center">
                {regenerating ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg> Генерація...</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Перегенерувати</>}
              </button>
              {hasDesigns && (
                <button onClick={() => { setShowEditPrompt(v => !v); setEditError(null) }} disabled={editing || regenerating} className="btn-secondary flex-1 justify-center" style={{ borderColor: showEditPrompt ? '#6366f1' : undefined, color: showEditPrompt ? '#6366f1' : undefined }}>
                  {editing ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg> Правки...</>
                    : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Внести правки</>}
                </button>
              )}
              {(hasDesigns || isEst) && (
                <button onClick={handleDownload} disabled={downloading} className="btn-secondary justify-center" style={{ minWidth: '52px' }} title="Завантажити зображення">
                  {downloading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Обраний товар</h2>
            <button onClick={() => setShowChangeProduct(true)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              Змінити товар
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          <div className="p-5 flex gap-6 items-center">
            <button onClick={handleOpenMockup} disabled={preparingMockup} className="relative w-48 h-48 flex-shrink-0 bg-white rounded-xl overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-indigo-400 transition-all group" title="Редагувати мокап">
              <img src={currentProduct?.image} alt={currentProduct?.nameUk} className="w-full h-full object-cover" />
              {mockupDesignUrl && !preparingMockup && (
                <div
                  className="absolute pointer-events-none"
                  style={{ left: `${mockupOverlay.x}%`, top: `${mockupOverlay.y}%`, width: `${mockupOverlay.size}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <img src={mockupDesignUrl} alt="design overlay" className="w-full mix-blend-multiply" />
                </div>
              )}
              {preparingMockup && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <svg className="animate-spin w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
                </div>
              )}
              <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all flex items-end justify-center pb-3">
                <span className="opacity-0 group-hover:opacity-100 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">Редагувати</span>
              </div>
            </button>
            <div className="flex-1">
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Товар:</span><span className="font-medium text-gray-800">{currentProduct?.nameUk}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Положення:</span><span className="font-medium text-gray-800">Центр спереду</span></div>
                {hasDesigns && <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Варіант:</span><span className="font-medium text-indigo-600">{generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].label}</span></div>}
              </div>
              <button onClick={handleOpenMockup} disabled={preparingMockup} className="w-full mb-3 flex items-center justify-center gap-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
                {preparingMockup ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg> Підготовка...</>
                  : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Редагувати на товарі</>}
              </button>
              <button onClick={handleSaveDesign} className="btn-primary w-full justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Зберегти дизайн
              </button>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/create')} className="mt-5 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Повернутись до налаштувань
        </button>
      </div>
      </div>{/* end left scroll */}

      {/* ── Right sidebar ── */}
      <div className="w-96 flex-shrink-0 border-l border-gray-100 bg-white overflow-y-auto">
        <div className="p-5 space-y-6">

          {/* File name */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Назва файлу</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-sm text-gray-400 font-medium flex-shrink-0">.png</span>
            </div>
          </div>

          {/* Original uploaded photo */}
          {originalImageUrl && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Приклад початкового зображення</h3>
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <img src={originalImageUrl} alt="Оригінальне фото" className="w-full h-auto block object-cover" />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {downloading
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
              Скачати зображення
            </button>
            <button
              onClick={handleDownloadMockup}
              disabled={preparingMockup}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {preparingMockup
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
              Скачати мокап
            </button>
            <button
              onClick={handleSaveDesign}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Зберегти дизайн
            </button>
          </div>

        </div>
      </div>
      </div>{/* end flex row */}

      {showAIEdit && <AIEditModal onClose={() => setShowAIEdit(false)} />}
      {showChangeProduct && <ChangeProductModal current={selectedProduct} onSelect={setSelectedProduct} onClose={() => setShowChangeProduct(false)} />}
      {showMockup && <MockupEditorModal designImage={mockupDesignUrl} product={currentProduct} fileName={fileName} initialOverlay={mockupOverlay} onSave={setMockupOverlay} onClose={() => setShowMockup(false)} />}
    </div>
  )
}
