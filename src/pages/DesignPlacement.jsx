import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DESIGN_IMG = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop&auto=format'
const HOODIE_IMG = 'https://images.unsplash.com/photo-1556821840-3a63f15232d0?w=600&h=700&fit=crop&auto=format'

const mockGeneratedDesigns = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&h=600&fit=crop&auto=format',
]

const products = [
  { id: 'hoodie', nameUk: 'Худі', image: HOODIE_IMG },
  { id: 'tshirt', nameUk: 'Футболка', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=700&fit=crop&auto=format' },
  { id: 'sweatshirt', nameUk: 'Світшот', image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&h=700&fit=crop&auto=format' },
]

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
        <p className="text-sm text-gray-500 mb-4">
          Опишіть зміни, які ви хочете внести до дизайну
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Наприклад: зроби фон темнішим, додай зірки навколо..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['Зроби яскравіше', 'Додай рамку', 'Видали фон', 'Зміни колір'].map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="text-xs border border-indigo-200 text-indigo-600 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Скасувати
          </button>
          <button
            onClick={handleApply}
            disabled={!prompt.trim() || loading}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg> Застосування...</>
            ) : 'Застосувати'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChangeProductModal({ current, onSelect, onClose }) {
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
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); onClose() }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                current === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
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

export default function DesignPlacement() {
  const navigate = useNavigate()
  const [designIndex, setDesignIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState('hoodie')
  const [showAIEdit, setShowAIEdit] = useState(false)
  const [showChangeProduct, setShowChangeProduct] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const currentProduct = products.find((p) => p.id === selectedProduct)
  const currentDesign = mockGeneratedDesigns[designIndex]

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await new Promise((r) => setTimeout(r, 1800))
    setDesignIndex((i) => (i + 1) % mockGeneratedDesigns.length)
    setIsRegenerating(false)
  }

  const handleAddToCart = () => {
    navigate('/orders')
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            2
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Розміщення дизайну</h1>
            <p className="text-sm text-gray-500">Ваш дизайн готовий! Розмістіть його на товарі та налаштуйте.</p>
          </div>
          {/* Step indicator */}
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

      <div className="px-8 py-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-5">
          {/* Generated Design panel */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Згенерований дизайн</h2>
            </div>
            <div className="p-5">
              <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
                {isRegenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75"/>
                    </svg>
                    <p className="text-sm text-gray-500">Генеруємо новий дизайн...</p>
                  </div>
                ) : (
                  <img
                    src={currentDesign}
                    alt="Generated design"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="btn-secondary flex-1 justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Перегенерувати
                </button>
                <button
                  onClick={() => setShowAIEdit(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-5 py-2.5 rounded-xl border border-indigo-200 transition-colors duration-200"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  AI Редагування
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                ✏️ Не задоволені? Перегенеруйте або відредагуйте за допомогою ШІ.
              </p>
            </div>
          </div>

          {/* Selected Product panel */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Обраний товар</h2>
              <button
                onClick={() => setShowChangeProduct(true)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Змінити товар
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <div className="p-5">
              <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square relative flex items-center justify-center">
                <img
                  src={currentProduct?.image}
                  alt={currentProduct?.nameUk}
                  className="w-full h-full object-cover"
                />
                {/* Design overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={currentDesign}
                    alt="design overlay"
                    className="w-2/5 opacity-90 mix-blend-multiply rounded-lg"
                    style={{ filter: 'contrast(1.1)' }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Товар:</span>
                  <span className="font-medium text-gray-800">{currentProduct?.nameUk}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Положення:</span>
                  <span className="font-medium text-gray-800">Центр спереду</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn-primary w-full justify-center mt-5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Додати до замовлення
              </button>
            </div>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/create')}
          className="mt-5 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
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
