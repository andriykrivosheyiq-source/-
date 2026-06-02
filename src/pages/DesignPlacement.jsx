import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { products as allProducts } from '../data/mockData'

const CANVAS_W = 1200
const CANVAS_H = 800

async function composeDADPoster(illustrationSrc) {
  // Load collegiate font before drawing
  try { await document.fonts.load(`900 100px "Black Ops One"`) } catch (_) {}

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  const fontSize = Math.round(CANVAS_H * 0.62)
  ctx.font = `900 ${fontSize}px "Black Ops One", Impact, "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const drawLetter = (letter, x, rotationDeg) => {
    ctx.save()
    ctx.translate(x, CANVAS_H * 0.5)
    ctx.rotate((rotationDeg * Math.PI) / 180)

    // Outer border: thin enough to see white inside (15px each side)
    ctx.lineWidth = Math.round(fontSize * 0.055)
    ctx.strokeStyle = '#000000'
    ctx.lineJoin = 'miter'
    ctx.miterLimit = 2
    ctx.strokeText(letter, 0, 0)
    // White fill — covers inner half of outer stroke, creates white interior
    ctx.fillStyle = '#ffffff'
    ctx.fillText(letter, 0, 0)
    // Inner thin border on top of white fill (collegiate double-outline)
    ctx.lineWidth = Math.round(fontSize * 0.024)
    ctx.strokeStyle = '#000000'
    ctx.strokeText(letter, 0, 0)

    ctx.restore()
  }

  drawLetter('D', CANVAS_W * 0.185, -12)
  drawLetter('D', CANVAS_W * 0.815, 12)

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxH = CANVAS_H * 0.90
      const maxW = CANVAS_W * 0.48
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale

      // Remove white background from illustration so D letters show through
      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = img.naturalWidth
      tmpCanvas.height = img.naturalHeight
      const tmpCtx = tmpCanvas.getContext('2d')
      tmpCtx.drawImage(img, 0, 0)
      const imgData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height)
      const d = imgData.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 245 && d[i + 1] > 245 && d[i + 2] > 245) d[i + 3] = 0
      }
      tmpCtx.putImageData(imgData, 0, 0)

      ctx.drawImage(tmpCanvas, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(illustrationSrc)
    img.src = illustrationSrc
  })
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
          placeholder="Наприклад: зроби фон темнішим, додай зірки навколо..."
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
  const [composited, setComposited] = useState(null)

  const generatedDesigns = designData?.generatedDesigns || null
  const hasDesigns = generatedDesigns && generatedDesigns.length > 0
  const hasTwoDesigns = generatedDesigns && generatedDesigns.length > 1

  const rawIllustration = hasDesigns
    ? generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].image
    : null

  // Compose illustration + D letters whenever the raw illustration changes
  useEffect(() => {
    setComposited(null)
    if (!rawIllustration) return
    composeDADPoster(rawIllustration).then(setComposited)
  }, [rawIllustration])

  const currentDesignImage = composited || rawIllustration

  const currentProduct = allProducts.find((p) => p.id === selectedProduct) || allProducts[0]

  const handleAddToCart = () => navigate('/orders')

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
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

        {/* Tab switcher */}
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

        {/* Generated Design — full width, wide */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Згенерований дизайн</h2>
            <div className="flex items-center gap-3">
              {hasDesigns && (
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
                  {generatedDesigns[Math.min(activeTab, generatedDesigns.length - 1)].label}
                </span>
              )}
            </div>
          </div>

          {/* Wide 16:9 design area */}
          <div className="p-5">
            <div className="w-full bg-gray-50 rounded-xl overflow-hidden">
              {currentDesignImage ? (
                <img
                  src={currentDesignImage}
                  alt="Generated design"
                  className="w-full h-auto block"
                  style={{ maxHeight: '80vh' }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400 py-20">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-sm text-center max-w-xs">Завантажте фото та оберіть стиль DAD/ТАТО для генерації</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate('/create')}
                className="btn-secondary flex-1 justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Перегенерувати
              </button>
              {composited && (
                <a
                  href={composited}
                  download="dad-design.png"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium px-5 py-2.5 rounded-xl border border-green-200 transition-colors duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Завантажити PNG
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Product preview — below, horizontal layout */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Обраний товар</h2>
            <button
              onClick={() => setShowChangeProduct(true)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Змінити товар
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>

          <div className="p-5 flex gap-6 items-center">
            {/* Product image with design overlay */}
            <div className="relative w-48 h-48 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={currentProduct?.image}
                alt={currentProduct?.nameUk}
                className="w-full h-full object-contain"
              />
              {currentDesignImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={currentDesignImage}
                    alt="design overlay"
                    className="w-2/5 opacity-90 mix-blend-multiply rounded-lg"
                    style={{ filter: 'contrast(1.1)' }}
                  />
                </div>
              )}
            </div>

            {/* Product info */}
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
        <ChangeProductModal
          current={selectedProduct}
          onSelect={setSelectedProduct}
          onClose={() => setShowChangeProduct(false)}
        />
      )}
    </div>
  )
}
