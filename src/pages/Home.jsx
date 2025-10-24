import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../App'

const Home = () => {
  const { theme } = useTheme()
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email Forwarding',
      description: 'Simply forward company response emails to our system. No manual data entry required.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Analysis',
      description: 'Our AI reads and understands email content to track your application status automatically.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Automatic Tracking',
      description: 'Applications are tracked and updated in real-time. Say goodbye to Excel and Notion spreadsheets.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Apply to Jobs',
      description: 'Continue your normal job application process',
    },
    {
      number: '02',
      title: 'Forward Emails',
      description: 'Forward response emails from companies to your unique JobSync address',
    },
    {
      number: '03',
      title: 'AI Processing',
      description: 'Our AI analyzes the email and extracts key information automatically',
    },
    {
      number: '04',
      title: 'Track Progress',
      description: 'View your applications dashboard with real-time status updates',
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32" style={{ background: theme.gradients.hero }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo Section */}
            <div className="mb-12 flex justify-center">
              <img 
                src="/src/assets/logo.png" 
                alt="JobSync Logo" 
                className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl shadow-2xl"
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight" style={{ color: theme.text.primary }}>
              Stop Tracking Job Applications
              <span className="block mt-2" style={{ background: theme.gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Let AI Do It For You
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl" style={{ color: theme.text.secondary }}>
              Forward your job application emails and watch as AI automatically tracks, organizes, and updates your job search progress.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/Sign_Up"
                className="px-8 py-4 text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl text-center"
                style={{ 
                  background: theme.gradients.primary,
                  color: theme.text.inverse
                }}
              >
                Get Started at JobSync.fyi
              </Link>
              <Link
                to="/about"
                className="px-8 py-4 text-lg font-semibold rounded-xl transition-all shadow-md border text-center hover:opacity-80"
                style={{ 
                  color: theme.text.primary,
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.light
                }}
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Dashboard Preview - Sample Application Tracker */}
          <div className="mt-16 relative">
            <div 
              className="absolute inset-0 rounded-2xl blur-3xl opacity-30"
              style={{ background: theme.gradients.primary }}
            ></div>
            <div 
              className="relative rounded-2xl shadow-2xl p-8 border"
              style={{ 
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.light
              }}
            >
              {/* Stats Cards Preview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div 
                  className="rounded-2xl p-4 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.primary[100] }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary[600] }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold" style={{ color: theme.text.primary }}>24</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: theme.text.secondary }}>Total Applications</p>
                </div>

                <div 
                  className="rounded-2xl p-4 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.status.offer + '20' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.status.offer }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold" style={{ color: theme.text.primary }}>3</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: theme.text.secondary }}>Updated Today</p>
                </div>

                <div 
                  className="rounded-2xl p-4 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.secondary[100] }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.secondary[600] }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold" style={{ color: theme.text.primary }}>18</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: theme.text.secondary }}>Active</p>
                </div>

                <div 
                  className="rounded-2xl p-4 shadow-sm border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.status.interview + '20' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.status.interview }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold" style={{ color: theme.text.primary }}>5</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: theme.text.secondary }}>Interviews</p>
                </div>
              </div>
                
              {/* Sample Company Cards */}
              <div className="space-y-4">
                {[
                  {
                    company: 'Google',
                    logo: 'G',
                    location: 'Mountain View, CA',
                    roles: [
                      { title: 'Senior Software Engineer', status: 'Interview', statusColor: theme.status.interview, salary: '$150k-$200k', location: 'Remote', date: '2 days ago' }
                    ]
                  },
                  {
                    company: 'Meta',
                    logo: 'M',
                    location: 'Menlo Park, CA',
                    roles: [
                      { title: 'Frontend Developer', status: 'Screening', statusColor: theme.status.underReview, salary: '$140k-$180k', location: 'Hybrid', date: '5 days ago' }
                    ]
                  },
                  {
                    company: 'Apple',
                    logo: 'A',
                    location: 'Cupertino, CA',
                    roles: [
                      { title: 'iOS Engineer', status: 'Applied', statusColor: theme.status.applied, salary: '$160k-$200k', location: 'On-site', date: '1 week ago' }
                    ]
                  }
                ].map((company, companyIndex) => (
                  <div 
                    key={companyIndex}
                    className="rounded-xl shadow-md border"
                    style={{ 
                      backgroundColor: theme.background.primary,
                      borderColor: theme.border.light
                    }}
                  >
                    {/* Company Header */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: theme.border.light }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                          style={{ 
                            backgroundColor: theme.primary[600],
                            color: theme.text.inverse
                          }}
                        >
                          {company.logo}
                        </div>
                        <div>
                          <h3 className="text-base font-bold" style={{ color: theme.text.primary }}>
                            {company.company}
                          </h3>
                          <p className="text-xs" style={{ color: theme.text.tertiary }}>
                            {company.location} • {company.roles.length} {company.roles.length === 1 ? 'Role' : 'Roles'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Company Roles */}
                    {company.roles.map((role, roleIndex) => (
                      <div key={roleIndex} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <svg 
                            className="w-4 h-4"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            style={{ color: theme.text.tertiary }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-4">
                              <h4 className="text-sm font-semibold mb-1" style={{ color: theme.text.primary }}>
                                {role.title}
                              </h4>
                              <span 
                                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: role.statusColor + '20', 
                                  color: role.statusColor 
                                }}
                              >
                                {role.status}
                              </span>
                            </div>
                            <div className="col-span-3 text-xs" style={{ color: theme.text.secondary }}>
                              {role.salary}
                            </div>
                            <div className="col-span-3 text-xs" style={{ color: theme.text.secondary }}>
                              {role.location}
                            </div>
                            <div className="col-span-2 text-xs text-right" style={{ color: theme.text.secondary }}>
                              {role.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" style={{ backgroundColor: theme.background.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text.primary }}>
              Effortless Application Tracking
            </h2>
            <p className="mt-4 text-xl" style={{ color: theme.text.secondary }}>
              No more manual updates, no more forgotten applications
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl hover:shadow-lg transition-all border"
                style={{ 
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.light
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ 
                    background: theme.gradients.primary,
                    color: theme.text.inverse
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>
                  {feature.title}
                </h3>
                <p style={{ color: theme.text.secondary }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ background: theme.gradients.subtle }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text.primary }}>
              How It Works
            </h2>
            <p className="mt-4 text-xl" style={{ color: theme.text.secondary }}>
              Four simple steps to organized job tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold mb-4"
                    style={{ 
                      background: theme.gradients.primary,
                      color: theme.text.inverse
                    }}
                  >
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
                    {step.title}
                  </h3>
                  <p className="text-sm" style={{ color: theme.text.secondary }}>{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className="hidden lg:block absolute top-8 left-full w-full h-0.5 -z-10"
                    style={{ backgroundColor: theme.border.medium }}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ background: theme.gradients.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: theme.text.inverse }}>
            Ready to Simplify Your Job Search?
          </h2>
          <p className="text-xl mb-8" style={{ color: theme.primary[100] }}>
            Join hundreds of job seekers who are tracking their applications effortlessly
          </p>
          <Link
            to="/Sign_Up"
            className="inline-block px-8 py-4 text-lg font-semibold rounded-xl transition-all shadow-lg hover:opacity-90"
            style={{ 
              backgroundColor: theme.background.primary,
              color: theme.primary[600]
            }}
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home