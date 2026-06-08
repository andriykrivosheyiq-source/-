import React, { useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { THREAD_PALETTE } from '../data/threadPalette'
import { vectorizeImage } from '../services/vectorizer'

const CSS = `
.pe-container{display:flex;gap:14px;padding:16px;height:100%;align-items:stretch;font-family:Inter,"Segoe UI",Arial,Helvetica,sans-serif;color:#111;background:#f5f6f7;box-sizing:border-box;overflow:hidden}
.pe-container *,.pe-container *:before,.pe-container *:after{box-sizing:inherit}
.pe-left{width:360px;min-width:260px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.pe-panel{background:#fbfbfb;border:1px solid #e6e6e6;border-radius:10px;padding:12px;height:100%;overflow:auto;box-shadow:0 2px 8px rgba(24,24,24,0.04)}
.pe-panel h2{margin:0 0 8px 0;font-size:15px;color:#222}
.pe-controls-row{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}
.pe-container label.small{font-size:13px;color:#333;display:flex;align-items:center;gap:8px;min-width:120px}
.pe-container input[type=number],.pe-container input[type=text]{padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-family:inherit;font-size:13px}
.pe-container input[type=range]{accent-color:#2b6fb3}
.pe-container input[type=color]{width:44px;height:30px;padding:0;border-radius:6px;border:1px solid #ddd}
.pe-container button{padding:8px 12px;cursor:pointer;font-size:13px;border-radius:8px;border:1px solid transparent;background:#fff;box-shadow:0 1px 0 rgba(0,0,0,0.03)}
.pe-container button:hover{transform:translateY(-1px)}
.pe-container button.primary{background:linear-gradient(180deg,#2f80ed,#1e63c8);color:#fff;border-color:rgba(0,0,0,0.06)}
.pe-container button.danger{background:#ffecec;color:#a00;border-color:#f5bcbc}
.pe-note{color:#6f6f6f;font-size:13px;margin-top:6px;line-height:1.4}
.pe-muted{color:#6f6f6f;font-size:12px}
.pe-muted-small{color:#6f6f6f;font-size:12px}
.group-item{display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #eee;background:#fff;border-radius:8px;margin-bottom:8px}
.sw{width:28px;height:20px;border:1px solid #bbb;cursor:pointer;border-radius:4px;flex:0 0 28px}
.palette-swatch{width:36px;height:28px;border-radius:6px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:11px;color:#fff;text-shadow:0 1px 0 rgba(0,0,0,0.3)}
.pe-right{flex:1;min-width:420px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.pe-preview-wrap{border-radius:10px;border:1px solid #e6e6e6;background:#fff;padding:12px;box-sizing:border-box;height:100%;overflow:hidden;display:flex;position:relative;box-shadow:0 2px 12px rgba(0,0,0,0.04)}
.pe-preview-columns{display:flex;gap:14px;width:100%;align-items:flex-start;justify-content:center;margin:0 auto}
.pe-preview-column{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:8px;padding:8px;border:1px solid #f0f0f0;height:calc(100vh - 120px);overflow:auto}
.pe-preview-column#editedColumn{flex:1 1 0;max-width:55%;min-width:320px}
.pe-preview-column#originalColumn{flex:1 1 0;max-width:45%;min-width:300px}
.pe-preview-column .title{font-size:13px;color:#666;margin-bottom:8px;text-align:center;width:100%}
#svgPreview,#originalPreview{width:100%;height:auto;display:block;background:#fff;padding:8px;border-radius:6px;box-sizing:border-box}
#svgPreview svg,#originalPreview svg{width:100%;height:auto;display:block;max-width:100%;transform-origin:0 0}
.highlight-elm{outline:none;filter:drop-shadow(0 0 6px rgba(255,0,0,0.35));stroke-width:3px !important;stroke:#FF0000 !important;stroke-linejoin:round;stroke-linecap:round;paint-order:stroke fill markers}
.pe-preview-overlay{position:absolute;inset:0;pointer-events:none}
.side-detected{display:none !important}
.side-codes{position:absolute;right:18px;top:18px;display:flex;flex-direction:column;gap:8px;max-height:calc(100% - 56px);overflow:auto;pointer-events:auto;z-index:150;min-width:180px}
.side-badge{background:rgba(255,255,255,0.95);border:1px solid #e6e6e6;padding:6px 8px;display:flex;align-items:center;gap:8px;border-radius:8px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.04);font-family:monospace;font-size:13px;white-space:nowrap}
.side-badge .sw{width:18px;height:12px;border-radius:4px;border:1px solid #bbb;flex:0 0 18px}
.side-badge .count{color:#666;font-size:12px;margin-left:6px}
.side-badge .del-btn{position:absolute;right:8px;top:4px;width:20px;height:20px;border-radius:6px;background:#fff;border:1px solid #e6e6e6;color:#a00;font-weight:bold;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;padding:0}
.side-badge.custom{position:relative;padding-right:32px}
.side-badge.generated{position:relative;padding-right:32px}
.palette{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:200px;overflow:auto;padding-right:6px}
.palette-swatch.used{opacity:0.28;pointer-events:none;cursor:default;filter:grayscale(60%)}
.side-add-area{position:absolute;right:18px;bottom:18px;z-index:160;pointer-events:auto;display:flex;gap:8px;flex-direction:column;align-items:flex-end}
.side-add-btn{background:#fff;border:1px solid #e6e6e6;padding:8px 10px;border-radius:10px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.04);font-size:18px}
.side-add-dialog{position:absolute;right:18px;bottom:64px;z-index:170;background:#fff;border:1px solid #ddd;padding:10px;border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,0.08);display:flex;gap:8px;align-items:center;pointer-events:auto;flex-wrap:wrap}
.element-editor{position:fixed;z-index:9999;background:rgba(255,255,255,0.99);border:1px solid #ddd;padding:8px;border-radius:8px;display:flex;gap:8px;align-items:center;pointer-events:auto;box-shadow:0 8px 20px rgba(0,0,0,0.08)}
.element-editor .hex-in{width:120px;padding:8px;border:1px solid #ddd;border-radius:6px;font-family:monospace}
.detected-editor{background:rgba(255,255,255,0.95);border:1px solid #eee;padding:8px;border-radius:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.detected-editor input[type=color]{width:46px;height:30px;padding:0;border-radius:6px;border:1px solid #ccc}
.detected-editor .hex-in{width:120px;padding:8px;border:1px solid #ddd;border-radius:6px;font-family:monospace;font-size:13px}
.pe-panel::-webkit-scrollbar,.pe-preview-column::-webkit-scrollbar,.side-codes::-webkit-scrollbar,.palette::-webkit-scrollbar{height:10px;width:10px}
.pe-panel::-webkit-scrollbar-thumb,.pe-preview-column::-webkit-scrollbar-thumb,.side-codes::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:6px}
.pe-footer-controls{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:8px}
`

export default function PaletteEditor() {
  const containerRef = useRef(null)
  const location = useLocation()
  const autoImageRef = useRef(location.state?.designImage || null)

  useEffect(() => {
    const C = containerRef.current
    if (!C) return
    const $ = id => C.querySelector('#' + id)

    const probe = document.createElement('div')
    probe.style.display = 'none'
    document.body.appendChild(probe)

    const PALETTE = THREAD_PALETTE
    const STROKE_TO_FILL_THRESHOLD = 1.5

    let originalText = null
    let svgRoot = null
    let originalSvgRoot = null
    let groups = []
    let allGroups = []
    let labelsVisible = true
    let detectedColorsMap = new Map()
    let highlightedColors = new Set()
    let selectedDetectedHex = null
    let customColors = []
    let usedPaletteHex = new Set()
    let currentElementEditor = null
    let previewState = null

    // --- color math ---
    function parseColorString(str) {
      if (!str) return null
      str = String(str).trim()
      if (str === 'none' || str === 'transparent') return null
      try {
        probe.style.color = ''; probe.style.color = str
        const cs = getComputedStyle(probe).color
        const m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]
      } catch (e) {}
      const hex = (str.match(/^#([0-9a-f]{3,8})$/i) || [])[1]
      if (hex) {
        if (hex.length === 3) return [parseInt(hex[0]+hex[0],16), parseInt(hex[1]+hex[1],16), parseInt(hex[2]+hex[2],16)]
        if (hex.length === 6) return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)]
      }
      return null
    }
    function rgbToHex([r,g,b]) { return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase() }
    function srgbToLinear(c) { c=c/255; return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4) }
    function rgbToXyz(rgb) {
      const r=srgbToLinear(rgb[0]),g=srgbToLinear(rgb[1]),b=srgbToLinear(rgb[2])
      return [(r*0.4124564+g*0.3575761+b*0.1804375)*100,(r*0.2126729+g*0.7151521+b*0.0721750)*100,(r*0.0193339+g*0.1191921+b*0.9503041)*100]
    }
    function xyzToLab([x,y,z]) {
      const xr=x/95.047,yr=y/100,zr=z/108.883
      function f(t){return t>0.008856?Math.cbrt(t):(7.787*t+16/116)}
      return [(116*f(yr))-16,500*(f(xr)-f(yr)),200*(f(yr)-f(zr))]
    }
    function rgbToLab(rgb) { return xyzToLab(rgbToXyz(rgb)) }
    function deltaE(l1,l2) { const dl=l1[0]-l2[0],da=l1[1]-l2[1],db=l1[2]-l2[2]; return Math.sqrt(dl*dl+da*da+db*db) }
    function contrastTextColor(hex) {
      if(!hex||!/^#([0-9A-F]{6})$/i.test(hex)) return '#000'
      const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16)
      return (0.299*r+0.587*g+0.114*b)/255>0.6?'#000':'#fff'
    }
    const PALETTE_LABS = PALETTE.map(p => rgbToLab(p.rgb))

    function findPaletteByHex(hex) {
      if (!hex) return null
      const h = hex.toUpperCase()
      return PALETTE.find(pp => pp.hex.toUpperCase() === h) || null
    }

    function elementHasFill(el) {
      try {
        if (!el) return false
        const a = el.getAttribute && el.getAttribute('fill')
        if (a && a !== 'none' && a !== 'transparent') return true
        const s = el.getAttribute && el.getAttribute('style')
        if (s) { const m = s.match(/fill\s*:\s*([^;]+)/i); if (m && m[1].trim() !== 'none' && m[1].trim() !== 'transparent') return true }
        try { const cs = getComputedStyle(el); if (cs && cs.fill && cs.fill !== 'none' && cs.fill !== 'transparent') return true } catch(e){}
      } catch(e){}
      return false
    }

    function syncNodePaletteForElement(el, hex) {
      try {
        const p = findPaletteByHex(hex)
        const code = p ? p.code : (hex ? hex.toUpperCase() : null)
        for (const list of [groups, allGroups]) {
          if (!list) continue
          for (const g of list) { if (!g.nodes) continue; for (const n of g.nodes) { try { if (n.el === el) { n.paletteHex = hex; n.palCode = code } } catch(e){} } }
        }
      } catch(e){}
    }

    function shouldConvertStrokeToFill(el) {
      try {
        const af = el.getAttribute && el.getAttribute('fill')
        let sf = null
        const style = el.getAttribute && el.getAttribute('style')
        if (style) { const m = style.match(/fill\s*:\s*([^;]+)/i); if (m) sf = m[1].trim() }
        if (af && af !== 'none' && af !== 'transparent') return false
        if (sf && sf !== 'none' && sf !== 'transparent') return false
        try { const cs = getComputedStyle(el); if (cs && cs.fill && cs.fill !== 'none' && cs.fill !== 'transparent') return false } catch(e){}
        let sw = el.getAttribute && el.getAttribute('stroke-width')
        if (sw !== null && sw !== undefined && sw !== '') { sw = parseFloat(sw) } else {
          try { const cs = getComputedStyle(el); const w = cs && (cs.strokeWidth || cs['stroke-width']); if (w) { const m = String(w).match(/([\d.]+)/); sw = m ? parseFloat(m[1]) : NaN } else sw = NaN } catch(e){ sw = NaN }
        }
        if (isNaN(sw)) sw = 1
        return sw <= STROKE_TO_FILL_THRESHOLD
      } catch(e){ return false }
    }

    function setElementColor(el, hex, options = {}) {
      const skipSync = !!options.skipSync
      try {
        if (!el) return
        const useFill = elementHasFill(el) || shouldConvertStrokeToFill(el)
        if (useFill) {
          el.setAttribute('fill', hex)
          try { el.removeAttribute('stroke') } catch(e){}
          const s = el.getAttribute('style') || ''
          el.setAttribute('style', (s.replace(/stroke\s*:\s*[^;]+;?/ig,'').replace(/stroke-width\s*:\s*[^;]+;?/ig,'').replace(/fill\s*:\s*[^;]+;?/ig,'')+';fill:'+hex+';').replace(/^;+/,''))
        } else {
          el.setAttribute('stroke', hex)
          const s = el.getAttribute('style') || ''
          el.setAttribute('style', (s.replace(/stroke\s*:\s*[^;]+;?/ig,'')+';stroke:'+hex+';').replace(/^;+/,''))
        }
        try { el.paletteHex = hex } catch(e){}
        if (!skipSync) { syncNodePaletteForElement(el, hex); updateDetectedColorsUI(); addLabelsToGroups({perNode:false}); renderGroupsUI() }
      } catch(e){ console.warn('setElementColor err', e) }
    }

    function markPaletteHexUsed(hex, permanent = false) {
      if (!hex || !permanent) return
      usedPaletteHex.add(hex.toUpperCase())
      renderPalette()
      renderCustomBadges()
    }

    function removeCustomColor(hex) {
      if (!hex) return
      const u = hex.toUpperCase()
      const idx = customColors.findIndex(c => c.hex.toUpperCase() === u)
      if (idx >= 0) { customColors.splice(idx, 1); renderCustomBadges(); renderSideBadgesFromPosMap(buildPosMapFromGroups()) }
    }

    function buildPosMapFromGroups() {
      const posMap = new Map()
      if (!groups) return posMap
      const rf = 4
      for (const g of groups) {
        const code = g.palCode || (g.colorValue ? (findPaletteByHex(g.colorValue)?.code || g.colorValue) : g.key)
        const colorHex = g.colorValue || '#FFFFFF'
        try {
          const cx = Math.round(((g.centroid?.x) || (g.bbox ? g.bbox.x+g.bbox.w/2 : 0)) / rf) * rf
          const cy = Math.round(((g.centroid?.y) || (g.bbox ? g.bbox.y+g.bbox.h/2 : 0)) / rf) * rf
          const k = `${cx}_${cy}`
          if (!posMap.has(k)) posMap.set(k, {x:g.centroid?.x||0,y:g.centroid?.y||0,codes:new Set(),colorCounts:new Map(),count:(g.count||1)})
          const entry = posMap.get(k)
          if (code) entry.codes.add(String(code))
          entry.colorCounts.set(colorHex, (entry.colorCounts.get(colorHex)||0)+1)
        } catch(e){}
      }
      return posMap
    }

    // --- preview state ---
    function startPreviewOnElements(elems) {
      if (!elems || elems.length === 0) return
      clearPreviewState(false)
      const originals = new Map()
      for (const el of elems) { try { originals.set(el, {fill:el.getAttribute('fill'),stroke:el.getAttribute('stroke'),style:el.getAttribute('style')}) } catch(e){} }
      previewState = { elems: elems.slice(), originals }
    }
    function applyPreviewColor(hex) {
      if (!previewState || !previewState.elems) return
      applyManualColorToElements(previewState.elems, hex, {skipSync:true})
    }
    function clearPreviewState(commit) {
      if (!previewState) return
      try {
        if (!commit) {
          for (const el of previewState.elems) {
            try {
              const orig = previewState.originals.get(el)
              if (!orig) continue
              if (orig.fill === null || orig.fill === undefined) el.removeAttribute('fill'); else el.setAttribute('fill', orig.fill)
              if (orig.stroke === null || orig.stroke === undefined) el.removeAttribute('stroke'); else el.setAttribute('stroke', orig.stroke)
              if (orig.style === null || orig.style === undefined) el.removeAttribute('style'); else el.setAttribute('style', orig.style)
            } catch(e){}
          }
          updateDetectedColorsUI()
        } else {
          for (const el of previewState.elems) {
            try {
              const ef = getElementEffectiveColor(el)
              const hex = ef ? rgbToHex(ef) : (el.getAttribute('fill') || el.getAttribute('stroke') || null)
              if (hex) { syncNodePaletteForElement(el, hex); if (customColors.some(c => c.hex.toUpperCase() === hex.toUpperCase())) removeCustomColor(hex) }
            } catch(e){}
          }
          updateDetectedColorsUI()
          addLabelsToGroups({perNode:false})
          renderGroupsUI()
        }
      } catch(e){}
      previewState = null
    }

    // --- palette render ---
    const paletteEl = $('palette')
    function renderPalette() {
      if (!paletteEl) return
      paletteEl.innerHTML = ''
      const sorted = PALETTE.slice().sort((a,b) => parseInt(a.code)-parseInt(b.code))
      for (const p of sorted) {
        const isUsed = usedPaletteHex.has(p.hex.toUpperCase())
        const sw = document.createElement('div')
        sw.className = 'palette-swatch' + (isUsed ? ' used' : '')
        sw.style.background = p.hex
        sw.style.color = contrastTextColor(p.hex)
        sw.title = p.code + (isUsed ? ' (used)' : '')
        sw.textContent = p.code
        if (!isUsed) {
          sw.addEventListener('mouseenter', () => {
            const elems = getHighlightedElements()
            if (currentElementEditor?.el) startPreviewOnElements([currentElementEditor.el])
            else if (elems.length > 0) startPreviewOnElements(elems)
            else if (selectedDetectedHex && detectedColorsMap.has(selectedDetectedHex)) startPreviewOnElements(Array.from(detectedColorsMap.get(selectedDetectedHex).nodes))
            else startPreviewOnElements([])
            applyPreviewColor(p.hex)
          })
          sw.addEventListener('mousemove', () => { if (previewState) applyPreviewColor(p.hex) })
          sw.addEventListener('mouseleave', () => clearPreviewState(false))
          sw.addEventListener('click', () => {
            clearPreviewState(true)
            if (currentElementEditor?.el) {
              setElementColor(currentElementEditor.el, p.hex)
              try {
                if (currentElementEditor.editorEl) {
                  const picker = currentElementEditor.editorEl.querySelector('#elementColorPicker')
                  const hexIn = currentElementEditor.editorEl.querySelector('#elementHexInput')
                  if (picker) picker.value = p.hex
                  if (hexIn) hexIn.value = p.hex.toUpperCase()
                }
              } catch(e){}
              return
            }
            if (confirm(`Застосувати ${p.code} (${p.hex}) до ВСьОГО зображення?`)) {
              applyColorAll(p.hex)
              for (const g of groups) { g.palCode = p.code; for (const n of g.nodes) { n.palCode = p.code; n.paletteHex = p.hex } }
              removeLabelsFromGroups(); addLabelsToGroups({perNode:false})
              updateDetectedColorsUI()
              markPaletteHexUsed(p.hex, true)
            }
          })
        }
        paletteEl.appendChild(sw)
      }
    }

    // --- load SVG ---
    const svgPreviewEl = $('svgPreview')
    const originalPreviewEl = $('originalPreview')
    const previewOverlay = $('previewOverlay')
    const scaleRangeEl = $('scaleRange')
    const scaleValEl = $('scaleVal')
    const threshRangeEl = $('threshRange')
    const threshValEl = $('threshVal')
    const minAreaInput = $('minArea')
    const groupsEl = $('groups')
    const sideCodesEl = $('sideCodes')
    const maxColorsInput = $('maxColors')
    const autoMapCheckbox = $('autoMap')
    const exportBtn = $('exportBtn')
    const revertBtn = $('revertBtn')
    const addCustomColorBtn = $('addCustomColorBtn')
    const addCustomDup = $('addCustomColorBtnDuplicate')

    function applyScale(pct) {
      const s = Math.max(0.01, (parseFloat(pct)||100) / 100)
      try { if (svgRoot) svgRoot.style.transform = `scale(${s})`; if (originalSvgRoot) originalSvgRoot.style.transform = `scale(${s})` } catch(e){}
    }

    // SVG background removal — mirrors Python BackgroundRemover:
    // removes elements whose bounding box intersects >= 3 canvas edge zones.
    // epsilon = 0.25% of avg(width, height), touch_threshold = 3.
    function removeSvgBackground(text) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'image/svg+xml')
      if (doc.querySelector('parsererror')) return text
      const root = doc.documentElement

      const vbAttr = root.getAttribute('viewBox')
      if (!vbAttr) return text
      const parts = vbAttr.trim().split(/[\s,]+/)
      if (parts.length !== 4) return text
      const [minX, minY, vw, vh] = parts.map(Number)
      if (!vw || !vh) return text

      const maxX = minX + vw
      const maxY = minY + vh
      const eps = ((vw + vh) / 2) * 0.0025

      const zones = [
        { x1: minX - eps, y1: minY - eps, x2: maxX + eps, y2: minY + eps },
        { x1: minX - eps, y1: maxY - eps, x2: maxX + eps, y2: maxY + eps },
        { x1: minX - eps, y1: minY - eps, x2: minX + eps, y2: maxY + eps },
        { x1: maxX - eps, y1: minY - eps, x2: maxX + eps, y2: maxY + eps },
      ]

      const hits = (bbox, z) =>
        bbox.x < z.x2 && bbox.x + bbox.width > z.x1 &&
        bbox.y < z.y2 && bbox.y + bbox.height > z.y1

      const container = document.createElement('div')
      container.style.cssText =
        'position:fixed;left:-9999px;top:-9999px;visibility:hidden;' +
        'overflow:hidden;width:' + vw + 'px;height:' + vh + 'px'
      const clone = document.importNode(root, true)
      clone.setAttribute('width', vw)
      clone.setAttribute('height', vh)
      container.appendChild(clone)
      document.body.appendChild(container)

      try {
        const shapes = clone.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')
        const toRemove = []
        for (const el of shapes) {
          try {
            const bbox = el.getBBox()
            if (bbox.width === 0 && bbox.height === 0) { toRemove.push(el); continue }
            if (zones.filter(z => hits(bbox, z)).length >= 3) toRemove.push(el)
          } catch (e) {}
        }
        for (const el of toRemove) el.parentNode?.removeChild(el)
        return new XMLSerializer().serializeToString(clone)
      } finally {
        document.body.removeChild(container)
      }
    }

    function parseAndShow(text) {
      const p = new DOMParser()
      const doc = p.parseFromString(text, 'image/svg+xml')
      if (doc.querySelector('parsererror')) { alert('Помилка парсингу SVG'); return }
      svgPreviewEl.innerHTML = ''
      originalPreviewEl.innerHTML = ''
      const editable = document.importNode(doc.documentElement, true)
      const originalClone = document.importNode(doc.documentElement, true)
      svgPreviewEl.appendChild(editable)
      originalPreviewEl.appendChild(originalClone)
      try { originalClone.style.pointerEvents = 'none'; originalClone.style.opacity = '0.98' } catch(e){}
      svgRoot = editable.tagName?.toLowerCase() === 'svg' ? editable : svgPreviewEl.querySelector('svg')
      originalSvgRoot = originalClone.tagName?.toLowerCase() === 'svg' ? originalClone : originalPreviewEl.querySelector('svg')
      if (svgRoot) { svgRoot.style.width = '100%'; svgRoot.style.height = 'auto' }
      if (originalSvgRoot) { originalSvgRoot.style.width = '100%'; originalSvgRoot.style.height = 'auto' }
      applyScale(parseFloat(scaleRangeEl.value) || 100)
      if (exportBtn) exportBtn.disabled = false
      if (revertBtn) revertBtn.disabled = false
      groups = []; allGroups = []
      removeLabelsFromGroups()
      selectedDetectedHex = null; currentElementEditor = null; previewState = null
      updateDetectedColorsUI()
      attachElementClickHandlers()
      if (autoMapCheckbox?.checked) {
        setTimeout(() => { autoGroup(); setTimeout(() => { mapAndReduceAndLabel() }, 150) }, 60)
      }
    }

    const loadBtn = $('loadBtn')
    const svgInp = $('svgInp')
    const removeBgChk = $('removeBgChk')

    function loadSvgText(text) {
      const shouldRemoveBg = removeBgChk?.checked
      originalText = shouldRemoveBg ? removeSvgBackground(text) : text
      parseAndShow(originalText)
    }

    if (loadBtn && svgInp) {
      loadBtn.addEventListener('click', () => {
        const f = svgInp.files && svgInp.files[0]
        if (!f) { alert('Оберіть файл'); return }

        const isRaster = f.type.startsWith('image/') && !f.type.includes('svg')
        if (isRaster) {
          const statusEl = $('vectorizerStatus')
          if (statusEl) statusEl.style.display = 'block'
          loadBtn.disabled = true
          vectorizeImage(f)
            .then(svg => loadSvgText(svg))
            .catch(err => alert('Помилка векторизації: ' + (err?.message || err)))
            .finally(() => {
              loadBtn.disabled = false
              if (statusEl) statusEl.style.display = 'none'
            })
          return
        }

        const r = new FileReader()
        r.onload = e => loadSvgText(e.target.result)
        r.readAsText(f, 'utf-8')
      })
    }
    if (scaleRangeEl) {
      scaleRangeEl.addEventListener('input', () => {
        const pct = parseFloat(scaleRangeEl.value) || 100
        if (scaleValEl) scaleValEl.textContent = pct + '%'
        applyScale(pct)
      })
    }
    if (threshRangeEl) threshRangeEl.addEventListener('input', () => { if (threshValEl) threshValEl.textContent = threshRangeEl.value })

    const autoGroupBtn = $('autoGroupBtn')
    const mapPaletteBtn = $('mapPaletteBtn')
    const mergeMirroredBtn = $('mergeMirroredBtn')
    const toggleLabelsBtn = $('toggleLabelsBtn')
    if (autoGroupBtn) autoGroupBtn.addEventListener('click', autoGroup)
    if (mapPaletteBtn) mapPaletteBtn.addEventListener('click', () => { if (!groups || groups.length === 0) { alert('Спочатку натисніть "Авто-групування".'); return }; mapAndReduceAndLabel() })
    if (mergeMirroredBtn) mergeMirroredBtn.addEventListener('click', () => { mergeMirroredGroups(); renderGroupsUI() })
    if (toggleLabelsBtn) toggleLabelsBtn.addEventListener('click', () => { labelsVisible = !labelsVisible; if (labelsVisible) addLabelsToGroups({perNode:false}); else removeLabelsFromGroups() })
    if (revertBtn) revertBtn.addEventListener('click', () => { if (originalText) parseAndShow(originalText) })

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (!svgRoot) return
        const prevT = svgRoot.style.transform || ''
        const prevTO = originalSvgRoot ? (originalSvgRoot.style.transform || '') : ''
        try {
          const clone = svgRoot.cloneNode(true)
          clone.style.transform = ''
          try { clone.removeAttribute('transform') } catch(e){}
          clone.querySelectorAll('*').forEach(el => { try { el.removeAttribute('transform') } catch(e){} })
          let svgW = null, svgH = null
          try { const vb = clone.viewBox?.baseVal; if (vb?.width && vb?.height) { svgW = vb.width; svgH = vb.height } } catch(e){}
          if (!svgW || !svgH) { try { const r = svgRoot.getBoundingClientRect(); svgW = r.width || 800; svgH = r.height || 600 } catch(e){ svgW = 800; svgH = 600 } }
          const userScale = Math.max(0.01, (parseFloat(scaleRangeEl?.value) || 100) / 100)
          const exportW = Math.round(svgW * userScale), exportH = Math.round(svgH * userScale)
          clone.setAttribute('width', exportW); clone.setAttribute('height', exportH)
          if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          const blob = new Blob([new XMLSerializer().serializeToString(clone)], {type:'image/svg+xml;charset=utf-8'})
          const url = URL.createObjectURL(blob)
          const img = new Image()
          img.onload = () => {
            try {
              const dpr = window.devicePixelRatio || 1
              const canvas = document.createElement('canvas')
              canvas.width = exportW * dpr; canvas.height = exportH * dpr
              const ctx = canvas.getContext('2d')
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
              ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,exportW,exportH)
              ctx.drawImage(img, 0, 0, exportW, exportH)
              canvas.toBlob(pngBlob => {
                if (!pngBlob) { alert('Експорт не вдався.'); URL.revokeObjectURL(url); return }
                const a = document.createElement('a'); const pngUrl = URL.createObjectURL(pngBlob)
                a.href = pngUrl; a.download = 'edited.png'; document.body.appendChild(a); a.click()
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(pngUrl); URL.revokeObjectURL(url) }, 100)
              }, 'image/png')
            } catch(e){ console.error('Export draw error', e); alert('Не вдалося створити PNG: ' + (e?.message || 'unknown')); URL.revokeObjectURL(url) }
          }
          img.onerror = () => { alert('Не вдалося завантажити SVG для конвертації в PNG.'); URL.revokeObjectURL(url) }
          img.src = url
        } finally {
          svgRoot.style.transform = prevT
          if (originalSvgRoot) originalSvgRoot.style.transform = prevTO
        }
      })
    }

    // --- geometry ---
    function clientRectCenterToSvg(cr) {
      try {
        if (!svgRoot) return null
        const pt = svgRoot.createSVGPoint(); pt.x = cr.left + cr.width/2; pt.y = cr.top + cr.height/2
        const ctm = svgRoot.getScreenCTM(); if (!ctm) return null
        const svgP = pt.matrixTransform(ctm.inverse())
        return {x: svgP.x, y: svgP.y}
      } catch(e){ return null }
    }
    function getElementCenter(el, fallbackGroup) {
      try { const bb = el.getBBox(); if (bb && (bb.width > 0 || bb.height > 0)) return {x:bb.x+bb.width/2,y:bb.y+bb.height/2,bbox:bb} } catch(e){}
      try { const cr = el.getBoundingClientRect(); if (cr && (cr.width > 0 || cr.height > 0)) { const svgP = clientRectCenterToSvg(cr); if (svgP) return {x:svgP.x,y:svgP.y,bbox:null} } } catch(e){}
      try { let p = el.parentNode; while (p && p !== svgRoot) { if (p.getBBox) { const pbb = p.getBBox(); if (pbb && (pbb.width > 0 || pbb.height > 0)) return {x:pbb.x+pbb.width/2,y:pbb.y+pbb.height/2,bbox:pbb} }; p = p.parentNode } } catch(e){}
      if (fallbackGroup?.centroid) return {x:fallbackGroup.centroid.x,y:fallbackGroup.centroid.y,bbox:fallbackGroup.bbox||null}
      return null
    }
    function computeAvgPathLength(g) {
      let sum=0,cnt=0
      for (const n of g.nodes) { try { if (n.el.tagName?.toLowerCase() === 'path' && typeof n.el.getTotalLength === 'function') { sum += n.el.getTotalLength(); cnt++ } } catch(e){} }
      return cnt ? sum/cnt : 0
    }
    function computeGeometry(arr) {
      if (!svgRoot) return
      let svgW=0,svgH=0
      try { const vb = svgRoot.viewBox?.baseVal; if (vb?.width && vb?.height) { svgW = vb.width; svgH = vb.height } } catch(e){}
      if (!svgW || !svgH) { const r = svgRoot.getBoundingClientRect(); svgW = r.width; svgH = r.height }
      const svgArea = Math.max(1, svgW * svgH)
      for (const g of arr) {
        let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,area=0,cxSum=0,cySum=0,cnt=0
        for (const n of g.nodes) {
          try {
            const bb = n.el.getBBox()
            if (bb.width === 0 && bb.height === 0) {
              const cr = n.el.getBoundingClientRect()
              if (cr.width === 0 && cr.height === 0) continue
              const svgPt = clientRectCenterToSvg(cr)
              if (svgPt) { minX=Math.min(minX,svgPt.x-1);minY=Math.min(minY,svgPt.y-1);maxX=Math.max(maxX,svgPt.x+1);maxY=Math.max(maxY,svgPt.y+1);area+=1;cxSum+=svgPt.x;cySum+=svgPt.y;cnt++ }
            } else {
              minX=Math.min(minX,bb.x);minY=Math.min(minY,bb.y);maxX=Math.max(maxX,bb.x+bb.width);maxY=Math.max(maxY,bb.y+bb.height)
              area+=bb.width*bb.height;cxSum+=bb.x+bb.width/2;cySum+=bb.y+bb.height/2;cnt++
            }
          } catch(e){}
        }
        if (cnt === 0) { g.bbox=null;g.centroid=null;g.area=0;g.areaPct=0;g.sig={ar:1,normArea:0,avgLen:0} }
        else {
          g.bbox={x:minX,y:minY,w:Math.max(0,maxX-minX),h:Math.max(0,maxY-minY)}
          g.centroid={x:cxSum/cnt,y:cySum/cnt};g.area=area;g.areaPct=(area/svgArea)*100
          g.sig={ar:g.bbox.w&&g.bbox.h?g.bbox.w/g.bbox.h:1,normArea:g.area/svgArea,avgLen:computeAvgPathLength(g)}
        }
      }
    }

    // --- auto group ---
    function autoGroup() {
      if (!svgRoot) return
      const allEls = Array.from(svgRoot.querySelectorAll('*'))
      const items = []
      for (const el of allEls) {
        if (el.tagName?.toLowerCase() === 'defs') continue
        const fill = el.getAttribute('fill'), stroke = el.getAttribute('stroke')
        const style = el.getAttribute('style') || ''
        let styleFill=null,styleStroke=null
        if (style) { const mF=style.match(/fill\s*:\s*([^;]+)/i);const mS=style.match(/stroke\s*:\s*([^;]+)/i); if(mF)styleFill=mF[1].trim();if(mS)styleStroke=mS[1].trim() }
        const finalFill = fill || styleFill || null, finalStroke = stroke || styleStroke || null
        const isRef = s => s && /^url\(/i.test(s)
        if (finalFill && !isRef(finalFill)) items.push({el,prop:'fill',raw:finalFill})
        if (finalStroke && !isRef(finalStroke)) items.push({el,prop:'stroke',raw:finalStroke})
      }
      const map = new Map()
      for (const it of items) {
        let key = it.raw; const rgb = parseColorString(it.raw); if (rgb) key = rgbToHex(rgb.map(v=>Math.round(v)))
        if (!map.has(key)) map.set(key, {key,nodes:[],rgb:null})
        map.get(key).nodes.push({el:it.el,prop:it.prop,raw:it.raw})
        if (!map.get(key).rgb) { const pr = rgb||parseColorString(it.raw); if (pr) map.get(key).rgb = pr }
      }
      allGroups = []
      for (const v of map.values()) {
        allGroups.push({key:v.key,nodes:v.nodes.slice(),repColor:v.rgb?v.rgb.slice():null,colorValue:v.rgb?rgbToHex(v.rgb.map(vv=>Math.round(vv))):v.key,count:v.nodes.length,bbox:null,centroid:null,area:0,areaPct:0,lab:v.rgb?rgbToLab(v.rgb.map(vv=>Math.round(vv))):null})
      }
      computeGeometry(allGroups)
      allGroups = allGroups.filter(g => (g.area||0) > 0 && g.nodes?.length > 0)
      const minArea = parseFloat(minAreaInput?.value) || 0.15
      const large = allGroups.filter(g => (g.areaPct||0) >= minArea)
      const small = allGroups.filter(g => (g.areaPct||0) < minArea)
      const svgRect = svgRoot.getBoundingClientRect()
      const svgMaxDim = Math.max(svgRect.width||(svgRoot.viewBox?.baseVal?.width)||1, svgRect.height||(svgRoot.viewBox?.baseVal?.height)||1)
      const NEARBY_DIST = svgMaxDim * 0.06, COLOR_MERGE_THRESHOLD = 12
      large.forEach(g => { if (g.repColor) g.lab = rgbToLab(g.repColor.map(v=>Math.round(v))) })
      for (const sg of small) {
        if (!sg.repColor || large.length === 0) continue
        const sgLab = rgbToLab(sg.repColor.map(v=>Math.round(v)))
        let best=-1,bestD=Infinity
        for (let i=0;i<large.length;i++) {
          if (!large[i].lab) continue
          const sgC=sg.centroid||(sg.bbox?{x:sg.bbox.x+sg.bbox.w/2,y:sg.bbox.y+sg.bbox.h/2}:null)
          const lgC=large[i].centroid||(large[i].bbox?{x:large[i].bbox.x+large[i].bbox.w/2,y:large[i].bbox.y+large[i].bbox.h/2}:null)
          let near = false
          if (sgC && lgC) { const dx=Math.abs(sgC.x-lgC.x),dy=Math.abs(sgC.y-lgC.y); if(Math.sqrt(dx*dx+dy*dy)<=NEARBY_DIST)near=true }
          else { try { const sb=sg.bbox,lb=large[i].bbox; if(sb&&lb){const gx=Math.max(0,Math.max(lb.x-(sb.x+sb.w),sb.x-(lb.x+lb.w))),gy=Math.max(0,Math.max(lb.y-(sb.y+sb.h),sb.y-(lb.y+lb.h)));if(Math.sqrt(gx*gx+gy*gy)<=NEARBY_DIST)near=true} } catch(e){} }
          if (!near) continue
          const d = deltaE(sgLab, large[i].lab); if (d < bestD) { bestD=d;best=i }
        }
        if (best >= 0 && bestD <= COLOR_MERGE_THRESHOLD) {
          large[best].nodes = large[best].nodes.concat(sg.nodes); large[best].count += sg.count
          if (large[best].repColor && sg.repColor) {
            const A=large[best].repColor,B=sg.repColor,na=large[best].count-sg.count,nb=sg.count
            large[best].repColor = [(A[0]*na+B[0]*nb)/(na+nb),(A[1]*na+B[1]*nb)/(na+nb),(A[2]*na+B[2]*nb)/(na+nb)]
            large[best].lab = rgbToLab(large[best].repColor.map(v=>Math.round(v)))
            large[best].colorValue = rgbToHex(large[best].repColor.map(v=>Math.round(v)))
          }
        }
      }
      const mergedNodeSet = new Set(); for (const lg of large) for (const n of lg.nodes) mergedNodeSet.add(n)
      const remaining = allGroups.filter(g=>(g.areaPct||0)<minArea).filter(g=>{for(const n of g.nodes)if(!mergedNodeSet.has(n))return true;return false})
      const resultGroups = large.concat(remaining); computeGeometry(resultGroups)
      groups = resultGroups.sort((a,b)=>(b.areaPct||0)-(a.areaPct||0))
      removeLabelsFromGroups(); renderGroupsUI(); updateDetectedColorsUI()
    }

    // --- hierarchical reduce ---
    function reduceGroupsHierarchical(initialGroups, targetK, options = {}) {
      const protectedCount = options.protectedCount ?? 6
      const penaltyFactor = options.penaltyFactor ?? 6.0
      const spatialWeight = options.spatialWeight ?? 25.0
      const clusters = initialGroups.map((g,idx) => ({
        id:idx,nodes:g.nodes.slice(),area:g.area||0,
        lab:g.lab?g.lab.slice():(g.repColor?rgbToLab(g.repColor.map(v=>Math.round(v))):rgbToLab([0,0,0])),
        centroid:g.centroid||null,count:g.count||g.nodes.length
      }))
      if (clusters.length <= targetK) return clusters
      const totalArea = Math.max(1, clusters.reduce((s,c)=>s+c.area,0))
      let svgDiag = 1
      try { const vb=svgRoot?.viewBox?.baseVal; if(vb?.width&&vb?.height)svgDiag=Math.sqrt(vb.width**2+vb.height**2); else{const r=svgRoot.getBoundingClientRect();svgDiag=Math.sqrt(r.width**2+r.height**2)} if(!isFinite(svgDiag)||svgDiag<=0)svgDiag=1 } catch(e){svgDiag=1}
      const sortedIdx = clusters.map((c,i)=>({i,area:c.area})).sort((a,b)=>b.area-a.area).map(x=>x.i)
      const protectedSet = new Set(sortedIdx.slice(0,protectedCount))
      while (clusters.length > targetK) {
        let bestScore=Infinity,bestPair=null
        for (let i=0;i<clusters.length;i++) for (let j=i+1;j<clusters.length;j++) {
          const A=clusters[i],B=clusters[j]
          if (protectedSet.has(A.id) && protectedSet.has(B.id)) continue
          const d=deltaE(A.lab,B.lab),minArea=Math.min(A.area,B.area)
          let sn=0; if(A.centroid&&B.centroid){const dx=A.centroid.x-B.centroid.x,dy=A.centroid.y-B.centroid.y;sn=Math.sqrt(dx*dx+dy*dy)/svgDiag}else sn=0.5
          const score=d*(1+penaltyFactor*(minArea/totalArea))+spatialWeight*sn
          if(score<bestScore){bestScore=score;bestPair=[A,B]}
        }
        if (!bestPair) break
        const [A,B]=bestPair,newArea=A.area+B.area
        const newLab=[(A.lab[0]*A.area+B.lab[0]*B.area)/Math.max(1,newArea),(A.lab[1]*A.area+B.lab[1]*B.area)/Math.max(1,newArea),(A.lab[2]*A.area+B.lab[2]*B.area)/Math.max(1,newArea)]
        let newCentroid=null
        if(A.centroid&&B.centroid)newCentroid={x:(A.centroid.x*A.area+B.centroid.x*B.area)/Math.max(1,newArea),y:(A.centroid.y*A.area+B.centroid.y*B.area)/Math.max(1,newArea)}
        else if(A.centroid)newCentroid=A.centroid; else if(B.centroid)newCentroid=B.centroid
        const newCluster={id:Math.min(A.id,B.id),nodes:A.nodes.concat(B.nodes),area:newArea,lab:newLab,centroid:newCentroid,count:A.count+B.count}
        const idxA=clusters.findIndex(c=>c===A),idxB=clusters.findIndex(c=>c===B)
        ;[idxA,idxB].sort((a,b)=>b-a).forEach(ai=>clusters.splice(ai,1))
        clusters.push(newCluster)
        const sortedByArea=clusters.map((c,i)=>({i,id:c.id,area:c.area})).sort((a,b)=>b.area-a.area)
        protectedSet.clear(); for(let k=0;k<Math.min(protectedCount,sortedByArea.length);k++)protectedSet.add(sortedByArea[k].id)
      }
      return clusters
    }

    function mapClustersToPalette(clusters) {
      return clusters.map(c => {
        let bestIdx=0,bestD=Infinity
        for (let pi=0;pi<PALETTE_LABS.length;pi++) { const d=deltaE(c.lab,PALETTE_LABS[pi]); if(d<bestD){bestD=d;bestIdx=pi} }
        return {cluster:c,paletteIndex:bestIdx,palette:PALETTE[bestIdx]}
      })
    }

    function applyMappedClusters(mapped) {
      for (const m of mapped) {
        const hex = m.palette.hex
        for (const n of m.cluster.nodes) {
          try {
            if (n.prop === 'fill') {
              n.el.setAttribute('fill', hex)
              const s = n.el.getAttribute('style') || ''
              n.el.setAttribute('style', (s.replace(/fill\s*:\s*[^;]+;?/ig,'')+';fill:'+hex+';').replace(/^;+/,''))
            } else if (n.prop === 'stroke') {
              if (shouldConvertStrokeToFill(n.el)) {
                n.el.setAttribute('fill', hex); n.el.removeAttribute('stroke')
                const s = n.el.getAttribute('style') || ''
                n.el.setAttribute('style', (s.replace(/stroke\s*:\s*[^;]+;?/ig,'').replace(/stroke-width\s*:\s*[^;]+;?/ig,'').replace(/fill\s*:\s*[^;]+;?/ig,'')+';fill:'+hex+';').replace(/^;+/,''))
              } else {
                n.el.setAttribute('stroke', hex)
                const s = n.el.getAttribute('style') || ''
                n.el.setAttribute('style', (s.replace(/stroke\s*:\s*[^;]+;?/ig,'')+';stroke:'+hex+';').replace(/^;+/,''))
              }
            }
          } catch(e){}
          try { n.palCode = m.palette.code; n.paletteHex = m.palette.hex } catch(e){}
        }
        m.cluster.palCode = m.palette.code; m.cluster.colorValue = m.palette.hex
      }
      updateDetectedColorsUI()
    }

    function applyManualColorToElements(elems, hex, options = {}) {
      for (const el of elems) { try { setElementColor(el, hex, options) } catch(e){} }
    }
    function applyManualColorToHighlighted(newHex) {
      const elems = getHighlightedElements()
      if (elems.length === 0) { if (selectedDetectedHex && detectedColorsMap.has(selectedDetectedHex)) applyManualColorToElements(Array.from(detectedColorsMap.get(selectedDetectedHex).nodes), newHex, {skipSync:false}) }
      else applyManualColorToElements(elems, newHex, {skipSync:false})
      updateDetectedColorsUI(); addLabelsToGroups({perNode:false})
    }
    function applyManualColorToAll(origHex, newHex) {
      if (!origHex) return
      if (detectedColorsMap.has(origHex)) { applyManualColorToElements(Array.from(detectedColorsMap.get(origHex).nodes), newHex, {skipSync:false}); updateDetectedColorsUI(); addLabelsToGroups({perNode:false}) }
    }

    function buildPerElementInitGroups(sourceGroups) {
      const units = []
      for (const g of sourceGroups) {
        for (const n of g.nodes) {
          let repRgb = null
          if (n.raw) repRgb = parseColorString(n.raw)
          if (!repRgb) { try { const cs=getComputedStyle(n.el); if(cs?.fill&&cs.fill!=='none'&&cs.fill!=='transparent'){repRgb=parseColorString(cs.fill)||null}else if(cs?.stroke&&cs.stroke!=='none'&&cs.stroke!=='transparent'){repRgb=parseColorString(cs.stroke)||null} } catch(e){} }
          const hex = repRgb ? rgbToHex(repRgb.map(v=>Math.round(v))) : (n.paletteHex||g.colorValue||'#FFFFFF')
          let area = 1; try { const bb=n.el.getBBox();area=Math.max(1,bb.width*bb.height) } catch(e){}
          units.push({key:hex+'_'+units.length,nodes:[n],repColor:repRgb?repRgb.slice():null,colorValue:hex,count:1,bbox:null,centroid:null,area,areaPct:0,lab:repRgb?rgbToLab(repRgb.map(v=>Math.round(v))):rgbToLab([0,0,0])})
        }
      }
      computeGeometry(units); return units
    }

    function mapAndReduceAndLabel() {
      const maxColors = Math.max(1, parseInt(maxColorsInput?.value,10) || 12)
      const sourceGroups = (allGroups?.length > 0) ? allGroups : groups
      if (!sourceGroups || sourceGroups.length === 0) return
      const smallCount = sourceGroups.filter(g=>(g.areaPct||0)<(parseFloat(minAreaInput?.value)||0.15)).length
      const forceGroupMapping = (allGroups?.length > 0)
      const mapPerElement = !forceGroupMapping && (smallCount > Math.max(3, Math.floor(sourceGroups.length*0.25)))
      let initGroups
      if (mapPerElement) { initGroups = buildPerElementInitGroups(sourceGroups) }
      else { initGroups = sourceGroups.map((g,idx)=>({idx,nodes:g.nodes.slice(),area:g.area||0,lab:g.lab?g.lab.slice():(g.repColor?rgbToLab(g.repColor.map(v=>Math.round(v))):rgbToLab([0,0,0])),repColor:g.repColor||null,colorValue:g.colorValue||(g.repColor?rgbToHex(g.repColor.map(v=>Math.round(v))):g.key),centroid:g.centroid||null})) }
      if (initGroups.length === 0) return
      const clusters = reduceGroupsHierarchical(initGroups, Math.min(maxColors,initGroups.length), {protectedCount:mapPerElement?0:6,penaltyFactor:6,spatialWeight:25})
      const mapped = mapClustersToPalette(clusters)
      applyMappedClusters(mapped)
      try { applyColorToHighlightedSelection() } catch(e){}
      const paletteMap = new Map()
      for (const m of mapped) {
        const key = m.palette.hex
        if (!paletteMap.has(key)) paletteMap.set(key, {palCode:m.palette.code,colorValue:m.palette.hex,nodes:[]})
        for (const n of m.cluster.nodes) paletteMap.get(key).nodes.push(n)
      }
      const paletteGroups = []
      for (const [hex, entry] of paletteMap.entries()) paletteGroups.push({key:'palette_'+entry.palCode,nodes:entry.nodes.slice(),repColor:null,colorValue:entry.colorValue,palCode:entry.palCode,area:0,bbox:null,centroid:null,areaPct:0,lab:null})
      computeGeometry(paletteGroups)
      groups = paletteGroups.sort((a,b)=>(b.areaPct||0)-(a.areaPct||0))
      removeLabelsFromGroups(); addLabelsToGroups({perNode:false}); renderGroupsUI(); updateDetectedColorsUI()
    }

    function applyColorToHighlightedSelection() {
      const elems = getHighlightedElements(); if (!elems.length) return
      const ef = getElementEffectiveColor(elems[0]); if (!ef) return
      const hex = rgbToHex(ef)
      for (const el of elems) setElementColor(el, hex, {skipSync:false})
    }

    function mergeMirroredGroups() {
      if (!svgRoot || !groups || groups.length < 2) return
      let svgW = 0
      try { const vb=svgRoot.viewBox?.baseVal; if(vb?.width)svgW=vb.width } catch(e){}
      if (!svgW) svgW = svgRoot.getBoundingClientRect().width || 1
      const used=new Set(),merged=[]
      for (let i=0;i<groups.length;i++) {
        if (used.has(i)) continue
        const A=groups[i]; used.add(i)
        if (!A.centroid) { merged.push(A); continue }
        const mirrorX=svgW-A.centroid.x
        const A_lab=A.lab?A.lab:(A.repColor?rgbToLab(A.repColor.map(v=>Math.round(v))):null)
        let foundIdx=-1,bestScore=Infinity
        for (let j=i+1;j<groups.length;j++) {
          if (used.has(j)) continue
          const B=groups[j]; if(!B.centroid)continue
          const dx=Math.abs(B.centroid.x-mirrorX),dy=Math.abs(B.centroid.y-A.centroid.y)
          const diag=Math.sqrt(svgW**2+(svgRoot.getBoundingClientRect().height||svgW)**2)||svgW
          let colorD=1000; if(A_lab&&B.lab)colorD=deltaE(A_lab,B.lab)
          const arDiff=Math.abs((A.sig?.ar||1)-(B.sig?.ar||1)),lenDiff=Math.abs((A.sig?.avgLen||0)-(B.sig?.avgLen||0))
          const score=colorD*0.55+(Math.sqrt(dx*dx+dy*dy)/diag*100)*0.30+(arDiff*10+lenDiff*0.01)*0.15
          if(score<bestScore){bestScore=score;foundIdx=j}
        }
        if (foundIdx >= 0 && bestScore < 22) {
          const B=groups[foundIdx]; A.nodes=A.nodes.concat(B.nodes); A.count+=B.count
          if(A.repColor&&B.repColor){const Ac=A.count-B.count,Bc=B.count;A.repColor=[(A.repColor[0]*Ac+B.repColor[0]*Bc)/(Ac+Bc),(A.repColor[1]*Ac+B.repColor[1]*Bc)/(Ac+Bc),(A.repColor[2]*Ac+B.repColor[2]*Bc)/(Ac+Bc)];A.colorValue=rgbToHex(A.repColor.map(v=>Math.round(v)));A.lab=rgbToLab(A.repColor.map(v=>Math.round(v)))}
          computeGeometry([A]); used.add(foundIdx)
        }
        merged.push(A)
      }
      groups = merged.sort((a,b)=>(b.areaPct||0)-(a.areaPct||0))
      removeLabelsFromGroups(); addLabelsToGroups({perNode:false}); renderGroupsUI(); updateDetectedColorsUI()
    }

    function removeLabelsFromGroups() {
      if (svgRoot) { const e=svgRoot.querySelector('#palette_labels_group'); if(e)e.remove() }
      if (sideCodesEl) sideCodesEl.innerHTML = ''
    }

    function getHighlightedElements() {
      if (!svgRoot) return []
      try { return Array.from(svgRoot.querySelectorAll('.highlight-elm')) } catch(e){ return [] }
    }

    // --- side badges ---
    function renderSideBadgesFromPosMap(posMap) {
      if (!sideCodesEl) return
      sideCodesEl.innerHTML = ''
      const arr = Array.from(posMap.values()).map(en=>({...en,y:en.y||0})).sort((a,b)=>a.y-b.y)
      for (const entry of arr) {
        const codes=Array.from(entry.codes).sort(),text=codes.join('/')
        let colorHex='#fff',bestCnt=-1
        for (const [col,cnt] of entry.colorCounts.entries()) { if(cnt>bestCnt){bestCnt=cnt;colorHex=col} }
        const badge=document.createElement('div'); badge.className='side-badge generated'; badge.setAttribute('data-hex',(colorHex||'').toUpperCase())
        badge.innerHTML=`<div class="sw" style="background:${colorHex}"></div><div class="code-text">${text}</div><div class="count">${entry.count||' '}</div>`
        const del=document.createElement('div'); del.className='del-btn'; del.title='Видалити елементи'; del.textContent='×'
        del.style.cssText='position:absolute;right:6px;top:4px'
        del.addEventListener('click', ev => {
          ev.stopPropagation()
          const hex=(colorHex||'').toUpperCase(); if(!hex)return
          if(!confirm(`Видалити всі елементи з кольором ${hex}?`))return
          const removedCount=removeElementsByHex(hex)
          if(removedCount>0){updateDetectedColorsUI();removeLabelsFromGroups();addLabelsToGroups({perNode:false});renderGroupsUI()}
          else alert('Елементів не знайдено.')
        })
        badge.appendChild(del)
        badge.addEventListener('click', ev => {
          ev.stopPropagation()
          if(confirm(`Застосувати ${text} (${colorHex}) до ВСьОГО зображення?`)){
            applyColorAll(colorHex)
            for(const g of groups){const p=findPaletteByHex(colorHex);if(p)g.palCode=p.code;else g.palCode=colorHex.toUpperCase();for(const n of g.nodes){n.paletteHex=colorHex;const p2=findPaletteByHex(colorHex);n.palCode=p2?p2.code:colorHex.toUpperCase()}}
            removeLabelsFromGroups();addLabelsToGroups({perNode:false});renderGroupsUI();updateDetectedColorsUI()
            if(findPaletteByHex(colorHex))markPaletteHexUsed(colorHex,true)
            if(customColors.some(c=>c.hex.toUpperCase()===colorHex.toUpperCase()))removeCustomColor(colorHex)
          }
        })
        sideCodesEl.appendChild(badge)
      }
      renderCustomBadges()
    }

    function renderCustomBadges() {
      if (!sideCodesEl || !customColors?.length) return
      for (const c of customColors) {
        const exists=Array.from(sideCodesEl.querySelectorAll('.side-badge.custom')).some(b=>b.getAttribute('data-hex')?.toUpperCase()===c.hex.toUpperCase())
        if (exists) continue
        const badge=document.createElement('div'); badge.className='side-badge custom'; badge.setAttribute('data-hex',c.hex.toUpperCase())
        const labelText=c.code?c.code:c.hex.toUpperCase()
        badge.innerHTML=`<div class="sw" style="background:${c.hex}"></div><div class="code-text">${labelText}</div><div class="count">-</div>`
        const del=document.createElement('div'); del.className='del-btn'; del.title='Видалити'; del.textContent='×'
        del.addEventListener('click', ev=>{ ev.stopPropagation(); if(confirm(`Видалити ${labelText}?`))removeCustomColor(c.hex) })
        badge.appendChild(del)
        badge.addEventListener('click', ev=>{
          ev.stopPropagation()
          if(confirm(`Застосувати ${labelText} (${c.hex}) до ВСьОГО?`)){
            applyColorAll(c.hex)
            for(const g of groups){const p=findPaletteByHex(c.hex);g.palCode=p?p.code:(c.code?c.code:c.hex.toUpperCase());for(const n of g.nodes){n.paletteHex=c.hex;const p2=findPaletteByHex(c.hex);n.palCode=p2?p2.code:(c.code?c.code:c.hex.toUpperCase())}}
            removeLabelsFromGroups();addLabelsToGroups({perNode:false});renderGroupsUI();updateDetectedColorsUI();removeCustomColor(c.hex)
            if(findPaletteByHex(c.hex))markPaletteHexUsed(c.hex,true)
          }
        })
        sideCodesEl.appendChild(badge)
      }
    }

    function addLabelsToGroups(options = {}) {
      const perNode = !!options.perNode
      removeLabelsFromGroups()
      if (!svgRoot || !groups) return
      const posMap=new Map(),rf=4
      if (perNode) {
        for (const g of groups) for (const n of g.nodes) {
          const code=n.palCode||g.palCode||(n.paletteHex?(findPaletteByHex(n.paletteHex)?.code||n.paletteHex):null)||(g.colorValue?g.colorValue:g.key)
          const colorHex=n.paletteHex||g.colorValue||'#FFFFFF'
          try {
            const center=getElementCenter(n.el,g); if(!center)continue
            const cx=Math.round(center.x/rf)*rf,cy=Math.round(center.y/rf)*rf,k=`${cx}_${cy}`
            if(!posMap.has(k))posMap.set(k,{x:center.x,y:center.y,codes:new Set(),colorCounts:new Map(),count:0})
            const entry=posMap.get(k); if(code)entry.codes.add(String(code)); entry.colorCounts.set(colorHex,(entry.colorCounts.get(colorHex)||0)+1); entry.count++
          } catch(e){}
        }
      } else {
        for (const g of groups) {
          const code=g.palCode||(g.colorValue?(findPaletteByHex(g.colorValue)?.code||g.colorValue):g.key)
          const colorHex=g.colorValue||'#FFFFFF'
          try {
            const cxR=(g.centroid?.x)||(g.bbox?g.bbox.x+g.bbox.w/2:0),cyR=(g.centroid?.y)||(g.bbox?g.bbox.y+g.bbox.h/2:0)
            const cx=Math.round(cxR/rf)*rf,cy=Math.round(cyR/rf)*rf,k=`${cx}_${cy}`
            if(!posMap.has(k))posMap.set(k,{x:cxR,y:cyR,codes:new Set(),colorCounts:new Map(),count:(g.count||1)})
            const entry=posMap.get(k); if(code)entry.codes.add(String(code)); entry.colorCounts.set(colorHex,(entry.colorCounts.get(colorHex)||0)+1)
          } catch(e){}
        }
      }
      renderSideBadgesFromPosMap(posMap)
    }

    // --- groups UI ---
    function renderGroupsUI() {
      if (!groupsEl) return
      groupsEl.innerHTML = ''
      if (!groups || groups.length === 0) { const n=document.createElement('div'); n.className='pe-muted-small'; n.textContent='Груп не знайдено.'; groupsEl.appendChild(n); return }
      groups.forEach((g,idx) => {
        const row=document.createElement('div'); row.className='group-item'
        const sw=document.createElement('div'); sw.className='sw'; sw.style.background=g.colorValue||'#999'
        const label=document.createElement('div'); label.style.flex='1'
        const title=g.palCode?(g.palCode):(findPaletteByHex(g.colorValue||'')?findPaletteByHex(g.colorValue||'').code:(g.colorValue||g.key))
        label.innerHTML=`<div style="font-size:13px">${title}</div><div class="pe-muted-small">${g.nodes.length} ел. — ${g.areaPct?g.areaPct.toFixed(2)+'%':'н/д'}</div>`
        const colorIn=document.createElement('input'); colorIn.type='color'
        try{colorIn.value=(g.colorValue&&g.colorValue[0]==='#')?g.colorValue:'#999999'}catch(e){colorIn.value='#999999'}
        const applyBtn=document.createElement('button'); applyBtn.textContent='Застосувати'
        const mapBtn=document.createElement('button'); mapBtn.textContent='Замапити'
        sw.addEventListener('click', ()=>toggleHighlightGroup(idx))
        sw.addEventListener('mouseenter', ()=>highlightGroup(idx,true))
        sw.addEventListener('mouseleave', ()=>highlightGroup(idx,false))
        colorIn.addEventListener('input', ()=>{applyColorToVisibleGroup(idx,colorIn.value);g.colorValue=colorIn.value;sw.style.background=colorIn.value;const p=findPaletteByHex(colorIn.value);g.palCode=p?p.code:colorIn.value.toUpperCase();removeLabelsFromGroups();addLabelsToGroups({perNode:false});updateDetectedColorsUI()})
        applyBtn.addEventListener('click', ()=>{applyColorToVisibleGroup(idx,colorIn.value);g.colorValue=colorIn.value;sw.style.background=colorIn.value;const p=findPaletteByHex(colorIn.value);g.palCode=p?p.code:colorIn.value.toUpperCase();removeLabelsFromGroups();addLabelsToGroups({perNode:false});updateDetectedColorsUI()})
        mapBtn.addEventListener('click', ()=>mapVisibleGroupToPalette(idx))
        row.appendChild(sw);row.appendChild(label);row.appendChild(colorIn);row.appendChild(applyBtn);row.appendChild(mapBtn)
        groupsEl.appendChild(row)
      })
    }

    function toggleHighlightGroup(idx) {
      const g=groups[idx]; if(!g)return
      const any=g.nodes.some(n=>{try{return n.el?.classList?.contains('highlight-elm')}catch(e){return false}})
      for(const n of g.nodes){try{any?n.el.classList.remove('highlight-elm'):n.el.classList.add('highlight-elm')}catch(e){}}
    }
    function highlightGroup(idx,on) {
      const g=groups[idx]; if(!g)return
      for(const n of g.nodes){try{if(on)n.el.classList.add('highlight-elm');else if(!n.el.classList.contains('keep-highlight'))n.el.classList.remove('highlight-elm')}catch(e){}}
    }

    // --- detected colors ---
    function detectColorsInSvg() {
      detectedColorsMap.clear()
      if (!svgRoot) return detectedColorsMap
      for (const el of Array.from(svgRoot.querySelectorAll('*'))) {
        try {
          if (el.tagName?.toLowerCase() === 'defs') continue
          const attrs=[]
          const aF=el.getAttribute&&el.getAttribute('fill'); if(aF)attrs.push(aF)
          const aS=el.getAttribute&&el.getAttribute('stroke'); if(aS)attrs.push(aS)
          const style=el.getAttribute&&el.getAttribute('style'); if(style){const mF=style.match(/fill\s*:\s*([^;]+)/i);const mS=style.match(/stroke\s*:\s*([^;]+)/i);if(mF)attrs.push(mF[1].trim());if(mS)attrs.push(mS[1].trim())}
          try{const cs=getComputedStyle(el);if(cs){if(cs.fill)attrs.push(cs.fill);if(cs.stroke)attrs.push(cs.stroke)}}catch(e){}
          for(const raw of attrs){const rgb=parseColorString(raw);if(!rgb)continue;const hex=rgbToHex(rgb.map(v=>Math.round(v)));if(!detectedColorsMap.has(hex))detectedColorsMap.set(hex,{hex,count:0,nodes:new Set()});const e2=detectedColorsMap.get(hex);e2.count++;e2.nodes.add(el)}
        } catch(e){}
      }
      return detectedColorsMap
    }

    const detectedColorsEl = $('detectedColors')
    const detectedEditorEl = $('detectedEditor')
    function renderDetectedColorsUI() {
      if (!detectedColorsEl) return
      detectedColorsEl.innerHTML = ''
      // (side-detected is display:none, this is just for internal state tracking)
    }
    function updateDetectedColorsUI() {
      detectColorsInSvg()
      for(const h of Array.from(highlightedColors)){if(!detectedColorsMap.has(h))highlightedColors.delete(h)}
      if(selectedDetectedHex&&!detectedColorsMap.has(selectedDetectedHex))selectedDetectedHex=null
      renderDetectedColorsUI()
    }

    // --- element editor ---
    function attachElementClickHandlers() {
      if (!svgPreviewEl) return
      svgPreviewEl.removeEventListener('click', onSvgPreviewClick)
      svgPreviewEl.addEventListener('click', onSvgPreviewClick)
    }
    function onSvgPreviewClick(ev) {
      try {
        if (!svgRoot) return
        let el=ev.target
        if(el.closest&&el.closest('.element-editor'))return
        while(el&&el!==svgRoot&&el.nodeType===1){
          const tn=(el.tagName||'').toLowerCase()
          if(['defs','style','title','desc','metadata'].includes(tn)){el=null;break}
          if(el===svgRoot){el=null;break}
          if(['g','path','rect','circle','ellipse','line','polyline','polygon','use','text','image'].includes(tn))break
          el=el.parentNode
        }
        if(!el||el===svgRoot)return
        ev.stopPropagation();ev.preventDefault()
        showElementEditor(el,ev)
      } catch(e){}
    }

    function getElementEffectiveColor(el) {
      try {
        const af=el.getAttribute&&el.getAttribute('fill'),as=el.getAttribute&&el.getAttribute('stroke')
        const style=el.getAttribute&&el.getAttribute('style');let sf=null,ss=null
        if(style){const mF=style.match(/fill\s*:\s*([^;]+)/i);const mS=style.match(/stroke\s*:\s*([^;]+)/i);if(mF)sf=mF[1].trim();if(mS)ss=mS[1].trim()}
        for(const c of [af,sf,as,ss].filter(Boolean)){const rgb=parseColorString(c);if(rgb)return rgb.map(v=>Math.round(v))}
        try{const cs=getComputedStyle(el);if(cs){const cf=parseColorString(cs.fill);if(cf)return cf.map(v=>Math.round(v));const cs2=parseColorString(cs.stroke);if(cs2)return cs2.map(v=>Math.round(v))}}catch(e){}
      } catch(e){}
      return null
    }

    function showElementEditor(el, ev) {
      hideElementEditor()
      const rgb=getElementEffectiveColor(el)
      const origHex=rgb?rgbToHex(rgb):'#FFFFFF'
      currentElementEditor={el,origHex,editorEl:null,positionedAt:{x:ev.clientX,y:ev.clientY}}
      try{el.classList.add('highlight-elm')}catch(e){}
      const editor=document.createElement('div'); editor.className='element-editor'
      editor.style.left=(ev.clientX+8)+'px'; editor.style.top=(ev.clientY+8)+'px'
      editor.innerHTML=`<input type="color" id="elementColorPicker" value="${origHex}"><input id="elementHexInput" class="hex-in" value="${origHex}"><button id="applyToSimilarBtn">Apply to similar</button><button id="closeElementEditorBtn">Close</button>`
      document.body.appendChild(editor)
      currentElementEditor.editorEl = editor
      const picker=editor.querySelector('#elementColorPicker'),hexIn=editor.querySelector('#elementHexInput')
      const applyBtn=editor.querySelector('#applyToSimilarBtn'),closeBtn=editor.querySelector('#closeElementEditorBtn')
      picker.addEventListener('input',()=>{const h=picker.value.toUpperCase();hexIn.value=h;setElementColor(el,h,{skipSync:false});updateDetectedColorsUI()})
      hexIn.addEventListener('input',()=>{const v=hexIn.value.trim();if(/^#?[0-9a-fA-F]{6}$/.test(v)){const val=v[0]==='#'?v.toUpperCase():('#'+v.toUpperCase());picker.value=val;setElementColor(el,val,{skipSync:false});updateDetectedColorsUI()}})
      applyBtn.addEventListener('click',()=>{applyColorToSimilarElements(el,picker.value.toUpperCase());updateDetectedColorsUI();hideElementEditor()})
      closeBtn.addEventListener('click',()=>hideElementEditor())
      const onDocClick=(e)=>{if(!editor.contains(e.target)){hideElementEditor();document.removeEventListener('click',onDocClick)}}
      setTimeout(()=>document.addEventListener('click',onDocClick),10)
    }

    function hideElementEditor() {
      try{if(currentElementEditor){try{if(currentElementEditor.el)currentElementEditor.el.classList.remove('highlight-elm')}catch(e){};if(currentElementEditor.editorEl&&currentElementEditor.editorEl.parentNode)currentElementEditor.editorEl.parentNode.removeChild(currentElementEditor.editorEl)}}catch(e){}
      currentElementEditor=null
    }

    function applyColorToSimilarElements(el, hex) {
      const origHex=currentElementEditor?.origHex||null
      if(origHex&&detectedColorsMap.has(origHex)){applyManualColorToElements(Array.from(detectedColorsMap.get(origHex).nodes),hex,{skipSync:false});return}
      const eff=getElementEffectiveColor(el)
      if(!eff){applyManualColorToElements([el],hex,{skipSync:false});return}
      const matchHex=rgbToHex(eff)
      if(detectedColorsMap.has(matchHex))applyManualColorToElements(Array.from(detectedColorsMap.get(matchHex).nodes),hex,{skipSync:false})
      else applyManualColorToElements([el],hex,{skipSync:false})
    }

    function applyColorToVisibleGroup(idx, hex, updateGroupValue=true) {
      const g=groups[idx]; if(!g)return
      for(const n of g.nodes){
        try{
          if(n.prop==='fill'){n.el.setAttribute('fill',hex);const s=n.el.getAttribute('style')||'';n.el.setAttribute('style',(s.replace(/fill\s*:\s*[^;]+;?/ig,'')+';fill:'+hex+';').replace(/^;+/,''))}
          else if(n.prop==='stroke'){if(shouldConvertStrokeToFill(n.el)){n.el.setAttribute('fill',hex);n.el.removeAttribute('stroke');const s=n.el.getAttribute('style')||'';n.el.setAttribute('style',(s.replace(/stroke\s*:\s*[^;]+;?/ig,'').replace(/stroke-width\s*:\s*[^;]+;?/ig,'').replace(/fill\s*:\s*[^;]+;?/ig,'')+';fill:'+hex+';').replace(/^;+/,''))}else{n.el.setAttribute('stroke',hex);const s=n.el.getAttribute('style')||'';n.el.setAttribute('style',(s.replace(/stroke\s*:\s*[^;]+;?/ig,'')+';stroke:'+hex+';').replace(/^;+/,''))}}
          n.paletteHex=hex;const p=findPaletteByHex(hex);n.palCode=p?p.code:hex.toUpperCase();try{n.el.paletteHex=hex}catch(e){}
        }catch(e){}
      }
      if(updateGroupValue){g.colorValue=hex;const p=findPaletteByHex(hex);g.palCode=p?p.code:hex.toUpperCase()}
      updateDetectedColorsUI();addLabelsToGroups({perNode:false})
    }

    function mapVisibleGroupToPalette(idx) {
      const g=groups[idx]; if(!g)return
      let rep=g.repColor; if(!rep)for(const n of g.nodes){const rgb=parseColorString(n.raw);if(rgb){rep=rgb;break}}
      if(!rep)return
      const lab=rgbToLab(rep.map(v=>Math.round(v)))
      let best=null,bestD=Infinity
      for(let i=0;i<PALETTE_LABS.length;i++){const d=deltaE(lab,PALETTE_LABS[i]);if(d<bestD){bestD=d;best=PALETTE[i]}}
      if(best){applyColorToVisibleGroup(idx,best.hex);groups[idx].colorValue=best.hex;groups[idx].palCode=best.code;for(const n of groups[idx].nodes){n.palCode=best.code;n.paletteHex=best.hex};removeLabelsFromGroups();addLabelsToGroups({perNode:false});renderGroupsUI();updateDetectedColorsUI()}
    }

    function applyColorAll(hex) {
      for(let i=0;i<groups.length;i++)applyColorToVisibleGroup(i,hex)
      renderGroupsUI();removeLabelsFromGroups();addLabelsToGroups({perNode:false});updateDetectedColorsUI()
      if(findPaletteByHex(hex))markPaletteHexUsed(hex,true)
      if(customColors.some(c=>c.hex.toUpperCase()===hex.toUpperCase()))removeCustomColor(hex)
    }

    function removeElementsByHex(hex) {
      if(!hex||!svgRoot)return 0
      let removed=0
      const isMatch=(h)=>h&&parseColorString(h)&&rgbToHex(parseColorString(h).map(v=>Math.round(v))).toUpperCase()===hex.toUpperCase()
      for(const el of Array.from(svgRoot.querySelectorAll('*'))){
        try{
          if(el.tagName?.toLowerCase()==='defs')continue
          const af=el.getAttribute('fill'),as=el.getAttribute('stroke'),style=el.getAttribute('style')||''
          let found=isMatch(af)||isMatch(as)
          if(!found&&style){const mF=style.match(/fill\s*:\s*([^;]+)/i);const mS=style.match(/stroke\s*:\s*([^;]+)/i);if(mF)found=isMatch(mF[1]);if(!found&&mS)found=isMatch(mS[1])}
          if(!found){try{const cs=getComputedStyle(el);if(cs){if(isMatch(cs.fill))found=true;else if(isMatch(cs.stroke))found=true}}catch(e){}}
          if(found&&el.parentNode){el.parentNode.removeChild(el);removed++}
        }catch(e){}
      }
      try{
        function filterGroups(arr){for(const g of arr){if(g.nodes?.length)g.nodes=g.nodes.filter(n=>n&&n.el&&n.el.isConnected)}}
        filterGroups(groups);filterGroups(allGroups)
        groups=groups.filter(g=>g.nodes?.length>0);allGroups=allGroups.filter(g=>g.nodes?.length>0)
        computeGeometry(groups);computeGeometry(allGroups)
      }catch(e){}
      return removed
    }

    // --- add custom color dialog ---
    function showAddCustomColorDialog() {
      if (previewOverlay?.querySelector('.side-add-dialog')) return
      const paletteList=PALETTE.slice().sort((a,b)=>parseInt(a.code,10)-parseInt(b.code,10))
      const dialog=document.createElement('div'); dialog.className='side-add-dialog'
      const select=document.createElement('select'); select.id='customColorSelect'; select.style.cssText='padding:6px;border:1px solid #ddd;border-radius:4px;background:#fff;font-family:monospace;min-width:190px'
      for(const p of paletteList){const opt=document.createElement('option');opt.value=p.hex.toUpperCase();opt.textContent=`${p.code} — ${p.hex.toUpperCase()}`;select.appendChild(opt)}
      const swatch=document.createElement('div'); swatch.style.cssText='width:36px;height:28px;border:1px solid #ccc;display:inline-block;vertical-align:middle;margin-left:6px;border-radius:3px'
      const hexInput=document.createElement('input'); hexInput.className='hex-in'; hexInput.style.marginLeft='6px'; hexInput.value=select.options.length?select.options[0].value:'#FF0000'
      const codeInput=document.createElement('input'); codeInput.className='hex-in'; codeInput.placeholder='code (опційно)'; codeInput.style.cssText='width:120px;margin-left:6px'
      const addBtn=document.createElement('button'); addBtn.textContent='Додати'; addBtn.style.marginLeft='6px'
      const cancelBtn=document.createElement('button'); cancelBtn.textContent='Скасувати'; cancelBtn.style.marginLeft='6px'
      dialog.appendChild(select);dialog.appendChild(swatch);dialog.appendChild(hexInput);dialog.appendChild(codeInput);dialog.appendChild(addBtn);dialog.appendChild(cancelBtn)
      previewOverlay.appendChild(dialog)
      function syncSelectToHex(){const val=select.value?select.value.toUpperCase():'#FF0000';hexInput.value=val;swatch.style.background=val}
      syncSelectToHex()
      select.addEventListener('change',syncSelectToHex)
      hexInput.addEventListener('input',()=>{const v=hexInput.value.trim();if(/^#?[0-9a-fA-F]{6}$/.test(v)){const val=v[0]==='#'?v.toUpperCase():('#'+v.toUpperCase());hexInput.value=val;swatch.style.background=val;for(const opt of select.options){if(opt.value.toUpperCase()===val){select.value=opt.value;break}}}else{try{swatch.style.background=v}catch(e){}}})
      addBtn.addEventListener('click',()=>{let hex=hexInput.value.trim().toUpperCase();if(hex[0]!=='#')hex='#'+hex;if(!/^#([0-9A-F]{6})$/.test(hex)){alert('Введіть коректний HEX (#RRGGBB) або оберіть з меню.');return};addCustomColor(hex,codeInput.value.trim()||null);closeAddDialog()})
      cancelBtn.addEventListener('click',closeAddDialog)
      setTimeout(()=>{
        const onDocClick=(e)=>{if(!dialog.contains(e.target)&&!addCustomColorBtn?.contains(e.target)&&!addCustomDup?.contains(e.target)){closeAddDialog();document.removeEventListener('click',onDocClick)}}
        document.addEventListener('click',onDocClick)
      },10)
    }
    function closeAddDialog(){const dlg=previewOverlay?.querySelector('.side-add-dialog');if(dlg?.parentNode)dlg.parentNode.removeChild(dlg)}
    function addCustomColor(hex, code){
      if(!hex)return;const u=hex.toUpperCase()
      if(customColors.some(c=>c.hex.toUpperCase()===u))return
      customColors.push({hex:u,code});renderCustomBadges()
    }

    if (addCustomColorBtn) addCustomColorBtn.addEventListener('click', ev=>{ev.stopPropagation();showAddCustomColorDialog()})
    if (addCustomDup) addCustomDup.addEventListener('click', ev=>{ev.stopPropagation();showAddCustomColorDialog()})

    // --- initial render ---
    renderPalette()
    renderCustomBadges()
    if (scaleValEl && scaleRangeEl) scaleValEl.textContent = scaleRangeEl.value + '%'
    if (threshValEl && threshRangeEl) threshValEl.textContent = threshRangeEl.value
    applyScale(parseFloat(scaleRangeEl?.value) || 100)

    // Auto-load design passed from DesignPlacement
    // Background removal is intentionally skipped here — AI-generated designs
    // fill the whole canvas and would be falsely removed by the edge filter.
    // User can enable it manually via the checkbox after loading.
    const autoImageUrl = autoImageRef.current
    if (autoImageUrl) {
      const statusEl = $('vectorizerStatus')
      if (statusEl) statusEl.style.display = 'block'
      if (loadBtn) loadBtn.disabled = true
      if (removeBgChk) removeBgChk.checked = false
      fetch(autoImageUrl)
        .then(r => r.blob())
        .then(blob => vectorizeImage(blob))
        .then(svg => { originalText = svg; parseAndShow(svg) })
        .catch(err => {
          console.error('Auto-vectorize failed:', err)
          alert('Не вдалось автоматично векторизувати дизайн: ' + (err?.message || err))
        })
        .finally(() => {
          if (statusEl) statusEl.style.display = 'none'
          if (loadBtn) loadBtn.disabled = false
        })
    }

    return () => {
      if (document.body.contains(probe)) document.body.removeChild(probe)
      hideElementEditor()
      closeAddDialog()
    }
  }, [])

  return (
    <div ref={containerRef} className="pe-container">
      <style>{CSS}</style>
      <div className="pe-left">
        <div className="pe-panel">
          <h2>Інструменти</h2>
          <div className="pe-controls-row">
            <label className="small">Файл (SVG або PNG/JPG): <input id="svgInp" type="file" accept=".svg,image/svg+xml,.png,.jpg,.jpeg,.webp" /></label>
            <button id="loadBtn" className="primary">Завантажити</button>
          </div>
          <div id="vectorizerStatus" style={{display:'none',fontSize:12,color:'#2b6fb3',padding:'2px 0 6px'}}>⏳ Векторизація через Vectorizer.ai…</div>
          <div className="pe-controls-row" style={{gap:6}}>
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#333',cursor:'pointer'}}>
              <input id="removeBgChk" type="checkbox" defaultChecked />
              Видалити фон SVG (торкається 3+ країв)
            </label>
          </div>
          <div className="pe-controls-row">
            <label className="small">Авто-порог згрупування (0..200):</label>
            <input id="threshRange" type="range" min="0" max="200" defaultValue="30" style={{flex:1}} />
            <div id="threshVal" className="pe-muted">30</div>
          </div>
          <div className="pe-controls-row">
            <label className="small">Мінімальна площа групи (%):</label>
            <input id="minArea" type="number" min="0" max="5" step="0.01" defaultValue="0.15" style={{width:100}} />
            <div className="pe-muted" style={{fontSize:12}}>Дрібні групи зливаються в найближчу велику</div>
          </div>
          <div className="pe-controls-row">
            <label className="small">Масштаб (%):</label>
            <input id="scaleRange" type="range" min="10" max="200" defaultValue="120" style={{flex:1}} />
            <div id="scaleVal" className="pe-muted">120%</div>
          </div>
          <div className="pe-controls-row">
            <label className="small">Максимум кольорів після мапінгу:</label>
            <input id="maxColors" type="number" min="2" max="50" step="1" defaultValue="12" style={{width:100}} />
            <label style={{marginLeft:8,display:'flex',alignItems:'center',gap:8}}>
              <input id="autoMap" type="checkbox" /> Авто-мапінг при завантаженні
            </label>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center',flexWrap:'wrap'}}>
            <button id="autoGroupBtn">Авто-групування</button>
            <button id="mapPaletteBtn">Підібрати палітру</button>
            <button id="mergeMirroredBtn">Merge mirrored</button>
            <button id="toggleLabelsBtn">Показати/заховати коди</button>
            <button id="revertBtn" disabled>Відкотити</button>
            <button id="exportBtn" disabled>Експортувати PNG</button>
          </div>
          <div className="pe-note">Мітки агрегаційно збираються по координатах: замість декількох написів з'явиться один зведений (наприклад "3338/3341").</div>
          <hr style={{border:'none',borderTop:'1px solid #eee',margin:'12px 0'}} />
          <div style={{marginTop:8}} className="small">Палітра (коди):</div>
          <div id="palette" className="palette" />
          <div style={{marginTop:6}} className="pe-muted-small">Клік по елементу палітри застосує його до виділеного або всього ескізу. Кастомні кольори можна видалити (×).</div>
          <hr style={{border:'none',borderTop:'1px solid #eee',margin:'12px 0'}} />
          <div id="groups" style={{marginTop:8,maxHeight:'32vh',overflow:'auto'}} />
          <div className="pe-footer-controls" style={{marginTop:8}}>
            <button id="addCustomColorBtn">+ Додати колір</button>
          </div>
        </div>
      </div>
      <div className="pe-right">
        <div className="pe-preview-wrap">
          <div className="pe-preview-columns">
            <div className="pe-preview-column" id="editedColumn">
              <div className="title">Редагований (для правок кольорів)</div>
              <div id="svgPreview" style={{width:'100%'}} />
            </div>
            <div className="pe-preview-column" id="originalColumn">
              <div className="title">Оригінал (не редагується)</div>
              <div id="originalPreview" style={{width:'100%'}} />
            </div>
          </div>
          <div className="pe-preview-overlay" id="previewOverlay">
            <div className="side-detected" id="detectedColorsWrapper" style={{pointerEvents:'auto'}}>
              <div id="detectedColors" />
              <div id="detectedEditor" style={{display:'none'}} />
            </div>
            <div className="side-codes" id="sideCodes" />
            <div className="side-add-area" id="sideAddArea" style={{pointerEvents:'auto'}}>
              <button id="addCustomColorBtnDuplicate" className="side-add-btn" title="Додати свій колір">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
