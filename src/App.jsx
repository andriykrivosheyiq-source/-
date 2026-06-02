import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import CreateDesign from './pages/CreateDesign'
import DesignPlacement from './pages/DesignPlacement'
import MyOrders from './pages/MyOrders'
import Templates from './pages/Templates'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'

export default function App() {
  const [designData, setDesignData] = useState(null)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/create" element={<CreateDesign onGenerate={setDesignData} />} />
          <Route path="/placement" element={<DesignPlacement designData={designData} onUpdate={(upd) => setDesignData(prev => ({ ...prev, ...upd }))} />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
