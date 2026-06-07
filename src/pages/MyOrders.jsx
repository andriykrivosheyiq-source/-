import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { products as allProducts } from '../data/mockData'
import { sendOrderToDesignerTelegram } from '../services/crmService'
import { removeBgFromUrlIfNeeded } from '../utils/imageUtils'

const STATUS_CONFIG = {
  new:      { label: 'В роботі',          dot: 'bg-blue-400',   bg: 'bg-blue-50 border-blue-100',       badge: 'bg-blue-100 text-blue-700' },
  review:   { label: 'На перевірці',      dot: 'bg-yellow-400', bg: 'bg-yellow-50 border-yellow-100',   badge: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Одобрено',          dot: 'bg-green-400',  bg: 'bg-green-50 border-green-100',     badge: 'bg-green-100 text-green-700' },
  designer: { label: 'Передано дизайнеру',dot: 'bg-purple-400', bg: 'bg-purple-50 border-purple-100',  badge: 'bg-purple-100 text-purple-700' },
  done:     { label: 'Виконано',          dot: 'bg-gray-400',   bg: 'bg-gray-50 border-gray-100',       badge: 'bg-gray-100 text-gray-700' },
}
const STATUSES = Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))

const KYIV_DATE = (iso) => new Date(iso).toLocaleString('uk-UA', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kiev'
}).replace(',', '')

const DESIGNERS = [
  { id: 'andrii',    name: 'Андрій',    handle: '@andrii_design',    color: 'bg-blue-500' },
  { id: 'maksym',    name: 'Максим',    handle: '@maksym_design',    color: 'bg-green-500' },
  { id: 'oleksandr', name: 'Олександр', handle: '@oleksandr_design', color: 'bg-orange-500' },
  { id: 'mariia',    name: 'Марія',     handle: '@mariia_design',    color: 'bg-pink-500' },
  { id: 'yuliia',    name: 'Юлія',      handle: '@yuliia_design',    color: 'bg-purple-500' },
]

// ─── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, extras, onClose, onStatusChange, onDelete, onOpenOrder, onUpdateOrder }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
  const [comment, setComment] = useState(order.comment || '')
  const [saved, setSaved] = useState(false)

  const handleSaveComment = () => {
    onUpdateOrder?.(order.id, { comment })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }
  const displayImage = extras?.fullImage || order.image

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-baseline gap-2 min-w-0">
              {order._saved && onOpenOrder ? (
                <button
                  onClick={() => { onClose(); onOpenOrder(order.id) }}
                  className="text-base font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  title="Відкрити в редакторі"
                >
                  {order.id}
                </button>
              ) : (
                <span className="text-base font-bold text-gray-900">{order.id}</span>
              )}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Image */}
        {displayImage && (
          <div className="bg-gray-50 flex items-center justify-center" style={{ maxHeight: 300 }}>
            <img src={displayImage} alt={order.name} className="max-h-72 w-full object-contain" style={{ imageRendering: 'auto' }} />
          </div>
        )}

        {/* Mockup strip */}
        {(order.mockupThumbs?.length > 0 || order.mockupThumb) && (
          <div className="px-5 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Мокапи</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {(order.mockupThumbs || [{ label: order.productName, thumbnail: order.mockupThumb }]).map((m, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <img src={m.thumbnail} alt={m.label || `Мокап ${i + 1}`} className="h-32 w-32 object-contain rounded-xl border border-gray-100 bg-gray-50" />
                  {m.label && <p className="text-[11px] text-gray-500 mt-1 w-32 truncate">{m.label}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-base font-semibold text-gray-900">{order.name}</p>
            {order.productName && <p className="text-sm text-gray-500 mt-0.5">{order.productName}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
          </div>

          {/* Colors */}
          {(order.colors || []).length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 mr-1">Колір:</span>
              {order.colors.map((hex, i) => (
                <span key={i} className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}

          {/* Designer info */}
          {order.designer && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 space-y-0.5">
              <p className="text-xs font-semibold text-purple-700">Вишивальний дизайнер</p>
              <p className="text-sm font-bold text-gray-800">{order.designer}</p>
              {order.transferDate && (
                <p className="text-xs text-gray-500">Дата передачі: {KYIV_DATE(order.transferDate)}</p>
              )}
              {(order.orderSize || order.embroiderySize) && (
                <p className="text-xs text-gray-500">
                  {[order.orderSize && `Розмір: ${order.orderSize}`, order.embroiderySize && `Вишивка: ${order.embroiderySize}`].filter(Boolean).join(' · ')}
                </p>
              )}
              {order.comment && <p className="text-xs text-gray-500 italic">«{order.comment}»</p>}
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Коментар / нотатки</label>
            <textarea
              value={comment}
              onChange={e => { setComment(e.target.value); setSaved(false) }}
              placeholder="Додайте нотатку до замовлення..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={handleSaveComment}
              className={`mt-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${saved ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            >
              {saved ? '✓ Збережено' : 'Зберегти коментар'}
            </button>
          </div>

          {/* Status change */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">Перемістити до:</p>
            <div className="flex gap-2">
              {STATUSES.filter(s => s.key !== order.status).map(s => (
                <button
                  key={s.key}
                  onClick={() => { onStatusChange?.(order.id, s.key); onClose() }}
                  className="flex-1 py-2 text-xs font-semibold border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {order._saved && onDelete ? (
            <button
              onClick={() => { onDelete(order.id); onClose() }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              Видалити
            </button>
          ) : <span />}
          <button onClick={onClose} className="btn-primary">Закрити</button>
        </div>
      </div>
    </div>
  )
}

// ─── TransferToDesignerModal ───────────────────────────────────────────────────

function TransferToDesignerModal({ order, extras, onConfirm, onClose }) {
  const [orderSize, setOrderSize] = useState(order.orderSize || '')
  const [embroiderySize, setEmbroiderySize] = useState(order.embroiderySize || '')
  const [comment, setComment] = useState(order.comment || '')
  const [files, setFiles] = useState(() => {
    const result = []
    const designImage = extras?.fullImage || order.image
    if (designImage) {
      result.push({ id: 'design', label: 'Дизайн №1', thumbnail: designImage, checked: true })
    }
    if (order.mockupThumbs?.length > 0) {
      order.mockupThumbs.forEach((m, i) => {
        result.push({ id: `mockup-${i}`, label: `Мокап №${i + 1} — ${m.label}`, thumbnail: m.thumbnail, checked: true })
      })
    } else {
      const productIds = extras?.designSnapshot?.selectedProducts || (order.productId ? [order.productId] : [])
      productIds.forEach((pid, i) => {
        const product = allProducts.find(p => p.id === pid)
        if (product) {
          const thumbnail = (i === 0 && order.mockupThumb) ? order.mockupThumb : product.image
          result.push({ id: `mockup-${i}`, label: `Мокап №${i + 1} — ${product.nameUk}`, thumbnail, checked: true })
        }
      })
    }
    return result
  })

  const handleConfirm = () => {
    onConfirm({
      transferDate: new Date().toISOString(),
      comment,
      orderSize,
      embroiderySize,
      checkedFiles: files.filter(f => f.checked),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Підтвердити передачу дизайнеру</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Перевірте деталі замовлення та виберіть дизайнера.<br/>Після підтвердження статус зміниться на «Передано дизайнеру».</p>
          </div>
          <button onClick={onClose} className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Order info */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">Інформація про замовлення</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Номер замовлення</label>
                <div className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50">{order.id}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Тип одягу та колір</label>
                <div className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50 flex items-center gap-2">
                  {order.colors?.[0] && <span className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200" style={{ backgroundColor: order.colors[0] }} />}
                  {order.productName || '—'}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Розмір</label>
                <input value={orderSize} onChange={e => setOrderSize(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="XL" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Розмір вишивки</label>
                <input value={embroiderySize} onChange={e => setEmbroiderySize(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="23 см" />
              </div>
            </div>
          </div>

          {/* Files */}
          {files.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Файли для передачі</h3>
              <p className="text-sm text-gray-500 mb-3">Оберіть файли, які передаються дизайнеру</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {files.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex-shrink-0 w-44 border-2 rounded-xl p-3 cursor-pointer transition-all ${item.checked ? 'border-indigo-500 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}
                    onClick={() => setFiles(prev => prev.map((f, i) => i === idx ? { ...f, checked: !f.checked } : f))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${item.checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                        {item.checked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </div>
                    <div className="w-full h-28 bg-white rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center mb-2">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Коментар (необов'язково)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 200))}
                  placeholder="Додайте коментар для дизайнера..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-gray-400">Наприклад: Терміново, зберегти всі деталі обличчя тощо.</p>
                  <span className="text-[11px] text-gray-400">{comment.length}/200</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold transition-colors">
            Скасувати
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Підтвердити передачу дизайнеру
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── OrderCard ─────────────────────────────────────────────────────────────────

function DeleteConfirmPopover({ orderId, onConfirm, onCancel }) {
  return (
    <div
      className="absolute top-8 right-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-56"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-sm font-semibold text-gray-800 mb-1">Видалити замовлення?</p>
      <p className="text-xs text-gray-500 mb-3">Цю дію неможливо скасувати.</p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Ні
        </button>
        <button
          onClick={() => onConfirm(orderId)}
          className="flex-1 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Так, видалити
        </button>
      </div>
    </div>
  )
}

function OrderCard({ order, onStatusChange, onDelete, onOpen }) {
  const [hover, setHover] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new
  const isOverdue = order.transferDate && (Date.now() - new Date(order.transferDate).getTime() > 24 * 3600 * 1000)

  const handleDragStart = (e) => {
    e.dataTransfer.setData('orderId', order.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen?.(order)}
      className={`bg-white rounded-xl shadow-sm overflow-visible hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-70 active:scale-95 ${isOverdue ? 'border-2 border-red-400' : 'border border-gray-100'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setConfirmDelete(false) }}
    >
      <div className="flex gap-3 p-3">
        <div className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden bg-gray-50">
          {order.image ? (
            <img src={order.image} alt={order.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{order.id}</p>
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            {/* Action buttons — stop propagation so clicking them doesn't open modal */}
            <div
              className={`relative flex gap-1 transition-opacity shrink-0 ${hover || confirmDelete ? 'opacity-100' : 'opacity-0'}`}
              onClick={e => e.stopPropagation()}
            >
              {order._saved && onDelete && (
                <>
                  <button
                    onClick={() => setConfirmDelete(v => !v)}
                    className={`p-1.5 rounded-lg transition-colors ${confirmDelete ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                    title="Видалити"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                  {confirmDelete && (
                    <DeleteConfirmPopover
                      orderId={order.id}
                      onConfirm={(id) => { setConfirmDelete(false); onDelete(id) }}
                      onCancel={() => setConfirmDelete(false)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {order.productName && <p className="text-[11px] text-gray-500 truncate">{order.productName}</p>}
          <p className="text-[11px] text-gray-400 mt-0.5">{order.date}</p>
          {order.designer && (
            <p className="text-[11px] text-purple-600 font-medium mt-0.5 truncate">{order.designer}</p>
          )}
          {order.transferDate && (
            <p className="text-[10px] text-gray-400 truncate">Передано: {KYIV_DATE(order.transferDate)}</p>
          )}
          {(order.orderSize || order.embroiderySize) && (
            <p className="text-[10px] text-gray-500 truncate">
              {[order.orderSize && `Розмір: ${order.orderSize}`, order.embroiderySize && `Вишивка: ${order.embroiderySize}`].filter(Boolean).join(' · ')}
            </p>
          )}
          {order.comment && (
            <p className="text-[10px] text-gray-400 italic truncate">«{order.comment}»</p>
          )}
        </div>
      </div>
      {isOverdue && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-[10px] text-red-600 font-medium">Більше 24 год у дизайнера</span>
        </div>
      )}

      <div className="px-3 pb-3 flex items-center gap-1">
        {(order.colors || []).slice(0, 4).map((hex, i) => (
          <span key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: hex }} />
        ))}
        {(order.colors || []).length > 4 && (
          <span className="text-[10px] text-gray-400 ml-1">+{order.colors.length - 4}</span>
        )}
        <span className="ml-auto text-[10px] text-gray-300">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </span>
      </div>
    </div>
  )
}

// ─── Column ────────────────────────────────────────────────────────────────────

function Column({ status, orders, onStatusChange, onDelete, onOpen }) {
  const navigate = useNavigate()
  const cfg = STATUS_CONFIG[status]
  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = (e) => {
    e.preventDefault()
    dragCounter.current++
    setDragOver(true)
  }
  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) setDragOver(false)
  }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const id = e.dataTransfer.getData('orderId')
    if (id) onStatusChange?.(id, status)
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className="font-semibold text-sm text-gray-800">{cfg.label}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {orders.length}
          </span>
        </div>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto space-y-2.5 min-h-0 pr-1 rounded-xl transition-colors duration-150 p-1 ${dragOver ? 'bg-indigo-50 ring-2 ring-indigo-300 ring-inset' : ''}`}
        style={{ minHeight: 80 }}
      >
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onOpen={onOpen}
          />
        ))}
        {dragOver && orders.length === 0 && (
          <div className="flex items-center justify-center h-16 text-indigo-400 text-sm font-medium">
            Перетягніть сюди
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/create')}
        className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 py-2 rounded-xl border border-dashed border-gray-200 hover:border-indigo-300 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        Додати нове замовлення
      </button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MyOrders({ savedOrders = [], ordersLoading = false, orderExtras = {}, onUpdateOrder, onDeleteOrder, onOpenOrder }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterProduct, setFilterProduct] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [transferPending, setTransferPending] = useState(null)
  const [tgToast, setTgToast] = useState(null) // null | 'sending' | 'ok' | 'error'

  const allOrders = savedOrders.map(o => ({ ...o, _saved: true }))

  const filtered = allOrders.filter((o) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || q.split(/\s+/).every(w => o.name.toLowerCase().includes(w) || o.id.toLowerCase().includes(w))
    const matchProduct = filterProduct === 'all' || o.productId === filterProduct
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchProduct && matchStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return (b._saved ? 1 : 0) - (a._saved ? 1 : 0)
    return 0
  })

  const byStatus = (status) => sorted.filter((o) => o.status === status)

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'designer') {
      const order = allOrders.find(o => o.id === id) || { id }
      setTransferPending({ order, extras: orderExtras[id] || {} })
      if (selectedOrder?.id === id) setSelectedOrder(null)
      return
    }
    onUpdateOrder?.(id, { status: newStatus })
    if (selectedOrder?.id === id) setSelectedOrder(prev => ({ ...prev, status: newStatus }))
  }

  const handleConfirmTransfer = (designerData) => {
    if (!transferPending) return
    const { order, extras } = transferPending
    onUpdateOrder?.(order.id, { status: 'designer', ...designerData })
    setTransferPending(null)

    const checkedFiles = designerData.checkedFiles || []
    if (checkedFiles.length === 0) return

    setTgToast('sending')
    const cleanId = (order.id || '').replace(/^#/, '')
    const productIds = extras?.designSnapshot?.selectedProducts
    const allProductNames = productIds?.length
      ? productIds.map(pid => allProducts.find(p => p.id === pid)?.nameUk).filter(Boolean)
      : order.productName ? [order.productName] : []
    const productNamesStr = allProductNames.join(', ') || order.productName || '';

    (async () => {
      const caption = [cleanId, productNamesStr, designerData.orderSize, designerData.embroiderySize].filter(Boolean).join(' ')
      // For the design file: remove background only if not already removed.
      // Checks corner transparency to avoid double-removal which erases light-colored elements.
      const tgFiles = await Promise.all(checkedFiles.map(async f => {
        let dataUrl = f.thumbnail
        if (f.id === 'design') {
          const src = extras?.fullImage || f.thumbnail
          if (src) {
            try { dataUrl = await removeBgFromUrlIfNeeded(src) } catch { dataUrl = src }
          }
        }
        return {
          dataUrl,
          label: caption,
          filename: f.id === 'design' ? `${cleanId}.png` : `${caption}.png`,
        }
      }))
      sendOrderToDesignerTelegram({
        order: { ...order, productName: productNamesStr, orderSize: designerData.orderSize, embroiderySize: designerData.embroiderySize, comment: designerData.comment },
        files: tgFiles,
      }).then(() => {
        setTgToast('ok')
        setTimeout(() => setTgToast(null), 4000)
      }).catch(() => {
        setTgToast('error')
        setTimeout(() => setTgToast(null), 4000)
      })
    })()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мої замовлення</h1>
            <p className="text-sm text-gray-500 mt-0.5">Усі ваші дизайни в одному місці</p>
          </div>
          <button onClick={() => navigate('/create')} className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Створити новий дизайн
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук за назвою або номером..."
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>

        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-700">
          <option value="all">Всі товари</option>
          <option value="hoodie">Худі</option>
          <option value="tshirt">Футболка</option>
          <option value="oversized">Оверсайз</option>
          <option value="sweatshirt">Світшот</option>
          <option value="cap">Кепка</option>
          <option value="totebag">Сумка шопер</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-700">
          <option value="all">Всі статуси</option>
          <option value="new">В роботі</option>
          <option value="review">На перевірці</option>
          <option value="approved">Одобрено</option>
          <option value="designer">Передано дизайнеру</option>
          <option value="done">Виконано</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-700">
          <option value="newest">Спочатку нові</option>
          <option value="oldest">Спочатку старі</option>
        </select>

        <div className="ml-auto flex items-center gap-1 border border-gray-200 rounded-xl p-1">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden" style={{ position: 'relative' }}>
        {ordersLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"/></svg>
              <span className="text-sm text-gray-500 font-medium">Завантаження замовлень...</span>
            </div>
          </div>
        )}
        <div className="h-full p-6 flex gap-5 min-w-0">
          {(['new', 'review', 'approved', 'designer', 'done']).map((status) => (
            <div key={status} className="flex-1 min-w-[280px] flex flex-col overflow-hidden">
              <Column
                status={status}
                orders={byStatus(status)}
                onStatusChange={handleStatusChange}
                onDelete={onDeleteOrder}
                onOpen={setSelectedOrder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 px-8 py-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Показано 1–{filtered.length} із {allOrders.length} замовлень
        </p>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-medium">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          extras={orderExtras[selectedOrder.id]}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onDelete={onDeleteOrder}
          onOpenOrder={onOpenOrder}
          onUpdateOrder={onUpdateOrder}
        />
      )}

      {/* Transfer to designer modal */}
      {transferPending && (
        <TransferToDesignerModal
          order={transferPending.order}
          extras={transferPending.extras}
          onConfirm={handleConfirmTransfer}
          onClose={() => setTransferPending(null)}
        />
      )}

      {tgToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
          tgToast === 'ok'    ? 'bg-green-500 text-white' :
          tgToast === 'error' ? 'bg-red-500 text-white'   :
                                'bg-gray-800 text-white'
        }`}>
          {tgToast === 'sending' && <svg className="animate-spin flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
          {tgToast === 'ok'      && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          {tgToast === 'error'   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
          {tgToast === 'sending' && 'Надсилаємо дизайнеру…'}
          {tgToast === 'ok'      && 'Успішно надіслано дизайнеру ✓'}
          {tgToast === 'error'   && "Помилка відправки — перевірте з'єднання"}
        </div>
      )}
    </div>
  )
}
