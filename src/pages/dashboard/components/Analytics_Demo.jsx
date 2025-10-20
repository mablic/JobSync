import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../../App'

const AnalyticsDemo = () => {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent" 
            style={{ backgroundImage: theme.gradients.primary }}>
            Data-Driven Job Search
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: theme.text.secondary }}>
            Turn your job search into actionable insights. See what works, improve your strategy, and land your dream job faster.
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
            <div className="p-6">
              {/* Activity Trends */}
              <div>
                <h3 className="text-xl font-semibold mb-6" style={{ color: theme.text.primary }}>Activity Trends</h3>
                <div className="h-64 rounded-xl overflow-hidden" style={{ backgroundColor: theme.background.secondary }}>
                  <div className="h-full flex items-end p-4 gap-2">
                    {[30, 45, 60, 90, 75, 85, 70].map((height, i) => (
                      <div 
                        key={i} 
                        className="flex-1 rounded-t-sm transition-all"
                        style={{ 
                          height: `${height}%`,
                          backgroundColor: theme.primary[600],
                          opacity: 0.8
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm" style={{ color: theme.text.tertiary }}>
                  <span>Last 7 Days</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary[600] }}></span>
                    <span>Application Activity</span>
                  </div>
                </div>
              </div>

              {/* Stage Distribution, Funnel and Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Stage Distribution Pie Chart */}
                <div 
                  className="rounded-2xl p-6 shadow-lg border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <h3 className="text-xl font-bold mb-6" style={{ color: theme.text.primary }}>Stage Distribution</h3>
                  <div className="relative">
                    <svg width="100%" height="240" viewBox="0 0 240 240">
                      {(() => {
                        const data = [
                          { stage: "Applied", count: 120, color: theme.primary[600] },
                          { stage: "Screening", count: 85, color: theme.secondary[600] },
                          { stage: "Interview", count: 45, color: theme.status.interview },
                          { stage: "Offer", count: 12, color: theme.status.offer },
                          { stage: "Rejected", count: 15, color: theme.status.rejected }
                        ]

                        const total = data.reduce((sum, item) => sum + item.count, 0)
                        const centerX = 120
                        const centerY = 120
                        const radius = 80

                        let startAngle = -90 // Start from top
                        return data.map((item, i) => {
                          const percentage = (item.count / total) * 100
                          const angle = (percentage / 100) * 360
                          const endAngle = startAngle + angle

                          // Calculate path
                          const startRad = (startAngle * Math.PI) / 180
                          const endRad = (endAngle * Math.PI) / 180
                          const x1 = centerX + radius * Math.cos(startRad)
                          const y1 = centerY + radius * Math.sin(startRad)
                          const x2 = centerX + radius * Math.cos(endRad)
                          const y2 = centerY + radius * Math.sin(endRad)
                          const largeArcFlag = angle > 180 ? 1 : 0

                          // Calculate label position
                          const labelRad = (startAngle + angle / 2) * Math.PI / 180
                          const labelX = centerX + (radius + 30) * Math.cos(labelRad)
                          const labelY = centerY + (radius + 30) * Math.sin(labelRad)

                          const path = [
                            'M', centerX, centerY,
                            'L', x1, y1,
                            'A', radius, radius, 0, largeArcFlag, 1, x2, y2,
                            'Z'
                          ].join(' ')

                          startAngle += angle

                          return (
                            <g key={item.stage}>
                              <path
                                d={path}
                                fill={item.color}
                                stroke={theme.background.primary}
                                strokeWidth="2"
                              />
                              <line
                                x1={x2}
                                y1={y2}
                                x2={labelX}
                                y2={labelY}
                                stroke={item.color}
                                strokeWidth="2"
                                opacity="0.5"
                              />
                              <text
                                x={labelX + (labelX > centerX ? 5 : -5)}
                                y={labelY}
                                textAnchor={labelX > centerX ? "start" : "end"}
                                alignmentBaseline="middle"
                                fontSize="12"
                                fill={theme.text.primary}
                              >
                                {item.stage} ({percentage.toFixed(1)}%)
                              </text>
                            </g>
                          )
                        })
                      })()}
                      {/* Center circle */}
                      <circle
                        cx="120"
                        cy="120"
                        r="40"
                        fill={theme.background.primary}
                        stroke={theme.border.light}
                      />
                      <text
                        x="120"
                        y="115"
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="bold"
                        fill={theme.text.primary}
                      >
                        277
                      </text>
                      <text
                        x="120"
                        y="135"
                        textAnchor="middle"
                        fontSize="12"
                        fill={theme.text.secondary}
                      >
                        Total
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Application Funnel */}
                <div 
                  className="rounded-2xl p-6 shadow-lg border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <h3 className="text-xl font-bold mb-6" style={{ color: theme.text.primary }}>Application Funnel</h3>
                  <div className="space-y-4">
                    {[
                      { stage: "Applied", count: 120, percent: 100, color: theme.primary[600] },
                      { stage: "Screening", count: 85, percent: 71, color: theme.secondary[600] },
                      { stage: "Interview", count: 45, percent: 38, color: theme.status.interview },
                      { stage: "Offer", count: 12, percent: 10, color: theme.status.offer }
                    ].map((stage, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: theme.text.primary }}>{stage.stage}</span>
                          <div className="flex items-center gap-3">
                            <span style={{ color: theme.text.secondary }}>{stage.count}</span>
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: stage.color + '20', color: stage.color }}
                            >
                              {stage.percent}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.background.secondary }}>
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${stage.percent}%`,
                              backgroundColor: stage.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Heatmap */}
                <div 
                  className="rounded-2xl p-6 shadow-lg border"
                  style={{ 
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.light
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>Activity Heatmap</h3>
                        <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
                          Last 12 weeks
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>84</div>
                        <div className="text-xs" style={{ color: theme.text.secondary }}>total activities</div>
                      </div>
                    </div>

                    <div className="w-full flex gap-0.5 justify-center">
                      {Array.from({ length: 12 }, (_, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-0.5 flex-1">
                          {Array.from({ length: 7 }, (_, dayIndex) => {
                            const intensity = Math.random()
                            const hasActivity = intensity > 0.7
                            
                            return (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className="w-full aspect-square rounded-sm border group relative cursor-pointer transition-transform hover:scale-125"
                                style={{
                                  backgroundColor: hasActivity ? '#3b82f6' : theme.background.secondary,
                                  opacity: hasActivity ? (intensity * 0.6 + 0.4) : 0.3,
                                  borderColor: theme.border.light
                                }}
                              />
                            )
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs" style={{ color: theme.text.tertiary }}>
                      <span>3 months ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Analysis */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-6" style={{ color: theme.text.primary }}>Role Analysis</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {[
                    {
                      title: "Most Applied Roles",
                      data: [
                        { label: "Software Engineer", value: 45, highlight: "32% Success" },
                        { label: "Full Stack Developer", value: 38, highlight: "28% Success" },
                        { label: "Frontend Engineer", value: 25, highlight: "35% Success" }
                      ]
                    },
                    {
                      title: "Top Companies",
                      data: [
                        { label: "Google", value: 8, highlight: "2 Interviews" },
                        { label: "Microsoft", value: 6, highlight: "1 Offer" },
                        { label: "Amazon", value: 5, highlight: "In Progress" }
                      ]
                    },
                    {
                      title: "Response Time",
                      data: [
                        { label: "Same Day", value: "35%", highlight: "↑ 5%" },
                        { label: "Within Week", value: "45%", highlight: "↑ 10%" },
                        { label: "Over Week", value: "20%", highlight: "↓ 15%" }
                      ]
                    }
                  ].map((section, i) => (
                    <div 
                      key={i}
                      className="rounded-xl p-6"
                      style={{ backgroundColor: theme.background.secondary }}
                    >
                      <h4 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>{section.title}</h4>
                      <div className="space-y-4">
                        {section.data.map((item, j) => (
                          <div key={j} className="flex items-center justify-between">
                            <span style={{ color: theme.text.secondary }}>{item.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-medium" style={{ color: theme.text.primary }}>{item.value}</span>
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: theme.primary[100],
                                  color: theme.primary[600]
                                }}
                              >
                                {item.highlight}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                Try Analytics Free
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: "📈",
              title: "Activity Tracking",
              description: "Monitor your daily application activity and spot trends in your job search"
            },
            {
              icon: "🎯",
              title: "Application Funnel",
              description: "See how your applications progress through each stage of the hiring process"
            },
            {
              icon: "⚡️",
              title: "Response Analysis",
              description: "Track company response times and optimize your follow-up strategy"
            },
            {
              icon: "🔍",
              title: "Role Insights",
              description: "Discover which job titles and companies yield the best results"
            },
            {
              icon: "📊",
              title: "Success Metrics",
              description: "Track your interview success rate and offer conversion rate"
            },
            {
              icon: "🎨",
              title: "Beautiful Visualizations",
              description: "Understand your data with clear, interactive charts and graphs"
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
              Ready to Optimize Your Job Search?
            </h2>
            <p className="text-lg mb-8" style={{ color: `${theme.text.inverse}CC` }}>
              Get actionable insights and improve your application success rate
            </p>
            <Link
              to="/Sign_Up"
              className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: theme.text.inverse,
                color: theme.primary[600]
              }}
            >
              Start Free Analysis
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

export default AnalyticsDemo