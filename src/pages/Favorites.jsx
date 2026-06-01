import React from 'react'
import { useNavigate } from 'react-router-dom'

const favorites = [
  { id: 1, name: 'Худі з собакою', image: 'https://images.unsplash.com/photo-1556821840-3a63f15232d0?w=300&h=300&fit=crop', date: '29 травня 2024' },
  { id: 2, name: 'Аніме футболка', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop', date: '28 травня 2024' },
  { id: 3, name: 'Квітковий світшот', image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=300&h=300&fit=crop', date: '27 травня 2024' },
]

export default function Favorites() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Улюблене</h1>
        <p className="text-sm text-gray-500 mt-0.5">Збережені дизайни та замовлення</p>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto mb-4 text-gray-200" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p className="text-gray-400 text-lg font-medium">Ще немає улюблених</p>
            <p className="text-gray-400 text-sm mt-1">Додайте дизайни до улюблених, щоб бачити їх тут</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {favorites.map((f) => (
              <div key={f.id} className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square overflow-hidden bg-gray-50 relative">
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-white shadow-sm transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm">{f.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.date}</p>
                  <button
                    onClick={() => navigate('/create')}
                    className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-xl transition-colors"
                  >
                    Використати знову
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
