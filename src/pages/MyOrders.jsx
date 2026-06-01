import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockOrders } from '../data/mockData'

const STATUS_CONFIG = {
  new: { label: 'В роботі', dot: 'bg-blue-400', bg: 'bg-blue-50 border-blue-100', badge: 'bg-blue-100 text-blue-700' },
  review: { label: 'На перевірці', dot: 'bg-yellow-400', bg: 'bg-yellow-50 border-yellow-100', badge: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Одобрено', dot: 'bg-green-400', bg: 'bg-green-50 border-green-100', badge: 'bg-green-100 text-green-700' },
}

function OrderCard({ order }) {
  const [hover, setHover] = useState(false)
  const cfg = STATUS_CONFIG[order.status]

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex gap-3 p-3">
        <img
          src={order.image}
          alt={order.name}
          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="text-sm font-semibold text-gray-900">{order.id}</p>
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <div className={`flex gap-1.5 transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
              <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-700 mt-1 truncate">{order.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{order.date}</p>
        </div>
      </div>

      <div className="px-3 pb-3 flex items-center gap-1">
        {order.colors.slice(0, 4).map((hex, i) => (
          <span
            key={i}
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: hex }}
          />
        ))}
        {order.colors.length > 4 && (
          <span className="text-[10px] text-gray-400 ml-1">+{order.colors.length - 4}</span>
        )}
      </div>
    </div>
  )
}

function Column({ status, orders }) {
  const navigate = useNavigate()
  const cfg = STATUS_CONFIG[status]

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="font-semibold text-sm text-gray-800">{cfg.label}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {orders.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0 pr-1">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>

      <button
        onClick={() => navigate('/create')}
        className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 py-2 rounded-xl border border-dashed border-gray-200 hover:border-indigo-300 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Додати нове замовлення
      </button>
    </div>
  )
}

export default function MyOrders() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterProduct, setFilterProduct] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')

  const filtered = mockOrders.filter((o) => {
    const matchSearch = search === '' || o.name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
    const matchProduct = filterProduct === 'all' || o.productId === filterProduct
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchProduct && matchStatus
  })

  const byStatus = (status) => filtered.filter((o) => o.status === status)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мої замовлення</h1>
            <p className="text-sm text-gray-500 mt-0.5">Усі ваші дизайни в одному місці</p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="btn-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Створити новий дизайн
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за назвою або номером..."
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Product filter */}
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-700"
        >
          <option value="all">Всі товари</option>
          <option value="hoodie">Худі</option>
          <option value="tshirt">Футболка</option>
          <option value="oversized">Оверсайз</option>
          <option value="sweatshirt">Світшот</option>
          <option value="cap">Кепка</option>
          <option value="totebag">Сумка шопер</option>
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-700"
        >
          <option value="all">Всі статуси</option>
          <option value="new">В роботі</option>
          <option value="review">На перевірці</option>
          <option value="approved">Одобрено</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-700"
        >
          <option value="newest">Спочатку нові</option>
          <option value="oldest">Спочатку старі</option>
        </select>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full p-6 flex gap-5 min-w-0">
          {(['new', 'review', 'approved']).map((status) => (
            <div key={status} className="flex-1 min-w-[280px] flex flex-col overflow-hidden">
              <Column status={status} orders={byStatus(status)} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer pagination hint */}
      <div className="bg-white border-t border-gray-100 px-8 py-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Показано 1–{filtered.length} із {mockOrders.length} замовлень
        </p>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-medium">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
