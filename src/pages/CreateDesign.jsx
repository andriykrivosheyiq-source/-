import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { products, productCategories, designStyles } from '../data/mockData'
import { generateDesigns, GENERATIVE_STYLES } from '../services/gemini'

// ─── Product Selector ────────────────────────────────────────────
function ProductSelector({ selected, onChange }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      onChange([id, ...selected]) // most recently selected becomes primary product
    }
  }

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    const matchSearch = !search.trim() || search.trim().toLowerCase().split(/\s+/).every(w => p.nameUk.toLowerCase().includes(w))
    return matchCat && matchSearch
  })

  return (
    <div className="step-section">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">1. Оберіть товар</h2>
        {selected.length > 0 && (
          <span className="text-sm text-indigo-600 font-medium">{selected.length} обрано</span>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Пошук (напр. чорний худі, рожева...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Category buttons */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >Всі</button>
        {productCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{cat.name}</button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5 max-h-64 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-400 text-sm">Нічого не знайдено</div>
        )}
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`product-card ${selected.includes(p.id) ? 'selected' : ''}`}
          >
            {selected.includes(p.id) ? (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center z-10">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ) : (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 border-2 border-gray-200 rounded-md bg-white z-10" />
            )}
            <img src={p.image} alt={p.nameUk} className="w-14 h-14 object-cover rounded-lg" />
            <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{p.nameUk}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Style Selector ────────────────────────────────────────────
function StyleSelector({ selected, onChange, showAll, onToggleAll }) {
  const visible = showAll ? designStyles : designStyles.slice(0, 5)

  return (
    <div className="step-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">2. Оберіть стиль дизайну</h2>
        <button
          onClick={onToggleAll}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {showAll ? 'Сховати' : 'Переглянути всі'}
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        {visible.map((s) => (
          <div
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`style-card w-28 ${selected === s.id ? 'selected' : ''}`}
          >
            {selected === s.id && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center z-10">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <img
              src={s.image}
              alt={s.nameUk}
              className="w-full h-24 object-cover"
            />
            <span className="text-xs font-medium text-gray-700 py-1.5 px-1 text-center block">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Color Selector ────────────────────────────────────────────
function ColorSelector({ selectedProducts, productColors, onChange }) {
  if (selectedProducts.length === 0) return null

  const mainProduct = products.find((p) => p.id === selectedProducts[0])
  const otherProducts = selectedProducts.slice(1).map((id) => products.find((p) => p.id === id))

  const getTotalColors = (productId) => {
    return Object.keys(productColors[productId] || {}).filter((c) => productColors[productId][c]).length
  }

  const getSelectedHexes = (productId) => {
    const product = products.find((p) => p.id === productId)
    return product.colors
      .filter((c) => productColors[productId]?.[c.id])
      .map((c) => c.hex)
      .slice(0, 4)
  }

  const toggleColor = (productId, colorId) => {
    const current = productColors[productId] || {}
    onChange(productId, { ...current, [colorId]: !current[colorId] })
  }

  const ColorGroup = ({ product, isSecondary }) => (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      {isSecondary && (
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
          Також обрані товари
        </p>
      )}
      <p className="text-sm font-semibold text-gray-800 mb-1">{product.nameUk}</p>
      <p className="text-xs text-gray-500 mb-3">Оберіть кольори</p>
      <div className="flex flex-wrap gap-3">
        {product.colors.map((color) => {
          const isSelected = productColors[product.id]?.[color.id] || false
          return (
            <div key={color.id} className="flex flex-col items-center gap-1">
              <button
                onClick={() => toggleColor(product.id, color.id)}
                className={`color-swatch relative ${isSelected ? 'selected' : ''}`}
                style={{
                  backgroundColor: color.hex,
                  borderColor: isSelected ? '#4f46e5' : color.border ? '#d1d5db' : 'transparent',
                  boxShadow: color.border ? 'inset 0 0 0 1px #e5e7eb' : undefined,
                }}
                title={color.nameUk}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke={color.border ? '#4f46e5' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
              <span className="text-[10px] text-gray-500 font-medium">{color.nameUk}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="step-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">3. Оберіть кольори та варіанти</h2>
        <span className="text-sm text-gray-400">Оберіть один або більше кольорів для товарів</span>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 space-y-3">
          {mainProduct && <ColorGroup product={mainProduct} isSecondary={false} />}
          {otherProducts.map((p) => p && <ColorGroup key={p.id} product={p} isSecondary={true} />)}
        </div>

        <div className="w-56 shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ваш вибір</h3>
          <div className="space-y-3">
            {selectedProducts.map((productId) => {
              const product = products.find((p) => p.id === productId)
              const total = getTotalColors(productId)
              const hexes = getSelectedHexes(productId)
              return (
                <div key={productId} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  <img src={product.image} alt={product.nameUk} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{product.nameUk}</p>
                    <p className="text-xs text-gray-500">{total} {total === 1 ? 'колір' : total < 5 ? 'кольори' : 'кольорів'} обрано</p>
                    <div className="flex gap-1 mt-1.5">
                      {hexes.map((hex, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-gray-500 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Crop Modal ───────────────────────────────────────────────────
function CropModal({ file, onConfirm, onSkip }) {
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const [imgUrl] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState({ x: 5, y: 5, w: 90, h: 90 })

  useEffect(() => () => URL.revokeObjectURL(imgUrl), [imgUrl])

  const getPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100)),
    }
  }

  useEffect(() => {
    const onMove = (e) => {
      const dr = dragRef.current
      if (!dr) return
      if (e.cancelable) e.preventDefault()
      const pos = getPos(e)
      const dx = pos.x - dr.sx, dy = pos.y - dr.sy
      const { ox, oy, ow, oh } = dr

      if (dr.type === 'move') {
        setCrop(prev => ({
          ...prev,
          x: Math.max(0, Math.min(100 - prev.w, ox + dx)),
          y: Math.max(0, Math.min(100 - prev.h, oy + dy)),
        }))
      } else if (dr.type === 'new') {
        const x = Math.min(dr.sx, pos.x), y = Math.min(dr.sy, pos.y)
        const w = Math.abs(pos.x - dr.sx), h = Math.abs(pos.y - dr.sy)
        if (w > 3 && h > 3) setCrop({ x, y, w, h })
      } else {
        let x = ox, y = oy, w = ow, h = oh
        if (dr.type.includes('right'))  w = Math.max(5, Math.min(100 - ox, ow + dx))
        if (dr.type.includes('bottom')) h = Math.max(5, Math.min(100 - oy, oh + dy))
        if (dr.type.includes('left'))  { x = Math.max(0, Math.min(ox + ow - 5, ox + dx)); w = ow - (x - ox) }
        if (dr.type.includes('top'))   { y = Math.max(0, Math.min(oy + oh - 5, oy + dy)); h = oh - (y - oy) }
        setCrop({ x, y, w: Math.max(5, w), h: Math.max(5, h) })
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

  const startDrag = (type, e) => {
    e.preventDefault(); e.stopPropagation()
    const pos = getPos(e)
    if (type === 'new') {
      dragRef.current = { type, sx: pos.x, sy: pos.y }
    } else if (type === 'move') {
      dragRef.current = { type, sx: pos.x, sy: pos.y, ox: crop.x, oy: crop.y, ow: crop.w, oh: crop.h }
    } else {
      dragRef.current = { type, sx: pos.x, sy: pos.y, ox: crop.x, oy: crop.y, ow: crop.w, oh: crop.h }
    }
  }

  const handleCrop = () => {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    const W = img.naturalWidth, H = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width  = Math.max(1, Math.round(crop.w / 100 * W))
    canvas.height = Math.max(1, Math.round(crop.h / 100 * H))
    canvas.getContext('2d').drawImage(img, crop.x / 100 * W, crop.y / 100 * H, crop.w / 100 * W, crop.h / 100 * H, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => onConfirm(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.95)
  }

  const handles = [
    { type: 'top-left',     style: { top: -6,    left: -6,   cursor: 'nwse-resize' } },
    { type: 'top-right',    style: { top: -6,    right: -6,  cursor: 'nesw-resize' } },
    { type: 'bottom-left',  style: { bottom: -6, left: -6,   cursor: 'nesw-resize' } },
    { type: 'bottom-right', style: { bottom: -6, right: -6,  cursor: 'nwse-resize' } },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-2xl" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h2 className="font-semibold text-gray-800">Обрізати фото</h2>
          <button onClick={onSkip} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-5 pt-3 pb-1 flex-shrink-0">
          <p className="text-sm text-gray-500">Перетягніть рамку або кутові маркери щоб обрати потрібну ділянку</p>
        </div>

        <div className="flex-1 overflow-hidden px-5 py-3 flex items-center justify-center">
          <div
            ref={containerRef}
            className="relative select-none rounded-lg overflow-hidden cursor-crosshair"
            style={{ maxHeight: 'calc(92vh - 180px)', width: '100%' }}
            onMouseDown={e => startDrag('new', e)}
            onTouchStart={e => startDrag('new', e)}
          >
            <img
              ref={imgRef}
              src={imgUrl}
              alt="crop preview"
              className="w-full h-auto block pointer-events-none"
              style={{ maxHeight: 'calc(92vh - 180px)', objectFit: 'contain' }}
              crossOrigin="anonymous"
            />

            {/* Dark overlay outside crop area */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <defs>
                <mask id="cm-mask">
                  <rect width="100%" height="100%" fill="white"/>
                  <rect x={`${crop.x}%`} y={`${crop.y}%`} width={`${crop.w}%`} height={`${crop.h}%`} fill="black"/>
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#cm-mask)"/>
            </svg>

            {/* Crop rectangle */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%`, boxShadow: '0 0 0 1px rgba(0,0,0,0.4)' }}
              onMouseDown={e => startDrag('move', e)}
              onTouchStart={e => startDrag('move', e)}
            >
              {/* Rule-of-thirds grid */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
                backgroundSize: '33.33% 33.33%',
              }}/>

              {/* Corner handles */}
              {handles.map(h => (
                <div
                  key={h.type}
                  className="absolute w-3 h-3 bg-white rounded-sm z-10"
                  style={{ ...h.style, boxShadow: '0 0 0 2px #4f46e5' }}
                  onMouseDown={e => startDrag(h.type, e)}
                  onTouchStart={e => startDrag(h.type, e)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t flex-shrink-0">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Без обрізки
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Обрізати
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Photo Upload ─────────────────────────────────────────────────
function PhotoUpload({ file, onChange }) {
  const inputRef = useRef()
  const [dragOver, setDragOver] = useState(false)
  const [cropFile, setCropFile] = useState(null)

  const handleFile = (f) => {
    if (f && (f.type === 'image/png' || f.type === 'image/jpeg')) {
      setCropFile(f)
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [])

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      {cropFile && (
        <CropModal
          file={cropFile}
          onConfirm={(croppedFile) => { setCropFile(null); onChange(croppedFile) }}
          onSkip={() => { const f = cropFile; setCropFile(null); onChange(f) }}
        />
      )}

      <div className="step-section">
        <h2 className="section-title mb-4">4. Завантажте фото</h2>
        <div className="flex gap-4">
          {file && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 min-w-0 max-w-xs">
              <img
                src={URL.createObjectURL(file)}
                alt="uploaded"
                className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500 uppercase">{file.type.split('/')[1]} • {formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => setCropFile(file)}
                title="Обрізати"
                className="text-indigo-400 hover:text-indigo-600 transition-colors flex-shrink-0 mr-1"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 2 6 8 2 8"/><polyline points="18 22 18 16 22 16"/>
                  <path d="M2 8h16a2 2 0 0 1 2 2v10"/><path d="M6 2v10a2 2 0 0 0 2 2h10"/>
                </svg>
              </button>
              <button
                onClick={() => onChange(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}

          <div
            className={`drop-zone flex-1 min-h-[120px] ${dragOver ? 'drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
              <polyline points="16 16 12 12 8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="12" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm text-gray-500">
              <span className="text-indigo-600 font-medium hover:underline cursor-pointer">Натисніть щоб завантажити</span>{' '}
              або перетягніть файл
            </p>
            <p className="text-xs text-gray-400">PNG, JPG до 10MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 w-52 shrink-0">
            <p className="text-sm font-semibold text-gray-700 mb-2">Поради для кращого результату</p>
            <ul className="space-y-1.5">
              {[
                'Використовуйте чіткі фото',
                'Хороше освітлення',
                'Фото анфас краще',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-green-500">
                    <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function CreateDesign({ onGenerate }) {
  const navigate = useNavigate()
  const [fileName, setFileName] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedStyle, setSelectedStyle] = useState('est-face')
  const [showAllStyles, setShowAllStyles] = useState(false)
  const [productColors] = useState({})
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)

  const handleGenerate = async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setGenerationError(null)

    try {
      let generatedDesigns = null

      if (uploadedFile && GENERATIVE_STYLES.includes(selectedStyle)) {
        generatedDesigns = await generateDesigns(uploadedFile, selectedStyle)
      }

      onGenerate?.({ selectedProducts, selectedStyle, productColors, uploadedFile, generatedDesigns, fileName })
      navigate('/placement')
    } catch (err) {
      setGenerationError(err.message || 'Помилка генерації. Спробуйте ще раз.')
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = selectedProducts.length > 0 && selectedStyle

  const getHintText = () => {
    if (!GENERATIVE_STYLES.includes(selectedStyle) || !uploadedFile) {
      return 'Наш ШІ згенерує унікальні дизайни для обраних товарів.'
    }
    return 'Gemini згенерує ілюстрацію (бл. 15–30 сек)'
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            1
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Створити дизайн</h1>
            <p className="text-sm text-gray-500">Оберіть товар, стиль та завантажте фото. Наш ШІ створить унікальний дизайн.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <span className="text-sm font-medium text-indigo-600">Створити дизайн</span>
            </div>
            <div className="w-8 h-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span className="text-sm text-gray-400">Розміщення</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-5 max-w-5xl mx-auto">
        {/* File name */}
        <div className="step-section">
          <h2 className="section-title mb-4">Назва файлу</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="Напишіть назву файлу"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="text-sm text-gray-400 font-medium flex-shrink-0">.png</span>
          </div>
        </div>

        <ProductSelector selected={selectedProducts} onChange={setSelectedProducts} />
        <StyleSelector
          selected={selectedStyle}
          onChange={setSelectedStyle}
          showAll={showAllStyles}
          onToggleAll={() => setShowAllStyles((v) => !v)}
        />
        <PhotoUpload file={uploadedFile} onChange={setUploadedFile} />

        <div className="pb-6">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2.5 transition-all duration-200 ${
              canGenerate && !isGenerating
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/>
                </svg>
                Генеруємо дизайн...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Згенерувати дизайн
              </>
            )}
          </button>
          {generationError && (
            <p className="text-center text-sm text-red-500 mt-2 font-medium">
              ⚠️ {generationError}
            </p>
          )}
          {!generationError && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {getHintText()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
