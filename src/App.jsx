import React, { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './services/firebase'
import { uploadImageToCloudinary } from './services/imageUpload'
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

// Upload base64 images in extras to Cloudinary; return Firestore-safe fields.
async function persistExtras(id, extras) {
  if (!extras) return {}
  const fields = {}

  if (extras.fullImage) {
    try {
      fields._fullImageUrl = await uploadImageToCloudinary(
        extras.fullImage,
        `full_${id.replace(/^#/, '')}`
      )
    } catch (e) {
      console.error('Cloudinary fullImage upload failed:', e)
    }
  }

  if (extras.designSnapshot) {
    const snap = { ...extras.designSnapshot }
    if (snap.generatedDesigns?.length) {
      snap.generatedDesigns = await Promise.all(
        snap.generatedDesigns.map(async (d) => {
          if (!d.image || !d.image.startsWith('data:')) return d
          try {
            const url = await uploadImageToCloudinary(
              d.image,
              `design_${id.replace(/^#/, '')}`
            )
            return { ...d, image: url }
          } catch {
            return d
          }
        })
      )
    }
    fields._designSnapshot = snap
  }

  return fields
}

function AppInner() {
  const navigate = useNavigate()
  const [designData, setDesignData] = useState(null)
  const [savedOrders, setSavedOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  // In-memory cache; also populated from Firestore (_fullImageUrl, _designSnapshot) on load
  const orderExtras = useRef({})

  // Real-time listener — all team members see the same kanban
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const orders = snap.docs
          .map(d => d.data())
          .sort((a, b) => (b._createdAt || 0) - (a._createdAt || 0))

        // Restore extras from Firestore for orders not already in session memory
        for (const order of orders) {
          if (!orderExtras.current[order.id] && (order._fullImageUrl || order._designSnapshot)) {
            orderExtras.current[order.id] = {
              fullImage: order._fullImageUrl || null,
              designSnapshot: order._designSnapshot || {},
            }
          }
        }

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
    const persisted = await persistExtras(order.id, extras)
    // Keep session extras in sync with persisted URLs
    if (persisted._fullImageUrl && orderExtras.current[order.id]) {
      orderExtras.current[order.id].fullImage = persisted._fullImageUrl
    }
    try {
      await setDoc(doc(db, 'orders', order.id), clean({ ...order, _createdAt: Date.now(), ...persisted }))
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
    const persisted = await persistExtras(id, extras)
    if (persisted._fullImageUrl && orderExtras.current[id]) {
      orderExtras.current[id].fullImage = persisted._fullImageUrl
    }
    try {
      await updateDoc(doc(db, 'orders', id), clean({ ...changes, ...persisted }))
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
