import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../App'

const About = () => {
  const { theme } = useTheme()
  const techStack = [
    {
      category: 'Email Processing',
      items: [
        { name: 'Email Server', description: 'Secure email receiving and parsing' },
        { name: 'SMTP/IMAP', description: 'Industry-standard email protocols' },
      ],
    },
    {
      category: 'AI Analysis',
      items: [
        { name: 'Natural Language Processing', description: 'Understanding email content and context' },
        { name: 'Machine Learning', description: 'Pattern recognition for application status' },
      ],
    },
    {
      category: 'Data Management',
      items: [
        { name: 'Real-time Updates', description: 'Instant synchronization across devices' },
        { name: 'Secure Storage', description: 'Encrypted data protection' },
      ],
    },
  ]

  const statusTypes = [
    { status: 'Applied', color: theme.status.applied, description: 'Initial application submitted' },
    { status: 'Under Review', color: theme.status.underReview, description: 'Application being reviewed' },
    { status: 'Interview Scheduled', color: theme.status.interview, description: 'Interview stage reached' },
    { status: 'Offer Received', color: theme.status.offer, description: 'Job offer extended' },
    { status: 'Rejected', color: theme.status.rejected, description: 'Application unsuccessful' },
    { status: 'Withdrawn', color: theme.status.withdrawn, description: 'Candidate withdrew' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      {/* Hero Section */}
      <section className="py-20" style={{ background: theme.gradients.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: theme.text.inverse }}>
            About JobSync
          </h1>
          <p className="text-xl" style={{ color: theme.primary[100] }}>
            Revolutionizing job application tracking with AI-powered automation
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16" style={{ backgroundColor: theme.background.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold mb-6" style={{ color: theme.text.primary }}>Our Mission</h2>
            <p className="text-lg leading-relaxed mb-4" style={{ color: theme.text.secondary }}>
              Job hunting is stressful enough without having to maintain complex spreadsheets or Notion databases. 
              We believe that tracking your applications should be as simple as forwarding an email.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: theme.text.secondary }}>
              JobSync was built to eliminate the manual labor of application tracking, letting you focus on 
              what really matters: preparing for interviews and landing your dream job.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Technically */}
      <section className="py-16" style={{ background: theme.gradients.subtle }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: theme.text.primary }}>
            The Technology Behind It
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {techStack.map((tech, index) => (
              <div 
                key={index} 
                className="rounded-2xl p-8 shadow-md"
                style={{ backgroundColor: theme.background.primary }}
              >
                <h3 
                  className="text-xl font-semibold mb-6 pb-3 border-b"
                  style={{ 
                    color: theme.text.primary,
                    borderColor: theme.border.light
                  }}
                >
                  {tech.category}
                </h3>
                <div className="space-y-4">
                  {tech.items.map((item, idx) => (
                    <div key={idx}>
                      <h4 className="font-medium mb-1" style={{ color: theme.text.primary }}>{item.name}</h4>
                      <p className="text-sm" style={{ color: theme.text.secondary }}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Process Flow */}
          <div 
            className="rounded-2xl p-8 shadow-md"
            style={{ backgroundColor: theme.background.primary }}
          >
            <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.text.primary }}>
              Email Processing Flow
            </h3>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { step: '1', title: 'Receive', desc: 'Email forwarded to your unique address' },
                { step: '2', title: 'Parse', desc: 'Extract sender, subject, and content' },
                { step: '3', title: 'Analyze', desc: 'AI determines job details and status' },
                { step: '4', title: 'Update', desc: 'Create or update application record' },
                { step: '5', title: 'Notify', desc: 'Alert you of status changes' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center mx-auto mb-3"
                    style={{ 
                      background: theme.gradients.primary,
                      color: theme.text.inverse
                    }}
                  >
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-1" style={{ color: theme.text.primary }}>{item.title}</h4>
                  <p className="text-xs" style={{ color: theme.text.secondary }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Status Types */}
      <section className="py-16" style={{ backgroundColor: theme.background.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: theme.text.primary }}>
            Application Status Detection
          </h2>
          <p className="text-center mb-8" style={{ color: theme.text.secondary }}>
            Our AI automatically categorizes your applications into these statuses:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
              {statusTypes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-xl transition-colors"
                  style={{ backgroundColor: theme.background.secondary }}
                >
                  <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                  <div>
                    <h4 className="font-semibold" style={{ color: theme.text.primary }}>{item.status}</h4>
                    <p className="text-sm" style={{ color: theme.text.secondary }}>{item.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-16" style={{ background: theme.gradients.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: theme.text.inverse }}>
            Security & Privacy First
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'End-to-End Encryption',
                description: 'All emails and data are encrypted in transit and at rest',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'GDPR Compliant',
                description: 'Full compliance with data protection regulations',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Your Data, Your Control',
                description: 'Export or delete your data anytime',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: theme.text.inverse
                  }}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text.inverse }}>{item.title}</h3>
                <p className="text-sm" style={{ color: theme.primary[100] }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: theme.background.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: theme.text.primary }}>
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8" style={{ color: theme.text.secondary }}>
            Join the future of job application tracking today
          </p>
          <Link
            to="/Sign_Up"
            className="inline-block px-8 py-4 text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            style={{ 
              background: theme.gradients.primary,
              color: theme.text.inverse
            }}
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  )
}

export default About

