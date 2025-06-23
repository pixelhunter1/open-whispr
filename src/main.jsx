import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ControlPanel from './components/ControlPanel.tsx'
import './index.css'

// Check if this is the control panel window
const isControlPanel = window.location.pathname.includes('control') || 
                      window.location.search.includes('panel=true');

const AppComponent = isControlPanel ? ControlPanel : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>,
)
