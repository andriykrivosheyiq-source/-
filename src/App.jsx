import React, { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './services/firebase'
import Sidebar from './components/Sidebar'
import CreateDesign from './pages/CreateDesign'
import DesignPlacement from './pages/DesignPlacement'
import MyOrders from './pages/MyOrders'
import Templates from './pages/Templates'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'

// Strip undefined values so Firestore doesn't reject the document
function clean(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function AppInner() {
  const navigate = useNavigate()
  const [designData, setDesignData] = useState(null)
  const [savedOrders, setSavedOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  // In-memory: full images + designSnapshot (too large for Firestore)
  const orderExtras = useRef({})

  // Real-time listener — all team members see the same kanban
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const orders = snap.docs
          .map(d => d.data())
          .sort((a, b) => (b._createdAt || 0) - (a._createdAt || 0))
        setSavedOrders(orders)
        setOrdersLoading(false)
      },
      (err) => {
        console.error('Firestore sync error:', err)
        setOrdersLoading(false)
      }
    )
    return unsub
  }, [])

  const handleSaveOrder = async (order, extras) => {
    if (extras) orderExtras.current[order.id] = extras
    try {
      await setDoc(doc(db, 'orders', order.id), clean({ ...order, _createdAt: Date.now() }))
    } catch (e) {
      console.error('Save order failed:', e)
    }
  }

  const handleUpdateOrder = async (id, changes) => {
    try {
      await updateDoc(doc(db, 'orders', id), clean(changes))
    } catch (e) {
      console.error('Update order failed:', e)
    }
  }

  const handleUpdateOrderFull = async (id, changes, extras) => {
    if (extras) orderExtras.current[id] = extras
    try {
      await updateDoc(doc(db, 'orders', id), clean(changes))
    } catch (e) {
      console.error('Update order full failed:', e)
    }
  }

  const handleDeleteOrder = async (id) => {
    delete orderExtras.current[id]
    try {
      await deleteDoc(doc(db, 'orders', id))
    } catch (e) {
      console.error('Delete order failed:', e)
    }
  }

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
                ordersLoading={ordersLoading}
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
