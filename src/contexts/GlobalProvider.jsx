import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, getCurrentUserData, signOut as firebaseSignOut } from '../lib/users'

// Create contexts
const AuthContext = createContext()

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within GlobalProvider')
  }
  return context
}

// Global Provider Component
export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication state on mount and persist across page refreshes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        
        if (currentUser) {
          // User is signed in
          setUser(currentUser)
          setIsAuthenticated(true)
          
          // Fetch user data from Firestore
          const data = await getCurrentUserData(currentUser.uid)
          setUserData(data)
        } else {
          // User is not signed in
          setUser(null)
          setUserData(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking auth state:', error)
        setUser(null)
        setUserData(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut()
      setUser(null)
      setUserData(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Update user data after sign in/sign up
  const updateAuthState = async (firebaseUser) => {
    try {
      setUser(firebaseUser)
      setIsAuthenticated(true)
      
      const data = await getCurrentUserData(firebaseUser.uid)
      setUserData(data)
    } catch (error) {
      console.error('Error updating auth state:', error)
    }
  }

  // Refresh user data (useful after profile updates)
  const refreshUserData = async () => {
    try {
      if (user) {
        const data = await getCurrentUserData(user.uid)
        setUserData(data)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const value = {
    user,
    userData,
    loading,
    isAuthenticated,
    signOut,
    updateAuthState,
    refreshUserData,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default GlobalProvider

