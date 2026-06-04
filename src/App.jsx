import React, { useState, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import CreateDesign from './pages/CreateDesign'
import DesignPlacement from './pages/DesignPlacement'
import MyOrders from './pages/MyOrders'
import Templates from './pages/Templates'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'

const STORAGE_KEY = 'aidesign_orders'

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}
function saveOrdersToStorage(orders) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)) } catch {}
}

function AppInner() {
  const navigate = useNavigate()
  const [designData, setDesignData] = useState(null)
  const [savedOrders, setSavedOrders] = useState(loadOrders)
  // In-memory: full images + designData for orders saved this session
  const orderExtras = useRef({}) // { [orderId]: { fullImage, designSnapshot } }

  const handleSaveOrder = (order, extras) => {
    if (extras) orderExtras.current[order.id] = extras
    setSavedOrders(prev => {
      const updated = [order, ...prev]
      saveOrdersToStorage(updated)
      return updated
    })
  }

  const handleUpdateOrder = (id, changes) => {
    setSavedOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, ...changes } : o)
      saveOrdersToStorage(updated)
      return updated
    })
  }

  const handleDeleteOrder = (id) => {
    delete orderExtras.current[id]
    setSavedOrders(prev => {
      const updated = prev.filter(o => o.id !== id)
      saveOrdersToStorage(updated)
      return updated
    })
  }

  // Update existing order in-place (image + snapshot + metadata)
  const handleUpdateOrderFull = (id, changes, extras) => {
    if (extras) orderExtras.current[id] = extras
    setSavedOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, ...changes } : o)
      saveOrdersToStorage(updated)
      return updated
    })
  }

  // Restore design from saved order and navigate to placement
  const handleOpenOrder = (orderId) => {
    const extras = orderExtras.current[orderId]
    const snapshot = extras?.designSnapshot || {}
    setDesignData({ ...snapshot, editingOrderId: orderId })
    navigate('/placement')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/create" element={<CreateDesign onGenerate={setDesignData} />} />
          <Route
            path="/placement"
            element={
              <DesignPlacement
                designData={designData}
                onUpdate={(upd) => setDesignData(prev => ({ ...prev, ...upd }))}
                onSaveOrder={handleSaveOrder}
                onUpdateOrderFull={handleUpdateOrderFull}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <MyOrders
                savedOrders={savedOrders}
                orderExtras={orderExtras.current}
                onUpdateOrder={handleUpdateOrder}
                onDeleteOrder={handleDeleteOrder}
                onOpenOrder={handleOpenOrder}
              />
            }
          />
          <Route path="/templates" element={<Templates />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <AppInner />
}
