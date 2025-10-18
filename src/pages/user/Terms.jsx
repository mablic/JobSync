import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../App'

const Terms = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  
  // Check if user came from signup page
  const fromSignup = location.state?.from === 'signup'

  const handleScroll = (e) => {
    const element = e.target
    const bottom = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 10
    if (bottom) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAgree = () => {
    if (fromSignup) {
      // Preserve other agreements and form data when returning
      const currentAgreements = location.state?.currentAgreements || {}
      const savedFormData = location.state?.formData || {}
      navigate('/Sign_Up', { 
        state: { 
          termsAgreed: true,
          privacyAgreed: currentAgreements.privacyAgreed || false,
          formData: savedFormData
        } 
      })
    } else {
      navigate('/Sign_Up')
    }
  }

  const handleDisagree = () => {
    if (fromSignup) {
      const savedFormData = location.state?.formData || {}
      const currentAgreements = location.state?.currentAgreements || {}
      navigate('/Sign_Up', { 
        state: { 
          termsAgreed: false,
          privacyAgreed: currentAgreements.privacyAgreed || false,
          formData: savedFormData
        } 
      })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      {/* Header */}
      <section className="py-12 sticky top-0 z-10 backdrop-blur-md border-b" style={{ backgroundColor: `${theme.background.primary}F0`, borderColor: theme.border.light }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text.primary }}>
                Terms of Service
              </h1>
              <p className="text-sm mt-1" style={{ color: theme.text.tertiary }}>
                Last updated: January 2024
              </p>
            </div>
            <Link 
              to="/" 
              className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ 
                color: theme.text.secondary,
                backgroundColor: theme.background.secondary
              }}
            >
              ← Back
            </Link>
          </div>
        </div>
      </section>

      {/* Content with sticky progress */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Indicator */}
          {fromSignup && !hasScrolledToBottom && (
            <div 
              className="mb-6 p-4 rounded-xl border flex items-start gap-3 animate-pulse"
              style={{ 
                backgroundColor: `${theme.primary[50]}`,
                borderColor: theme.primary[200]
              }}
            >
              <svg 
                className="w-5 h-5 flex-shrink-0 mt-0.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: theme.primary[600] }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium" style={{ color: theme.primary[800] }}>
                  Please read the full Terms of Service
                </p>
                <p className="text-xs mt-1" style={{ color: theme.primary[700] }}>
                  Scroll to the bottom to enable the "I Agree" button
                </p>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div 
            className="rounded-2xl shadow-lg border overflow-auto"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light,
              maxHeight: '60vh'
            }}
            onScroll={handleScroll}
          >
            <div className="p-8 space-y-8">
              
              {/* Section 1 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>1</span>
                  Acceptance of Terms
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  By accessing and using JobSync ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>2</span>
                  Description of Service
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  JobSync is an AI-powered job application tracking service that allows users to forward emails from companies and automatically track their job application status. Our service processes email content to extract relevant information about job applications.
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>3</span>
                  User Accounts
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  To use our service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </p>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>4</span>
                  Email Forwarding and Data Collection
                </h2>
                <div className="space-y-3">
                  <p style={{ color: theme.text.secondary }}>
                    <strong>To use our service, you must provide us with:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                    <li><strong>Your email address</strong> - Required for account creation and receiving notifications</li>
                    <li><strong>A unique forwarding email address</strong> - We will provide you with a unique JobSync email address (e.g., yourname@jobflow.com) where you can forward job application emails</li>
                  </ul>
                  <p style={{ color: theme.text.secondary }}>
                    When you forward emails to your unique JobSync address, you grant us permission to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                    <li><strong>Receive and store forwarded emails</strong> - We collect all emails you forward to your JobSync address</li>
                    <li><strong>Process and analyze email content</strong> - Using AI technology to extract job application information</li>
                    <li><strong>Extract sender email addresses</strong> - To identify companies and track application sources</li>
                    <li><strong>Store extracted data</strong> - Including company names, job titles, application status, and other relevant information</li>
                    <li><strong>Send you notifications</strong> - About application updates to your registered email address</li>
                  </ul>
                  <p style={{ color: theme.text.secondary }}>
                    We are committed to protecting your privacy and will never share your personal information or email content with third parties without your explicit consent.
                  </p>
                </div>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>5</span>
                  Data Security
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  We implement industry-standard security measures to protect your data, including encryption in transit and at rest. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>6</span>
                  AI Processing
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  Our AI system analyzes email content to determine job application status. While we strive for accuracy, AI processing may occasionally misinterpret information. Users are encouraged to review and correct any inaccuracies in their application data.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>7</span>
                  Service Availability
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>8</span>
                  User Responsibilities
                </h2>
                <div className="space-y-3">
                  <p style={{ color: theme.text.secondary }}>You agree to:</p>
                  <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                    <li>Only forward emails related to your own job applications</li>
                    <li>Not use the service for any illegal or unauthorized purpose</li>
                    <li>Not attempt to gain unauthorized access to our systems</li>
                    <li>Respect the intellectual property rights of others</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </div>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>9</span>
                  Limitation of Liability
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  JobSync shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service, including but not limited to loss of data, loss of opportunities, or business interruption.
                </p>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>10</span>
                  Termination
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  Either party may terminate this agreement at any time. Upon termination, your right to use the service will cease immediately. We will provide you with a reasonable opportunity to export your data before account deletion.
                </p>
              </div>

              {/* Section 11 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>11</span>
                  Changes to Terms
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </div>

              {/* Section 12 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>12</span>
                  Contact Information
                </h2>
                <p className="mb-4 leading-relaxed" style={{ color: theme.text.secondary }}>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
              </div>

              {/* End marker */}
              <div 
                className="p-4 rounded-lg text-center border-2 border-dashed"
                style={{ borderColor: theme.border.medium }}
              >
                <p className="text-sm font-medium" style={{ color: theme.text.tertiary }}>
                  End of Terms of Service
                </p>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          {fromSignup && (
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDisagree}
                className="flex-1 px-6 py-3 rounded-xl font-medium transition-all border"
                style={{ 
                  borderColor: theme.border.medium,
                  color: theme.text.secondary,
                  backgroundColor: theme.background.primary
                }}
              >
                I Disagree
              </button>
              <button
                onClick={handleAgree}
                disabled={!hasScrolledToBottom}
                className="flex-1 px-6 py-3 rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: hasScrolledToBottom ? theme.gradients.primary : theme.border.medium,
                  color: theme.text.inverse
                }}
              >
                {hasScrolledToBottom ? 'I Agree to Terms' : 'Please Read to Continue'}
              </button>
            </div>
          )}

          {!fromSignup && (
            <div className="mt-8 text-center">
              <Link
                to="/"
                className="inline-block px-8 py-3 text-lg font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                style={{ 
                  background: theme.gradients.primary,
                  color: theme.text.inverse
                }}
              >
                Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Terms
