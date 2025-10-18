import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../App'
import { useAuth } from '../contexts/GlobalProvider'
import logo from '../assets/logo.png'

const Nav = () => {
  const location = useLocation()
  const { isAuthenticated, userData } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, isDarkMode, toggleTheme } = useTheme()

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard', requireAuth: true },
    { path: '/about', label: 'About' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav 
      className="sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300" 
      style={{ 
        backgroundColor: `${theme.background.primary}CC`, // Semi-transparent
        borderColor: theme.border.light,
        boxShadow: `0 1px 3px 0 ${theme.border.light}33`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group transition-all duration-200 hover:scale-105"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:shadow-lg overflow-hidden"
              style={{ 
                backgroundColor: theme.background.primary,
                border: `2px solid ${theme.border.light}`
              }}
            >
              <img 
                src={logo} 
                alt="JobSync Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xl font-bold" style={{ color: theme.text.primary }}>JobSync</span>
              <p className="text-xs -mt-1" style={{ color: theme.text.tertiary }}>JobSync.fyi</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Navigation Links */}
            <div className="flex items-center space-x-1 mr-6">
              {navLinks.map((link) => {
                if (link.requireAuth && !isAuthenticated) return null
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{ 
                      color: isActive(link.path) ? theme.text.primary : theme.text.secondary,
                      backgroundColor: isActive(link.path) ? theme.background.secondary : 'transparent'
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 relative group"
                  >
                    {link.label}
                    {isActive(link.path) && (
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                        style={{ backgroundColor: theme.primary[600] }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl transition-all duration-200 hover:scale-110 group"
              style={{ backgroundColor: theme.background.secondary }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.text.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.text.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Auth Section */}
            <div className="flex items-center space-x-3 ml-4">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 group"
                  style={{ backgroundColor: theme.background.secondary }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold transition-all duration-200 group-hover:shadow-lg"
                    style={{ background: theme.gradients.primary }}
                  >
                    {userData?.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-lg font-medium block" style={{ color: theme.text.primary }}>{userData?.name || 'User'}</span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/Sign_In"
                    className="px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105"
                    style={{ 
                      color: theme.text.secondary,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.border.medium}`
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/Sign_Up"
                    className="px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    style={{ 
                      background: theme.gradients.primary,
                      color: theme.text.inverse
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 rounded-xl transition-all duration-200 hover:scale-110"
            style={{ 
              color: theme.text.primary, 
              backgroundColor: theme.background.secondary 
            }}
          >
            <svg
              className="w-6 h-6 transition-transform duration-200"
              style={{ transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden border-t transition-all duration-300" 
            style={{ 
              borderColor: theme.border.light, 
              backgroundColor: theme.background.primary 
            }}
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              {/* Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link) => {
                  if (link.requireAuth && !isAuthenticated) return null
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ 
                        color: isActive(link.path) ? theme.text.primary : theme.text.secondary,
                        backgroundColor: isActive(link.path) ? theme.background.secondary : 'transparent'
                      }}
                      className="block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200"
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full px-4 py-3 text-left rounded-xl font-medium transition-all duration-200"
                style={{ 
                  color: theme.text.primary,
                  backgroundColor: theme.background.secondary,
                  border: `1px solid ${theme.border.medium}`
                }}
              >
                <div className="flex items-center space-x-3">
                  {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
              </button>

              {/* Auth Section */}
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-4 py-3 text-center block rounded-xl font-medium transition-all duration-200"
                  style={{ 
                    background: theme.gradients.primary,
                    color: theme.text.inverse
                  }}
                >
                  My Profile
                </Link>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/Sign_In"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-center block rounded-xl font-medium transition-all duration-200"
                    style={{ 
                      color: theme.text.primary,
                      backgroundColor: theme.background.secondary,
                      border: `1px solid ${theme.border.medium}`
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/Sign_Up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-center block rounded-xl font-medium transition-all duration-200 shadow-lg"
                    style={{ 
                      background: theme.gradients.primary,
                      color: theme.text.inverse
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Nav