import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../App'

const Privacy = () => {
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
          privacyAgreed: true,
          termsAgreed: currentAgreements.termsAgreed || false,
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
          privacyAgreed: false,
          termsAgreed: currentAgreements.termsAgreed || false,
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
                Privacy Policy
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

      {/* Content */}
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
                  Please read the full Privacy Policy
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
              
              {/* Introduction */}
              <div>
                <p className="leading-relaxed text-lg" style={{ color: theme.text.secondary }}>
                  At JobSync, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully.
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>1</span>
                  Information We Collect
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: theme.text.primary }}>Personal Information You Provide</h3>
                    <p className="leading-relaxed mb-2" style={{ color: theme.text.secondary }}>
                      We collect information that you provide directly to us, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-1" style={{ color: theme.text.secondary }}>
                      <li><strong>Your email address</strong> - Required for account creation, authentication, and sending you notifications about your job applications</li>
                      <li><strong>Name</strong> - To personalize your experience</li>
                      <li><strong>Account credentials</strong> - Username and password for secure access</li>
                      <li><strong>Profile information</strong> - Optional information you choose to add to your profile</li>
                      <li><strong>Communication preferences</strong> - Your notification and email preferences</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: theme.text.primary }}>Email Content and Forwarded Emails</h3>
                    <p className="leading-relaxed mb-2" style={{ color: theme.text.secondary }}>
                      <strong>This is a core part of our service:</strong> When you forward job application emails to your unique JobSync email address, we collect and process:
                    </p>
                    <ul className="list-disc pl-6 space-y-1" style={{ color: theme.text.secondary }}>
                      <li><strong>Complete email content</strong> - The full text, HTML, and attachments of forwarded emails</li>
                      <li><strong>Sender email addresses</strong> - Company email addresses to identify job application sources</li>
                      <li><strong>Email metadata</strong> - Subject lines, dates, timestamps, and email headers</li>
                      <li><strong>Extracted information</strong> - Job titles, company names, application status, salary information, and other job-related details extracted by our AI</li>
                      <li><strong>Your forwarding email address</strong> - To confirm the source of forwarded emails</li>
                    </ul>
                    <p className="leading-relaxed mt-2 text-sm p-3 rounded-lg" style={{ color: theme.text.primary, backgroundColor: theme.background.secondary }}>
                      <strong>Important:</strong> By using JobSync, you acknowledge that we will receive, store, and process all emails you forward to your JobSync address. Only forward emails you're comfortable sharing with us.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: theme.text.primary }}>Automatically Collected Information</h3>
                    <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                      We automatically collect certain information about your device and how you interact with our service, including:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1" style={{ color: theme.text.secondary }}>
                      <li>IP address and location data</li>
                      <li>Browser type and version</li>
                      <li>Operating system</li>
                      <li>Device information</li>
                      <li>Usage patterns and interaction data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>2</span>
                  How We Use Your Information
                </h2>
                <p className="leading-relaxed mb-3" style={{ color: theme.text.secondary }}>
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process and analyze forwarded emails to track job applications</li>
                  <li>Send you notifications and updates about your applications</li>
                  <li>Communicate with you about our services</li>
                  <li>Detect, prevent, and address technical issues and security threats</li>
                  <li>Comply with legal obligations</li>
                  <li>Improve our AI algorithms and service features</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>3</span>
                  Information Sharing and Disclosure
                </h2>
                <div className="space-y-4">
                  <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                    We do not sell your personal information. We may share your information in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                    <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf, such as cloud hosting and data analytics</li>
                    <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid requests by public authorities</li>
                    <li><strong>Business Transfers:</strong> We may share or transfer information in connection with a merger, sale, or acquisition</li>
                    <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
                  </ul>
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>4</span>
                  Data Security
                </h2>
                <p className="leading-relaxed mb-3" style={{ color: theme.text.secondary }}>
                  We implement appropriate technical and organizational measures to protect your personal information, including:
                </p>
                <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure data centers and infrastructure</li>
                </ul>
                <p className="leading-relaxed mt-3" style={{ color: theme.text.secondary }}>
                  However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>5</span>
                  Data Retention
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. You may request deletion of your account and associated data at any time through your account settings.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>6</span>
                  Your Rights and Choices
                </h2>
                <p className="leading-relaxed mb-3" style={{ color: theme.text.secondary }}>
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2" style={{ color: theme.text.secondary }}>
                  <li><strong>Access:</strong> You can request access to your personal information</li>
                  <li><strong>Correction:</strong> You can update or correct your information through your account settings</li>
                  <li><strong>Deletion:</strong> You can request deletion of your account and data</li>
                  <li><strong>Export:</strong> You can export your application data at any time</li>
                  <li><strong>Opt-out:</strong> You can opt-out of marketing communications</li>
                </ul>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>7</span>
                  Cookies and Tracking Technologies
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  We use cookies and similar tracking technologies to collect and track information about your use of our service. You can control cookies through your browser settings, but disabling cookies may limit some features of our service.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>8</span>
                  Children's Privacy
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </div>

              {/* Section 9 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>9</span>
                  International Data Transfers
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
                </p>
              </div>

              {/* Section 10 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>10</span>
                  Changes to This Privacy Policy
                </h2>
                <p className="leading-relaxed" style={{ color: theme.text.secondary }}>
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date. We encourage you to review this privacy policy periodically.
                </p>
              </div>

              {/* Section 11 */}
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold" style={{ backgroundColor: theme.primary[100], color: theme.primary[700] }}>11</span>
                  Contact Us
                </h2>
                <p className="mb-4 leading-relaxed" style={{ color: theme.text.secondary }}>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
              </div>

              {/* End marker */}
              <div 
                className="p-4 rounded-lg text-center border-2 border-dashed"
                style={{ borderColor: theme.border.medium }}
              >
                <p className="text-sm font-medium" style={{ color: theme.text.tertiary }}>
                  End of Privacy Policy
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
                {hasScrolledToBottom ? 'I Agree to Privacy Policy' : 'Please Read to Continue'}
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

export default Privacy

