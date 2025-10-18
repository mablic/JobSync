import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import { useToast } from '../../toast/Toast'

const Profile = () => {
  const { theme } = useTheme()
  const { user, userData, loading, isAuthenticated, refreshUserData } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/Sign_In')
    }
  }, [loading, isAuthenticated, navigate])

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('../../lib/users.js')
      await signOut()
      showToast('Signed out successfully', 'success')
      navigate('/Sign_In')
    } catch (error) {
      console.error('Error signing out:', error)
      showToast('Error signing out: ' + error.message, 'error')
    }
  }

  const copyEmailToClipboard = () => {
    const email = userData?.forwardingEmail || ''
    navigator.clipboard.writeText(email)
    showToast('Email copied to clipboard!', 'success')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      showToast('Passwords do not match', 'error')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    
    setIsChangingPassword(true)
    
    try {
      const { changePassword } = await import('../../lib/users.js')
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      
      showToast('Password changed successfully!', 'success')
      
      // Reset form and close section
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordSection(false)
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      })
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect')
        showToast('Current password is incorrect', 'error')
      } else {
        setPasswordError(error.message)
        showToast(error.message, 'error')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: theme.primary[600], borderTopColor: 'transparent' }}></div>
          <p style={{ color: theme.text.secondary }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: theme.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold" style={{ color: theme.text.primary }}>
              Welcome back, {userData?.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-xl font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: theme.background.primary,
                color: theme.text.secondary,
                border: `1px solid ${theme.border.medium}`
              }}
            >
              Sign Out
            </button>
          </div>
          <p className="text-lg" style={{ color: theme.text.secondary }}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Email Forwarding Card - Full Width */}
        <div 
          className="mb-8 rounded-2xl shadow-xl p-8 border-2"
          style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.primary[200],
            background: theme.gradients.card
          }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: theme.primary[100] }}
            >
              <svg className="w-8 h-8" style={{ color: theme.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ color: theme.text.primary }}>
                Your Magic Email ✨
              </h2>
              <p className="text-base mt-1" style={{ color: theme.text.tertiary }}>
                Forward all job-related emails here and we'll track them automatically
              </p>
            </div>
          </div>

          {/* Email Display Section */}
          <div 
            className="p-8 rounded-2xl mb-6 border-2"
            style={{ 
              backgroundColor: theme.background.secondary,
              borderColor: theme.primary[300],
              borderStyle: 'dashed'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.text.tertiary }}>
                Your Unique Email Address
              </p>
            </div>
            <code 
              className="text-3xl sm:text-4xl font-mono font-bold block mb-6 break-all" 
              style={{ color: theme.primary[600] }}
            >
              {userData?.forwardingEmail || 'Loading...'}
            </code>
            <button
              onClick={copyEmailToClipboard}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg active:scale-95"
              style={{
                background: theme.gradients.primary,
                color: theme.text.inverse
              }}
            >
              📋 Copy Email Address
            </button>
          </div>

          {/* Pro Tip */}
          <div 
            className="p-5 rounded-xl flex items-start gap-3"
            style={{ 
              backgroundColor: theme.primary[50],
              border: `1px solid ${theme.primary[200]}`
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme.primary[800] }}>
                💡 How it works
              </p>
              <p className="text-sm leading-relaxed" style={{ color: theme.primary[700] }}>
                When you receive emails about your job applications (confirmations, interview invitations, rejections, etc.), 
                simply forward them to your email address above. Our AI will automatically read and track your application status!
              </p>
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div 
          className="mb-8 rounded-2xl shadow-xl p-8 border"
          style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.border.light
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: theme.secondary[100] }}
            >
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ color: theme.text.primary }}>
                Account Information
              </h2>
              <p className="text-base mt-1" style={{ color: theme.text.tertiary }}>
                Your profile details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div 
              className="p-5 rounded-xl"
              style={{ backgroundColor: theme.background.secondary }}
            >
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: theme.text.tertiary }}>
                Full Name
              </p>
              <p className="text-xl font-semibold" style={{ color: theme.text.primary }}>
                {userData?.name || 'Not set'}
              </p>
            </div>

            {/* Email */}
            <div 
              className="p-5 rounded-xl"
              style={{ backgroundColor: theme.background.secondary }}
            >
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: theme.text.tertiary }}>
                Email Address
              </p>
              <p className="text-xl font-semibold" style={{ color: theme.text.primary }}>
                {userData?.email || 'Not set'}
              </p>
            </div>

            {/* Member Since */}
            <div 
              className="p-5 rounded-xl md:col-span-2"
              style={{ backgroundColor: theme.background.secondary }}
            >
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: theme.text.tertiary }}>
                Member Since
              </p>
              <p className="text-xl font-semibold" style={{ color: theme.text.primary }}>
                {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section - Only for email/password users */}
        {userData?.authProvider !== 'google' && (
          <div 
            className="mb-8 rounded-2xl shadow-xl p-8 border"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: theme.secondary[100] }}
                >
                  <span className="text-3xl">🔐</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: theme.text.primary }}>
                    Security
                  </h2>
                  <p className="text-base mt-1" style={{ color: theme.text.tertiary }}>
                    Manage your account security
                  </p>
                </div>
              </div>
            </div>

            {!showPasswordSection ? (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="w-full p-6 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ 
                  borderColor: theme.border.medium,
                  backgroundColor: theme.background.secondary
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.primary[100] }}
                    >
                      <svg className="w-6 h-6" style={{ color: theme.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg" style={{ color: theme.text.primary }}>
                        Change Password
                      </h3>
                      <p className="text-sm" style={{ color: theme.text.secondary }}>
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <svg className="w-6 h-6" style={{ color: theme.text.tertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ) : (
              <div 
                className="p-6 rounded-xl border-2"
                style={{ 
                  borderColor: theme.primary[200],
                  backgroundColor: theme.background.secondary
                }}
              >
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                        className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 focus:outline-none transition-all"
                        style={{
                          backgroundColor: theme.background.primary,
                          borderColor: theme.border.medium,
                          color: theme.text.primary
                        }}
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-opacity-10 transition-all"
                        style={{ color: theme.text.tertiary }}
                      >
                        {showPasswords.current ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 focus:outline-none transition-all"
                        style={{
                          backgroundColor: theme.background.primary,
                          borderColor: theme.border.medium,
                          color: theme.text.primary
                        }}
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-opacity-10 transition-all"
                        style={{ color: theme.text.tertiary }}
                      >
                        {showPasswords.new ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 focus:outline-none transition-all"
                        style={{
                          backgroundColor: theme.background.primary,
                          borderColor: passwordError ? theme.status.rejected : theme.border.medium,
                          color: theme.text.primary
                        }}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-opacity-10 transition-all"
                        style={{ color: theme.text.tertiary }}
                      >
                        {showPasswords.confirm ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-sm font-medium mt-2 flex items-center gap-1" style={{ color: theme.status.rejected }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: theme.primary[50] }}
                    >
                      <p className="text-xs font-medium mb-2" style={{ color: theme.text.primary }}>
                        Password Strength:
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className="h-1.5 flex-1 rounded-full transition-all"
                            style={{
                              backgroundColor: passwordData.newPassword.length >= level * 2
                                ? passwordData.newPassword.length >= 8
                                  ? theme.status.offer
                                  : passwordData.newPassword.length >= 6
                                  ? theme.status.underReview
                                  : theme.status.rejected
                                : theme.border.light
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: theme.gradients.primary,
                        color: theme.text.inverse
                      }}
                    >
                      {isChangingPassword ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordSection(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                        setPasswordError('')
                        setShowPasswords({
                          current: false,
                          new: false,
                          confirm: false
                        })
                      }}
                      disabled={isChangingPassword}
                      className="px-8 py-3.5 rounded-xl font-semibold transition-all hover:opacity-80"
                      style={{
                        backgroundColor: theme.background.primary,
                        color: theme.text.secondary,
                        border: `2px solid ${theme.border.medium}`
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-6 rounded-xl border transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.primary[100] }}
              >
                <span className="text-3xl">📊</span>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-lg mb-0.5" style={{ color: theme.text.primary }}>
                  View Dashboard
                </h4>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  See all applications
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={copyEmailToClipboard}
            className="p-6 rounded-xl border transition-all hover:shadow-lg hover:scale-105 active:scale-95"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.secondary[100] }}
              >
                <span className="text-3xl">📧</span>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-lg mb-0.5" style={{ color: theme.text.primary }}>
                  Copy Email
                </h4>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  Quick copy code
                </p>
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}

export default Profile
