import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { products as allProducts } from '../data/mockData'

const D_PATH =
  'M291 123L78 153L88 232L114 229L116 233L148 467L143 471L121 474L132 555L349 526L400 459L360 176Z ' +
  'M289 135L350 183L388 456L343 515L142 542L140 537L133 484L159 480L160 476L125 219L124 217L102 220L98 219L90 163L115 158Z ' +
  'M262 198L191 207L227 470L298 461L317 436L288 221L285 215Z ' +
  'M259 209L277 224L306 433L291 451L238 458L235 453L203 218L205 216Z'

const PRESET_COLORS = ['#000000', '#1e3a5f', '#c0392b', '#2d5a27', '#d97706', '#7c3aed', '#9ca3af', '#8b5e3c']

function EstPosterView({ imageUrl, estText }) {
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const dragMovedRef = useRef(false)
  const wasSelectedRef = useRef(false)

  const [letters, setLetters] = useState([
    { id: 'left',  x: 1,  y: 5, size: 22, rotation: -12, color: '#000000' },
    { id: 'right', x: 77, y: 5, size: 22, rotation: 12,  color: '#000000' },
  ])
  const [estEl, setEstEl] = useState({ x: 50, y: 88, color: '#000000', fontSize: 2.8 })
  const [selected, setSelected] = useState(null)

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
        if (dr.type === 'move') {
          setEstEl(prev => ({ ...prev, x: dr.ox + dx, y: dr.oy + dy }))
        } else if (dr.type === 'resize') {
          setEstEl(prev => ({ ...prev, fontSize: Math.max(1, Math.min(8, dr.os + (dx - dy) * 0.04)) }))
        }
      } else {
        setLetters(prev => prev.map(l => {
          if (l.id !== dr.id) return l
          if (dr.type === 'move')   return { ...l, x: dr.ox + dx, y: dr.oy + dy }
          if (dr.type === 'resize') return { ...l, size: Math.max(8, Math.min(55, dr.os + (dx - dy) * 0.6)) }
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
    e.preventDefault()
    e.stopPropagation()
    dragMovedRef.current = false
    wasSelectedRef.current = selected === id
    setSelected(id)
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    if (id === 'est') {
      dragRef.current = {
        id, type,
        sx: clientX, sy: clientY,
        ox: estEl.x, oy: estEl.y, os: estEl.fontSize,
        cw: rect.width, ch: rect.height,
      }
    } else {
      const letter = letters.find(l => l.id === id)
      dragRef.current = {
        id, type,
        sx: clientX, sy: clientY,
        ox: letter.x, oy: letter.y,
        os: type === 'rotate' ? letter.rotation : letter.size,
        cw: rect.width, ch: rect.height,
      }
    }
  }

  const handleClick = (id, e) => {
    e.stopPropagation()
    if (wasSelectedRef.current && !dragMovedRef.current) {
      setSelected(null)
    }
  }

  const selectedLetter = letters.find(l => l.id === selected)
  const isEstSelected = selected === 'est'
  const currentColor = isEstSelected ? estEl.color : selectedLetter?.color

  const setColor = (color) => {
    if (isEstSelected) {
      setEstEl(prev => ({ ...prev, color }))
    } else if (selectedLetter) {
      setLetters(prev => prev.map(l => l.id === selected ? { ...l, color } : l))
    }
  }

  return (
    <div style={{ background: '#ffffff', width: '100%', borderRadius: '12px' }}>
      <div
        ref={containerRef}
        onClick={() => setSelected(null)}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#ffffff',
          userSelect: 'none',
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Illustration */}
        <div style={{
          position: 'absolute',
          top: '4%', bottom: '14%',
          left: '24%', right: '24%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="EST illustration"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
            />
          ) : (
            <div style={{ color: '#9ca3af', textAlign: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Завантажте фото для EST стилю</p>
            </div>
          )}
        </div>

        {/* EST text — interactive */}
        <div
          onMouseDown={e => startDrag('est', 'move', e)}
          onTouchStart={e => startDrag('est', 'move', e)}
          onClick={e => handleClick('est', e)}
          style={{
            position: 'absolute',
            left: `${estEl.x}%`,
            top: `${estEl.y}%`,
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 700,
            fontSize: `${estEl.fontSize}vw`,
            letterSpacing: '6px',
            color: estEl.color,
            cursor: isEstSelected ? 'grab' : 'pointer',
            zIndex: isEstSelected ? 20 : 10,
            whiteSpace: 'nowrap',
          }}
        >
          {isEstSelected && (
            <div style={{
              position: 'absolute',
              inset: '-5px',
              border: '2px dashed #4f46e5',
              borderRadius: '6px',
              pointerEvents: 'none',
            }} />
          )}
          {(estText || 'EST.2025').toUpperCase()}
          {isEstSelected && (
            <div
              onMouseDown={e => startDrag('est', 'resize', e)}
              onTouchStart={e => startDrag('est', 'resize', e)}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: '-10px',
                right: '-10px',
                width: '20px', height: '20px',
                background: '#4f46e5',
                border: '2px solid #ffffff',
                borderRadius: '4px',
                cursor: 'nwse-resize',
                zIndex: 30,
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* D Letters */}
        {letters.map(letter => {
          const isSelected = selected === letter.id
          return (
            <div
              key={letter.id}
              onMouseDown={e => startDrag(letter.id, 'move', e)}
              onTouchStart={e => startDrag(letter.id, 'move', e)}
              onClick={e => handleClick(letter.id, e)}
              style={{
                position: 'absolute',
                left: `${letter.x}%`,
                top: `${letter.y}%`,
                width: `${letter.size}%`,
                transform: `rotate(${letter.rotation}deg)`,
                transformOrigin: 'center center',
                cursor: isSelected ? 'grab' : 'pointer',
                zIndex: isSelected ? 20 : 10,
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  inset: '-5px',
                  border: '2px dashed #4f46e5',
                  borderRadius: '6px',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Rotation handle — circle at top center */}
              {isSelected && (
                <div
                  onMouseDown={e => startDrag(letter.id, 'rotate', e)}
                  onTouchStart={e => startDrag(letter.id, 'rotate', e)}
                  onClick={e => e.stopPropagation()}
                  title="Потягніть вліво/вправо щоб повернути"
                  style={{
                    position: 'absolute',
                    top: '-26px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px', height: '20px',
                    background: '#ffffff',
                    border: '2px solid #4f46e5',
                    borderRadius: '50%',
                    cursor: 'ew-resize',
                    zIndex: 31,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                  </svg>
                </div>
              )}

              <svg viewBox="60 110 360 460" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <path d={D_PATH} fill={letter.color} fillRule="evenodd" />
              </svg>

              {/* Resize handle — bottom right */}
              {isSelected && (
                <div
                  onMouseDown={e => startDrag(letter.id, 'resize', e)}
                  onTouchStart={e => startDrag(letter.id, 'resize', e)}
                  onClick={e => e.stopPropagation()}
                  title="Потягніть щоб змінити розмір"
                  style={{
                    position: 'absolute',
                    bottom: '-10px',
                    right: '-10px',
                    width: '20px', height: '20px',
                    background: '#4f46e5',
                    border: '2px solid #ffffff',
                    borderRadius: '4px',
                    cursor: 'nwse-resize',
                    zIndex: 30,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Color picker panel */}
      {selected && (selectedLetter || isEstSelected) && (
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid #f3f4f6',
          background: '#fafafa',
          borderRadius: '0 0 12px 12px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
            {isEstSelected ? 'EST текст' : selected === 'left' ? 'Ліва D' : 'Права D'}:
          </span>
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setColor(color)}
              style={{
                width: '22px', height: '22px',
                borderRadius: '50%',
                background: color,
                border: currentColor === color ? '3px solid #4f46e5' : '2px solid #d1d5db',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            />
          ))}
          <input
            type="color"
            value={currentColor || '#000000'}
            onChange={e => setColor(e.target.value)}
            style={{ width: '28px', height: '28px', padding: 0, border: '2px solid #d1d5db', cursor: 'pointer', borderRadius: '50%', background: 'none' }}
            title="Власний колір"
          />
          <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {isEstSelected ? 'Тягни • кут → розмір' : 'Тягни • ○ поворот • кут → розмір'}
          </span>
        </div>
      )}
    </div>
  )
}

function AIEditModal({ onClose }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">AI Редагування</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Наприклад: зроби фон темнішим..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['Зроби яскравіше', 'Додай рамку', 'Видали фон', 'Зміни колір'].map((s) => (
            <button key={s} onClick={() => setPrompt(s)}
              className="text-xs border border-indigo-200 text-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Скасувати</button>
          <button onClick={handleApply} disabled={!prompt.trim() || loading} className="btn-primary flex-1 justify-center">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/>
              </svg> Застосування...</>
            ) : 'Застосувати'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChangeProductModal({ current, onSelect, onClose }) {
  const available = allProducts.slice(0, 6)
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Змінити товар</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {available.map((p) => (
            <button key={p.id} onClick={() => { onSelect(p.id); onClose() }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                current === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
              }`}>
              <img src={p.image} alt={p.nameUk} className="w-12 h-12 object-cover rounded-lg" />
              <span className="font-medium text-gray-800">{p.nameUk}</span>
              {current === p.id && (
                <span className="ml-auto">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DesignPlacement({ designData }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(
    designData?.selectedProducts?.[0] || 'hoodie'
  )
  const [showAIEdit, setShowAIEdit] = useState(false)
  const [showChangeProduct, setShowChangeProduct] = useState(false)
  const [estText, setEstText] = useState('EST.2025')

  const isEst = designData?.selectedStyle === 'est-face'

  const generatedDesigns = designData?.generatedDesigns || null
  const hasDesigns = generatedDesigns && generatedDesigns.length > 0
  const hasTwoDesigns = generatedDesigns && generatedDesigns.length > 1

  const currentDesignImage = hasDesigns
    ? generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].image
    : null

  const currentProduct = allProducts.find((p) => p.id === selectedProduct) || allProducts[0]

  const handleAddToCart = () => navigate('/orders')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Розміщення дизайну</h1>
            <p className="text-sm text-gray-500">Ваш дизайн готовий! Оберіть варіант та розмістіть на товарі.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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

      <div className="px-8 py-6 max-w-6xl mx-auto">
        {hasTwoDesigns && (
          <div className="flex gap-2 mb-5">
            {generatedDesigns.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  activeTab === i
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                }`}
              >
                {d.label}
                <span className="ml-2 text-xs opacity-70">{i + 1}/2</span>
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Згенерований дизайн</h2>
            {hasDesigns && (
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
                {generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].label}
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="w-full bg-gray-50 rounded-xl overflow-hidden">
              {isEst ? (
                <EstPosterView imageUrl={currentDesignImage} estText={estText} />
              ) : currentDesignImage ? (
                <img src={currentDesignImage} alt="Generated design" className="w-full h-auto block" style={{ maxHeight: '80vh' }} />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400 py-20">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-sm text-center max-w-xs">Завантажте фото та оберіть стиль для генерації</p>
                </div>
              )}
            </div>

            {isEst && (
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">EST текст:</label>
                <input
                  type="text"
                  value={estText}
                  onChange={(e) => setEstText(e.target.value)}
                  placeholder="EST.2025"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => navigate('/create')} className="btn-secondary flex-1 justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Перегенерувати
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Обраний товар</h2>
            <button onClick={() => setShowChangeProduct(true)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              Змінити товар
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          <div className="p-5 flex gap-6 items-center">
            <div className="relative w-48 h-48 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
              <img src={currentProduct?.image} alt={currentProduct?.nameUk} className="w-full h-full object-contain" />
              {currentDesignImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img src={currentDesignImage} alt="design overlay" className="w-2/5 opacity-90 mix-blend-multiply rounded-lg" style={{ filter: 'contrast(1.1)' }} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Товар:</span>
                  <span className="font-medium text-gray-800">{currentProduct?.nameUk}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Положення:</span>
                  <span className="font-medium text-gray-800">Центр спереду</span>
                </div>
                {hasDesigns && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Варіант:</span>
                    <span className="font-medium text-indigo-600">{generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].label}</span>
                  </div>
                )}
              </div>
              <button onClick={handleAddToCart} className="btn-primary w-full justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Додати до замовлення
              </button>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/create')} className="mt-5 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Повернутись до налаштувань
        </button>
      </div>

      {showAIEdit && <AIEditModal onClose={() => setShowAIEdit(false)} />}
      {showChangeProduct && (
        <ChangeProductModal current={selectedProduct} onSelect={setSelectedProduct} onClose={() => setShowChangeProduct(false)} />
      )}
    </div>
  )
}
