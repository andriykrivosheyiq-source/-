import React, { useState } from 'react'

export default function Settings() {
  const [name, setName] = useState('Ірина')
  const [email, setEmail] = useState('iryna@example.com')
  const [lang, setLang] = useState('uk')
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Налаштування</h1>
        <p className="text-sm text-gray-500 mt-0.5">Керуйте своїм обліковим записом</p>
      </div>

      <div className="px-8 py-6 max-w-lg mx-auto space-y-5">
        {/* Profile */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Профіль</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
              І
            </div>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
              Змінити аватар
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Ім'я</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Налаштування</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Мова</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="uk">Українська</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Сповіщення</p>
                <p className="text-xs text-gray-400 mt-0.5">Отримувати сповіщення про статус замовлень</p>
              </div>
              <button
                onClick={() => setNotifications((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`btn-primary w-full justify-center transition-all ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Збережено!
            </>
          ) : 'Зберегти зміни'}
        </button>
      </div>
    </div>
  )
}
