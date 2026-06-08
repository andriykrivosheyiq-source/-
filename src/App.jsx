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

  if (extras.transparentImage) {
    try {
      fields._transparentImageUrl = await uploadImageToCloudinary(
        extras.transparentImage,
        `transparent_${id.replace(/^#/, '')}`
      )
    } catch (e) {
      console.error('Cloudinary transparentImage upload failed:', e)
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
            // Don't fall back to base64 — Firestore has 1MB doc limit.
            // Use fullImageUrl as a rough substitute so the design is at least visible.
            return { ...d, image: fields._fullImageUrl || null }
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
  const [designData, setDesignData] = useState(() => {
    try {
      const s = sessionStorage.getItem('currentDesign')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })
  const [savedOrders, setSavedOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  // In-memory cache; also populated from Firestore (_fullImageUrl, _designSnapshot) on load
  const orderExtras = useRef({})

  // As soon as Gemini returns base64 images, upload them to Cloudinary in the background.
  // This converts designData.generatedDesigns from large base64 → short URLs so that
  // sessionStorage (and later Firestore) never has to store heavy data.
  const generatedDesigns = designData?.generatedDesigns
  useEffect(() => {
    if (!generatedDesigns?.some(d => d.image?.startsWith('data:'))) return
    let cancelled = false
    Promise.all(
      generatedDesigns.map(async (d) => {
        if (!d.image?.startsWith('data:')) return d
        try {
          const url = await uploadImageToCloudinary(d.image, `gen_${Date.now()}`)
          return { ...d, image: url }
        } catch { return d }
      })
    ).then(uploaded => {
      if (!cancelled) {
        // Only update if at least one image was successfully converted (avoids infinite loop
        // when all uploads fail: catch { return d } returns the same object reference, so
        // if nothing changed, don't call setDesignData — that would create a new array reference
        // and re-trigger this effect forever).
        const anyChanged = uploaded.some((d, i) => d !== generatedDesigns[i])
        if (anyChanged) {
          setDesignData(prev => prev ? { ...prev, generatedDesigns: uploaded } : prev)
        }
      }
    })
    return () => { cancelled = true }
  }, [generatedDesigns])

  // Keep sessionStorage in sync so reloading the page restores the current design.
  useEffect(() => {
    if (designData) {
      try { sessionStorage.setItem('currentDesign', JSON.stringify(designData)) } catch {}
    } else {
      sessionStorage.removeItem('currentDesign')
    }
  }, [designData])

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
              transparentImage: order._transparentImageUrl || null,
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
    // If an order with this ID already exists, save the new one as a duplicate (don't overwrite)
    let finalOrder = order
    const conflict = savedOrders.find(o => o.id === order.id)
    if (conflict) {
      const dupSuffix = `_д${String(Date.now()).slice(-3)}`
      finalOrder = { ...order, id: order.id + dupSuffix, isDuplicate: true }
    }

    if (extras) orderExtras.current[finalOrder.id] = extras
    const persisted = await persistExtras(finalOrder.id, extras)
    if (persisted._fullImageUrl && orderExtras.current[finalOrder.id]) {
      orderExtras.current[finalOrder.id].fullImage = persisted._fullImageUrl
    }
    if (persisted._transparentImageUrl && orderExtras.current[finalOrder.id]) {
      orderExtras.current[finalOrder.id].transparentImage = persisted._transparentImageUrl
    }
    try {
      await setDoc(doc(db, 'orders', finalOrder.id), clean({ ...finalOrder, _createdAt: Date.now(), ...persisted }))
    } catch (e) {
      console.error('Save order failed:', e)
    }
    return finalOrder.id
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
    if (persisted._transparentImageUrl && orderExtras.current[id]) {
      orderExtras.current[id].transparentImage = persisted._transparentImageUrl
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

  const handleRenameOrder = async (oldId, newId) => {
    if (!newId || newId === oldId) return
    const order = savedOrders.find(o => o.id === oldId)
    if (!order) return
    try {
      await setDoc(doc(db, 'orders', newId), clean({ ...order, id: newId }))
      if (orderExtras.current[oldId]) {
        orderExtras.current[newId] = orderExtras.current[oldId]
        delete orderExtras.current[oldId]
      }
      await deleteDoc(doc(db, 'orders', oldId))
    } catch (e) {
      console.error('Rename order failed:', e)
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
                onRenameOrder={handleRenameOrder}
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

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch(e) {
    console.error('App crash:', e)
    sessionStorage.removeItem('currentDesign')
  }
  render() {
    if (this.state.crashed) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16 }}>
        <p style={{ fontSize:18, color:'#374151' }}>Щось пішло не так. Оновіть сторінку.</p>
        <button onClick={() => window.location.reload()} style={{ padding:'10px 24px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:15 }}>
          Оновити
        </button>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>
}
