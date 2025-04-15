import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';


createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="1027457104294-tdi9e35eo0u6nv3vn7ugju8lkh6no0qn.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>,
)
