import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../../App'

const DashboardDemo = () => {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent" 
            style={{ backgroundImage: theme.gradients.primary }}>
            Your Job Search, Organized
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: theme.text.secondary }}>
            Track your job applications automatically with AI-powered email processing. 
            Get insights, stay organized, and land your dream job faster.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/Sign_Up"
              className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105"
              style={{ 
                background: theme.gradients.primary,
                color: theme.text.inverse
              }}
            >
              Get Started Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-105 border"
              style={{ 
                color: theme.text.primary,
                borderColor: theme.border.medium
              }}
            >
              See Demo
            </a>
          </div>
        </div>

        {/* Interactive Demo */}
        <div id="demo" className="mb-16">
          <div 
            className="rounded-2xl border overflow-hidden relative"
            style={{ 
              backgroundColor: theme.background.primary, 
              borderColor: theme.border.light
            }}
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              <div 
                className="rounded-2xl p-6 shadow-sm border"
                style={{ 
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.light
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.primary[100] }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary[600] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>15</span>
                </div>
                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Total Applications</p>
              </div>

              <div 
                className="rounded-2xl p-6 shadow-sm border"
                style={{ 
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.light
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.status.interview + '20' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.status.interview }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>3</span>
                </div>
                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Interviews</p>
              </div>

              <div 
                className="rounded-2xl p-6 shadow-sm border"
                style={{ 
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.light
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.status.offer + '20' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.status.offer }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>1</span>
                </div>
                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Job Offers</p>
              </div>

              <div 
                className="rounded-2xl p-6 shadow-sm border"
                style={{ 
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.light
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.primary[100] }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary[600] }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>5</span>
                </div>
                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Companies</p>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search applications..."
                    className="pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none w-full"
                    style={{
                      backgroundColor: theme.background.primary,
                      borderColor: theme.border.medium,
                      color: theme.text.primary
                    }}
                  />
                  <svg
                    className="absolute left-3 top-3 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: theme.text.tertiary }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                    Sort by:
                  </span>
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium"
                    style={{
                      backgroundColor: theme.background.primary,
                      borderColor: theme.border.medium,
                      color: theme.text.primary,
                      minWidth: '200px'
                    }}
                  >
                    <span className="text-base">📅</span>
                    <span className="flex-1 text-left">Applied Date</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filters */}
            <div className="px-6 pb-6">
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'active', label: 'Active', count: 12 },
                  { key: 'today', label: '📬 Updated Today', count: 3, highlight: true },
                  { key: 'all', label: 'All', count: 15 },
                  { key: 'applied', label: 'Applied', count: 8 },
                  { key: 'screening', label: 'Screening', count: 3 },
                  { key: 'interview', label: 'Interviews', count: 3 },
                  { key: 'offer', label: 'Offers', count: 1 },
                  { key: 'rejected', label: 'Rejected', count: 2 }
                ].map((filter) => {
                  const isHighlighted = filter.highlight
                  const isSelected = filter.key === 'active'
                  
                  return (
                    <button
                      key={filter.key}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        isSelected ? 'text-white shadow-lg' : 'border'
                      } ${isHighlighted ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: isSelected 
                          ? theme.primary[600]
                          : (isHighlighted ? theme.status.offer + '10' : 'transparent'),
                        borderColor: isSelected 
                          ? theme.primary[600]
                          : (isHighlighted ? theme.status.offer : theme.border.medium),
                        color: isSelected 
                          ? theme.text.inverse 
                          : (isHighlighted ? theme.status.offer : theme.text.secondary)
                      }}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Company Cards */}
            <div className="px-6 pb-6 space-y-6">
              {[
                {
                  company: "Google",
                  logo: "G",
                  location: "Mountain View, CA",
                  roles: [
                    {
                      position: "Senior Software Engineer",
                      stage: "interview1",
                      location: "Remote",
                      salary: "$180k - $250k",
                      lastUpdated: "2 hours ago",
                      contact: "Maria Chen",
                      notes: "Technical interview scheduled with Engineering Lead"
                    },
                    {
                      position: "Staff Engineer",
                      stage: "screening",
                      location: "Mountain View, CA",
                      salary: "$220k - $300k",
                      lastUpdated: "1 day ago",
                      contact: "John Smith"
                    }
                  ]
                },
                {
                  company: "Microsoft",
                  logo: "M",
                  location: "Redmond, WA",
                  roles: [
                    {
                      position: "Principal Engineer",
                      stage: "applied",
                      location: "Hybrid",
                      salary: "$200k - $280k",
                      lastUpdated: "3 days ago"
                    }
                  ]
                }
              ].map((company, i) => (
                <div
                  key={i}
                  className="rounded-xl shadow-md border"
                  style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}
                >
                  <div className="p-6 border-b" style={{ borderColor: theme.border.light }}>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                        style={{ backgroundColor: theme.primary[600] }}
                      >
                        {company.logo}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>
                          {company.company}
                        </h3>
                        <p className="text-sm" style={{ color: theme.text.tertiary }}>
                          {company.location} • {company.roles.length} {company.roles.length === 1 ? 'Role' : 'Roles'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y" style={{ borderColor: theme.border.light }}>
                    {company.roles.map((role, j) => (
                      <div key={j} className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-base font-semibold" style={{ color: theme.text.primary }}>
                                {role.position}
                              </h4>
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: theme.status.interview + '20',
                                  color: theme.status.interview
                                }}
                              >
                                {role.stage === 'interview1' ? '1st Round' : 'Screening'}
                              </span>
                            </div>
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Salary
                                </p>
                                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                                  {role.salary}
                                </p>
                              </div>
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Location
                                </p>
                                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                                  {role.location}
                                </p>
                              </div>
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Contact
                                </p>
                                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                                  {role.contact || 'No contact'}
                                </p>
                              </div>
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Updated
                                </p>
                                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                                  {role.lastUpdated}
                                </p>
                              </div>
                            </div>
                            {role.notes && (
                              <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border.light }}>
                                <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.text.tertiary }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                  </svg>
                                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                                    {role.notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div 
              className="absolute inset-x-0 bottom-0 h-32 flex items-end justify-center pb-8"
              style={{ 
                background: theme.primary[600],
                color: theme.text.inverse
              }}
            >
              <Link
                to="/Sign_Up"
                className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: theme.text.inverse,
                  color: theme.primary[600]
                }}
              >
                Try It Free
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: "📧",
              title: "Email Integration",
              description: "Forward your job application emails and let our AI automatically organize everything"
            },
            {
              icon: "🤖",
              title: "AI Processing",
              description: "Smart detection of application status, interview invites, and important updates"
            },
            {
              icon: "📊",
              title: "Visual Timeline",
              description: "See your entire application journey with our beautiful, interactive timeline"
            },
            {
              icon: "📈",
              title: "Analytics Dashboard",
              description: "Get insights into your application success rate and interview performance"
            },
            {
              icon: "🔍",
              title: "Smart Search",
              description: "Quickly find any application with our powerful search and filtering"
            },
            {
              icon: "🔔",
              title: "Smart Notifications",
              description: "Get notified about interview invites, follow-ups, and important deadlines"
            }
          ].map((feature, i) => (
            <div 
              key={i}
              className="rounded-2xl p-8 border transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}
            >
              <span className="text-4xl mb-4 block">{feature.icon}</span>
              <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>{feature.title}</h3>
              <p style={{ color: theme.text.secondary }}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div 
          className="rounded-2xl p-12 text-center relative overflow-hidden"
          style={{ 
            backgroundColor: theme.primary[600]
          }}
        >
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4" style={{ color: theme.text.inverse }}>
              Ready to Organize Your Job Search?
            </h2>
            <p className="text-lg mb-8" style={{ color: `${theme.text.inverse}CC` }}>
              Join thousands of job seekers who've streamlined their application process
            </p>
            <Link
              to="/Sign_Up"
              className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: theme.text.inverse,
                color: theme.primary[600]
              }}
            >
              Get Started Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardDemo