import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { DialogProvider } from './context/DialogContext.jsx' // <-- 1. Import Provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DialogProvider> {/* <-- 2. Bungkus App di sini */}
      <App />
    </DialogProvider>
  </React.StrictMode>,
)