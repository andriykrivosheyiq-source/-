import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const templates = [
  { id: 1, name: 'Портрет тварини', category: 'Тварини', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop', product: 'Худі', uses: 842 },
  { id: 2, name: 'Аніме герой', category: 'Аніме', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop', product: 'Футболка', uses: 1203 },
  { id: 3, name: 'Квіткова вишивка', category: 'Квіти', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop', product: 'Світшот', uses: 567 },
  { id: 4, name: 'Ретро автомобіль', category: 'Транспорт', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop', product: 'Футболка', uses: 389 },
  { id: 5, name: 'Геометрія', category: 'Абстракція', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop', product: 'Худі', uses: 711 },
  { id: 6, name: 'Природа та гори', category: 'Природа', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop', product: 'Оверсайз', uses: 445 },
]

export default function Templates() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const categories = ['all', ...new Set(templates.map((t) => t.category))]

  const filtered = filter === 'all' ? templates : templates.filter((t) => t.category === filter)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Шаблони</h1>
        <p className="text-sm text-gray-500 mt-0.5">Готові дизайни для швидкого старту</p>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        {/* Category filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Всі' : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square overflow-hidden bg-gray-50">
                <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{t.product}</span>
                  <span className="text-xs text-gray-400">{t.uses} використань</span>
                </div>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-xl transition-colors"
                >
                  Використати
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
