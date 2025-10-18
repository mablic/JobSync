import React, { useState, createContext, useContext, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { colors } from './theme/Theme'
import { GlobalProvider } from './contexts/GlobalProvider'
import { ToastProvider } from './toast/Toast'
import { trackPageView } from './utils/analytics'
import Nav from './nav/Nav'
import Home from './pages/Home'
import About from './pages/About'
import Terms from './pages/user/terms'
import Privacy from './pages/user/Privacy'
import SignIn from './pages/user/Sign_In'
import SignUp from './pages/user/Sign_Up'
import Forgot_PW from './pages/user/Forgot_PW'
import Profile from './pages/user/Profile'
import TrackerMain from './pages/dashboard/Dashboard_Main'

// Theme Context
const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname, document.title)
  }, [location])

  return null
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const theme = isDarkMode ? colors.dark : colors.light

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <GlobalProvider>
      <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
        <ToastProvider>
          <Router>
            <AnalyticsTracker />
            <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
              <Nav />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/Sign_In" element={<SignIn />} />
                <Route path="/Sign_Up" element={<SignUp />} />
                <Route path="/Forgot_PW" element={<Forgot_PW />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<TrackerMain />} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </ThemeContext.Provider>
    </GlobalProvider>
  )
}

export default App
