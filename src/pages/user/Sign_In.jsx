import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import { useToast } from '../../toast/Toast'
import { trackAuth, trackError } from '../../utils/analytics'

const SignIn = () => {
  const { theme } = useTheme()
  const { updateAuthState } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { signInUser, getCurrentUser } = await import('../../lib/users.js')
      await signInUser(formData.email, formData.password)
      
      // Update global auth state
      const currentUser = await getCurrentUser()
      await updateAuthState(currentUser)
      
      // Track successful sign in
      trackAuth('email', 'sign_in')
      
      console.log('User signed in successfully')
      navigate('/profile')
      
    } catch (error) {
      console.error('Error during signin:', error)
      
      // Track sign in error
      trackError(error.message, 'sign_in')
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        showToast('Invalid email or password. Please try again.', 'error')
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'warning')
      } else {
        showToast('Error signing in: ' + error.message, 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    
    try {
      const { signInWithGoogle, getCurrentUser } = await import('../../lib/users.js')
      const result = await signInWithGoogle()
      
      // Update global auth state
      const currentUser = await getCurrentUser()
      await updateAuthState(currentUser)
      
      console.log('Google sign in successful:', result)
      
      // Show user their forwarding email if they're new
      if (result.emailCode) {
        showToast('Welcome to JobSync! Check your profile for your unique email.', 'success', 4000)
      }
      
      navigate('/profile')
      
    } catch (error) {
      console.error('Error with Google sign in:', error)
      
      if (error.code === 'auth/popup-closed-by-user') {
        setIsLoading(false)
        return
      }
      showToast('Error signing in with Google: ' + error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: theme.gradients.subtle }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ background: theme.gradients.primary }}
            >
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold" style={{ color: theme.text.primary }}>
            Welcome back
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.text.secondary }}>
            Sign in to access your application dashboard
          </p>
        </div>

        {/* Sign In Form */}
        <div 
          className="rounded-2xl shadow-xl p-8 border"
          style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.border.light
          }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                  color: theme.text.primary,
                  focusRingColor: theme.primary[500]
                }}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                  color: theme.text.primary,
                  focusRingColor: theme.primary[500]
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm" style={{ color: theme.text.primary }}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  to="/Forgot_PW" 
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: theme.primary[600] }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: theme.gradients.primary,
                focusRingColor: theme.primary[500]
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ backgroundColor: theme.background.primary, color: theme.text.tertiary }}>Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <div className="mt-6">
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-lg border text-sm font-medium transition-all hover:opacity-80 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: theme.border.medium,
                  backgroundColor: theme.background.primary,
                  color: theme.text.primary
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" style={{ color: theme.text.primary }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm" style={{ color: theme.text.secondary }}>
          Don't have an account?{' '}
          <Link 
            to="/Sign_Up" 
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: theme.primary[600] }}
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignIn

