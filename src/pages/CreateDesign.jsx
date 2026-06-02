import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { products, designStyles } from '../data/mockData'
import { generateDesigns, GENERATIVE_STYLES } from '../services/gemini'

// ─── Product Selector ────────────────────────────────────────────
function ProductSelector({ selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="step-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">1. Оберіть товар</h2>
        <span className="text-sm text-gray-400">Оберіть один або кілька товарів</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`product-card ${selected.includes(p.id) ? 'selected' : ''}`}
          >
            {selected.includes(p.id) && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center z-10">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            {!selected.includes(p.id) && (
              <div className="absolute top-2 right-2 w-5 h-5 border-2 border-gray-200 rounded-md bg-white z-10" />
            )}
            <img
              src={p.image}
              alt={p.nameUk}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {p.nameUk}
            </span>
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

// ─── Photo Upload ─────────────────────────────────────────────────
function PhotoUpload({ file, onChange }) {
  const inputRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f) => {
    if (f && (f.type === 'image/png' || f.type === 'image/jpeg')) {
      onChange(f)
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
  )
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function CreateDesign({ onGenerate }) {
  const navigate = useNavigate()
  const [fileName, setFileName] = useState('')
  const [selectedProducts, setSelectedProducts] = useState(['hoodie'])
  const [selectedStyle, setSelectedStyle] = useState('dad-face')
  const [showAllStyles, setShowAllStyles] = useState(false)
  const [productColors, setProductColors] = useState({
    hoodie: { black: true, white: true, gray: true },
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)

  const handleColorChange = (productId, colors) => {
    setProductColors((prev) => ({ ...prev, [productId]: colors }))
  }

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
    if (selectedStyle === 'est-face') {
      return 'Gemini згенерує EST ілюстрацію (бл. 15–30 сек)'
    }
    return 'Gemini згенерує 2 варіанти: DAD та ТАТО (бл. 15–30 сек)'
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
        <ColorSelector
          selectedProducts={selectedProducts}
          productColors={productColors}
          onChange={handleColorChange}
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
