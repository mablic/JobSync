import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import { useToast } from '../../toast/Toast'
import { trackAuth, trackError } from '../../utils/analytics'

const SignUp = () => {
  const { theme } = useTheme()
  const { updateAuthState } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const showToast = useToast()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  
  const [agreements, setAgreements] = useState({
    termsAgreed: false,
    privacyAgreed: false,
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // Handle terms/privacy agreement from navigation state
  useEffect(() => {
    if (location.state?.termsAgreed === true) {
      setAgreements(prev => ({ ...prev, termsAgreed: true }))
    }
    if (location.state?.privacyAgreed === true) {
      setAgreements(prev => ({ ...prev, privacyAgreed: true }))
    }
    // Restore form data if coming back from terms/privacy
    if (location.state?.formData) {
      setFormData(location.state.formData)
    }
    // Clear the navigation state after reading it
    if (location.state) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAgreementChange = (e) => {
    const { name, checked } = e.target
    setAgreements(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match!', 'error')
      return
    }
    
    // Check if terms and privacy are agreed
    if (!agreements.termsAgreed || !agreements.privacyAgreed) {
      showToast('Please agree to Terms of Service and Privacy Policy', 'warning')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { registerUser, getCurrentUser } = await import('../../lib/users.js')
      
      const result = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      })
      
      // Update global auth state
      const currentUser = await getCurrentUser()
      await updateAuthState(currentUser)
      
      // Track successful sign up
      trackAuth('email', 'sign_up')
      
      
      // Show success message
      showToast('🎉 Account created successfully! Check your profile for your unique email.', 'success', 4000)
      
      navigate('/profile')
      
    } catch (error) {
      console.error('Error during signup:', error)
      
      // Track sign up error
      trackError(error.message, 'sign_up')
      
      if (error.code === 'auth/email-already-in-use') {
        showToast('This email is already registered. Please sign in instead.', 'error')
      } else if (error.code === 'auth/weak-password') {
        showToast('Password is too weak. Please use at least 6 characters.', 'warning')
      } else {
        showToast('Error creating account: ' + error.message, 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    
    try {
      const { signInWithGoogle, getCurrentUser } = await import('../../lib/users.js')
      const result = await signInWithGoogle()
      
      // Update global auth state
      const currentUser = await getCurrentUser()
      await updateAuthState(currentUser)
      
      
      // Show success message
      showToast('🎉 Welcome to JobSync! Check your profile for your unique email.', 'success', 4000)
      
      navigate('/profile')
      
    } catch (error) {
      console.error('Error with Google sign up:', error)
      
      if (error.code === 'auth/popup-closed-by-user') {
        setIsLoading(false)
        return
      }
      showToast('Error signing up with Google: ' + error.message, 'error')
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
            Create your account
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.text.secondary }}>
            Start tracking your job applications effortlessly
          </p>
        </div>

        {/* Sign Up Form */}
        <div 
          className="rounded-2xl shadow-xl p-8 border"
          style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.border.light
          }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                  color: theme.text.primary,
                  focusRingColor: theme.primary[500]
                }}
                placeholder="John Doe"
              />
            </div>

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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
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

            {/* Terms and Privacy Agreement */}
            <div className="space-y-4">
              {/* Terms of Service Checkbox */}
              <div className="flex items-start gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="termsAgreed"
                    name="termsAgreed"
                    checked={agreements.termsAgreed}
                    onChange={handleAgreementChange}
                    className="w-5 h-5 rounded border-2 focus:ring-2 focus:ring-offset-2 transition-all"
                    style={{
                      backgroundColor: agreements.termsAgreed ? theme.primary[600] : theme.background.secondary,
                      borderColor: agreements.termsAgreed ? theme.primary[600] : theme.border.medium,
                      focusRingColor: theme.primary[500]
                    }}
                  />
                  {agreements.termsAgreed && (
                    <svg 
                      className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <label 
                    htmlFor="termsAgreed" 
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: theme.text.primary }}
                  >
                    I agree to the{' '}
                    <Link 
                      to="/terms" 
                      className="underline hover:opacity-80 transition-opacity"
                      style={{ color: theme.primary[600] }}
                    >
                      Terms of Service
                    </Link>
                  </label>
                </div>
              </div>

              {/* Privacy Policy Checkbox */}
              <div className="flex items-start gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="privacyAgreed"
                    name="privacyAgreed"
                    checked={agreements.privacyAgreed}
                    onChange={handleAgreementChange}
                    className="w-5 h-5 rounded border-2 focus:ring-2 focus:ring-offset-2 transition-all"
                    style={{
                      backgroundColor: agreements.privacyAgreed ? theme.primary[600] : theme.background.secondary,
                      borderColor: agreements.privacyAgreed ? theme.primary[600] : theme.border.medium,
                      focusRingColor: theme.primary[500]
                    }}
                  />
                  {agreements.privacyAgreed && (
                    <svg 
                      className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <label 
                    htmlFor="privacyAgreed" 
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: theme.text.primary }}
                  >
                    I agree to the{' '}
                    <Link 
                      to="/privacy" 
                      className="underline hover:opacity-80 transition-opacity"
                      style={{ color: theme.primary[600] }}
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!agreements.termsAgreed || !agreements.privacyAgreed || isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: (agreements.termsAgreed && agreements.privacyAgreed) ? theme.gradients.primary : theme.border.medium,
                focusRingColor: theme.primary[500]
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  {(agreements.termsAgreed && agreements.privacyAgreed) 
                    ? 'Create Account' 
                    : 'Please Agree to Terms & Privacy'}
                </>
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

            {/* Google Sign Up */}
            <div className="mt-6">
              <button 
                type="button"
                onClick={handleGoogleSignUp}
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
                    Signing up...
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

        {/* Sign In Link */}
        <p className="text-center text-sm" style={{ color: theme.text.secondary }}>
          Already have an account?{' '}
          <Link 
            to="/Sign_In" 
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: theme.primary[600] }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp

