import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import AnalyticsDemo from './components/Analytics_Demo'
import { getJobsByTrackingCode, transformJobsForDashboard } from '../../lib/jobs'

const Analytics = () => {
  const { theme } = useTheme()
  const { userData, isAuthenticated } = useAuth()
  const [companiesData, setCompaniesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch jobs data from Firebase
  useEffect(() => {
    const fetchJobs = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        setCompaniesData([])
        return
      }

      if (!userData?.emailCode) {
        setLoading(false)
        setError('No tracking code found. Please check your profile settings.')
        return
      }

      try {
        setLoading(true)
        setError(null)
        const jobs = await getJobsByTrackingCode(userData.emailCode)
        const transformedData = transformJobsForDashboard(jobs)
        setCompaniesData(transformedData)
      } catch (err) {
        setError('Failed to load analytics data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [userData, isAuthenticated])

  // Get all roles from companies data
  const allRoles = companiesData.flatMap(company => company.roles)

  // Helper function to get date from raw data
  const getDateFromRaw = (rawData, field = 'Applied_Date') => {
    if (!rawData?.[field]) return null
    return rawData[field].toDate ? rawData[field].toDate() : new Date(rawData[field])
  }

  // Data processing functions
  const processAnalyticsData = () => {
    if (allRoles.length === 0) return {}

    // Calculate response times
    const responseTimes = allRoles.reduce((acc, role) => {
      const appliedDate = getDateFromRaw(role.rawData, 'Applied_Date')
      if (!appliedDate) return acc

      // Find first response after application
      let firstResponse = null
      Object.values(role.stages).forEach(stage => {
        if (stage.emails) {
          stage.emails.forEach(email => {
            const emailDate = getDateFromRaw(email, 'date')
            if (emailDate && emailDate > appliedDate) {
              if (!firstResponse || emailDate < firstResponse) {
                firstResponse = emailDate
              }
            }
          })
        }
      })

      if (firstResponse) {
        const responseTime = firstResponse - appliedDate
        const days = Math.floor(responseTime / (1000 * 60 * 60 * 24))
        
        if (days === 0) acc.sameDay++
        else if (days <= 7) acc.withinWeek++
        else acc.overWeek++
        
        acc.total++
      }

      return acc
    }, { sameDay: 0, withinWeek: 0, overWeek: 0, total: 0 })

    // Stage distribution (pie chart)
    const stageDistribution = allRoles.reduce((acc, role) => {
      const stage = role.currentStage
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {})

    // Daily applications for line chart
    const dailyData = allRoles.reduce((acc, role) => {
      const date = getDateFromRaw(role.rawData)
      if (date) {
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
        if (!acc[dateKey]) {
          acc[dateKey] = {
            applications: 0,
            interviews: 0,
            offers: 0,
            rejections: 0
          }
        }
        acc[dateKey].applications += 1
        
        if (['interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6'].includes(role.currentStage)) {
          acc[dateKey].interviews += 1
        } else if (role.currentStage === 'offer') {
          acc[dateKey].offers += 1
        } else if (role.currentStage === 'rejected') {
          acc[dateKey].rejections += 1
        }
      }
      return acc
    }, {})

    // Monthly applications (for fallback)
    const monthlyData = allRoles.reduce((acc, role) => {
      const date = getDateFromRaw(role.rawData)
      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!acc[monthKey]) {
          acc[monthKey] = {
            applications: 0,
            interviews: 0,
            offers: 0,
            rejections: 0,
            date: new Date(date.getFullYear(), date.getMonth(), 1)
          }
        }
        acc[monthKey].applications += 1
        
        if (['interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6'].includes(role.currentStage)) {
          acc[monthKey].interviews += 1
        } else if (role.currentStage === 'offer') {
          acc[monthKey].offers += 1
        } else if (role.currentStage === 'rejected') {
          acc[monthKey].rejections += 1
        }
      }
      return acc
    }, {})

    // Exact role title analysis
    const exactRoleData = allRoles.reduce((acc, role) => {
      if (!role.position) return acc
      
      const position = role.position.trim()
      if (!acc[position]) {
        acc[position] = {
          total: 0,
          interviews: 0,
          offers: 0,
          rejections: 0
        }
      }
      acc[position].total += 1
      if (['interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6'].includes(role.currentStage)) {
        acc[position].interviews += 1
      } else if (role.currentStage === 'offer') {
        acc[position].offers += 1
      } else if (role.currentStage === 'rejected') {
        acc[position].rejections += 1
      }
      return acc
    }, {})

    // Company applications (bar chart)
    const companyData = companiesData.map(company => ({
      name: company.company,
      applications: company.roles.length,
      interviews: company.roles.filter(role => ['interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6'].includes(role.currentStage)).length,
      offers: company.roles.filter(role => role.currentStage === 'offer').length,
      rejections: company.roles.filter(role => role.currentStage === 'rejected').length
    })).sort((a, b) => b.applications - a.applications).slice(0, 10)

    // Application funnel
    const funnelData = {
      applied: stageDistribution.applied || 0,
      screening: stageDistribution.screening || 0,
      interview: (stageDistribution.interview1 || 0) + (stageDistribution.interview2 || 0) + (stageDistribution.interview3 || 0) + (stageDistribution.interview4 || 0) + (stageDistribution.interview5 || 0) + (stageDistribution.interview6 || 0),
      offer: stageDistribution.offer || 0,
      rejected: stageDistribution.rejected || 0
    }

    return {
      stageDistribution,
      dailyData,
      monthlyData,
      exactRoleData,
      companyData,
      funnelData,
      responseTimes: {
        sameDay: responseTimes.total > 0 ? (responseTimes.sameDay / responseTimes.total * 100).toFixed(1) : 0,
        withinWeek: responseTimes.total > 0 ? (responseTimes.withinWeek / responseTimes.total * 100).toFixed(1) : 0,
        overWeek: responseTimes.total > 0 ? (responseTimes.overWeek / responseTimes.total * 100).toFixed(1) : 0,
        total: responseTimes.total
      }
    }
  }

  const analyticsData = processAnalyticsData()

  // Application Funnel Component
  const ApplicationFunnel = ({ data }) => {
    const stages = [
      { stage: "Applied", count: data.applied || 0, color: theme.primary[600] },
      { stage: "Screening", count: data.screening || 0, color: theme.secondary[600] },
      { stage: "Interview", count: data.interview || 0, color: theme.status.interview },
      { stage: "Offer", count: data.offer || 0, color: theme.status.offer }
    ]

    const total = stages[0].count || 1 // Use first stage (Applied) as total
    
    return (
      <div className="space-y-4">
        {stages.map((stage, i) => {
          const percent = ((stage.count / total) * 100).toFixed(1)
          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: theme.text.primary }}>{stage.stage}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: theme.text.secondary }}>{stage.count}</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: stage.color + '20', color: stage.color }}
                  >
                    {percent}%
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.background.secondary }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: stage.color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Role Analysis Component
  const RoleAnalysis = ({ exactRoleData, companyData }) => {
    // Process role data
    const roleArray = Object.entries(exactRoleData)
      .map(([position, data]) => ({
        label: position,
        value: data.total,
        interviews: data.interviews,
        offers: data.offers
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Process company data
    const companyArray = companyData
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Applied Roles */}
        <div 
          className="rounded-xl p-6"
          style={{ backgroundColor: theme.background.secondary }}
        >
          <h4 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>Most Applied Roles</h4>
          <div className="space-y-4">
            {roleArray.map((role, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>{role.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium" style={{ color: theme.text.primary }}>{role.value}</span>
                  {role.interviews > 0 && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: theme.status.interview + '20',
                        color: theme.status.interview
                      }}
                    >
                      {role.interviews} interviews
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Companies */}
        <div 
          className="rounded-xl p-6"
          style={{ backgroundColor: theme.background.secondary }}
        >
          <h4 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>Top Companies</h4>
          <div className="space-y-4">
            {companyArray.map((company, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ color: theme.text.secondary }}>{company.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium" style={{ color: theme.text.primary }}>{company.applications}</span>
                  {company.interviews > 0 && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: theme.status.interview + '20',
                        color: theme.status.interview
                      }}
                    >
                      {company.interviews} interviews
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Redesigned Line Chart Component with Better UX
  const ActivityLineChart = ({ title }) => {
    // Collect all activity dates
    const allActivityDates = {}
    
    allRoles.forEach(role => {
      const applicationDate = getDateFromRaw(role.rawData, 'Applied_Date')
      if (applicationDate) {
        const dateKey = applicationDate.toISOString().split('T')[0]
        if (!allActivityDates[dateKey]) {
          allActivityDates[dateKey] = { count: 0 }
        }
        allActivityDates[dateKey].count += 1
      }
      
      Object.values(role.stages).forEach(stage => {
        if (stage.emails) {
          stage.emails.forEach(email => {
            let emailDate = null
            if (email.date) {
              if (typeof email.date === 'string') {
                emailDate = new Date(email.date)
              } else if (email.date.toDate) {
                emailDate = email.date.toDate()
              } else {
                emailDate = new Date(email.date)
              }
            }
            
            if (emailDate && !isNaN(emailDate.getTime())) {
              const dateKey = emailDate.toISOString().split('T')[0]
              if (!allActivityDates[dateKey]) {
                allActivityDates[dateKey] = { count: 0 }
              }
              allActivityDates[dateKey].count += 1
            }
          })
        }
      })
    })

    if (Object.keys(allActivityDates).length === 0) {
      return (
        <div className="flex items-center justify-center h-80 rounded-xl" style={{ backgroundColor: theme.background.secondary }}>
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p style={{ color: theme.text.tertiary }}>No activity data available</p>
          </div>
        </div>
      )
    }

    // Get all dates with data, then fill in the gaps
    const allDates = Object.keys(allActivityDates).sort()
    if (allDates.length === 0) return null
    
    const firstDate = new Date(allDates[0])
    const today = new Date()
    
    const chartData = []
    const currentDate = new Date(firstDate)
    
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0]
      chartData.push({
        date: new Date(currentDate),
        dateKey,
        count: allActivityDates[dateKey]?.count || 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Limit to last 60 days for better visualization
    const displayData = chartData.slice(-60)

    const maxCount = Math.max(...displayData.map(d => d.count), 1)
    const chartHeight = 300
    const chartWidth = 100 // percentage-based

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
              Last {displayData.length} days of activity
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#3b82f6' + '20' }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
              {displayData.reduce((sum, d) => sum + d.count, 0)} activities
            </span>
          </div>
        </div>

        <div className="relative" style={{ height: `${chartHeight}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs" style={{ color: theme.text.tertiary, width: '40px' }}>
            {[maxCount, Math.floor(maxCount * 0.75), Math.floor(maxCount * 0.5), Math.floor(maxCount * 0.25), 0].map((val, idx) => (
              <div key={idx} className="text-right pr-2">{val}</div>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0 bottom-8">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-end gap-1">
                {displayData.map((data, index) => {
                  const heightPercent = maxCount > 0 ? (data.count / maxCount) * 100 : 0
                  const hasData = data.count > 0
                  const heightPx = hasData ? Math.max((heightPercent / 100) * (chartHeight - 32), 4) : 0
                  
                  return (
                    <div key={data.dateKey} className="flex-1 group relative" style={{ height: '100%' }}>
                      {/* Tooltip */}
                      {hasData && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div 
                            className="px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap"
                            style={{ 
                              backgroundColor: theme.background.primary,
                              border: `2px solid #3b82f6`,
                              color: theme.text.primary
                            }}
                          >
                            <div className="font-semibold">{data.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                            <div style={{ color: '#3b82f6' }}>{data.count} activities</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Bar */}
                      {hasData && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                          style={{ 
                            height: `${heightPx}px`,
                            backgroundColor: '#3b82f6'
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((_, idx) => (
                <div key={idx} className="w-full border-t" style={{ borderColor: theme.border.light, opacity: 0.3 }} />
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs" style={{ color: theme.text.tertiary }}>
            {displayData.filter((_, idx) => idx % Math.ceil(displayData.length / 8) === 0).map((data) => (
              <span key={data.dateKey}>
                {data.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }


  // Enhanced Pie Chart Component
  const PieChart = ({ data, colors, title }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0)
    if (total === 0) return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <p style={{ color: theme.text.tertiary }}>No data available</p>
      </div>
    )

    const stages = Object.entries(data)
      .map(([key, value], index) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        percentage: (value / total * 100).toFixed(1),
        color: colors[index % colors.length],
        angle: (value / total) * 360,
        startAngle: 0
      }))
      .sort((a, b) => b.value - a.value)

    // Calculate start angles for pie segments
    let currentAngle = 0
    const stagesWithAngles = stages.map(stage => {
      const stageWithAngle = { ...stage, startAngle: currentAngle }
      currentAngle += stage.angle
      return stageWithAngle
    })

    const radius = 100
    const centerX = 120
    const centerY = 120

    const createArcPath = (startAngle, endAngle, innerRadius = 0) => {
      const start = polarToCartesian(centerX, centerY, radius + innerRadius, endAngle)
      const end = polarToCartesian(centerX, centerY, radius + innerRadius, startAngle)
      const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle)
      const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle)
      
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
      
      return [
        "M", start.x, start.y,
        "A", radius + innerRadius, radius + innerRadius, 0, largeArcFlag, 0, end.x, end.y,
        "L", innerEnd.x, innerEnd.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        "Z"
      ].join(" ")
    }

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      }
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>{title}</h3>
        <div className="flex items-center justify-center gap-8">
          {/* SVG Pie Chart */}
          <div className="flex-shrink-0">
            <svg width="280" height="280" viewBox="0 0 240 240">
              {stagesWithAngles.map((stage, index) => {
                const endAngle = stage.startAngle + stage.angle
                return (
                  <path
                    key={stage.name}
                    d={createArcPath(stage.startAngle, endAngle)}
                    fill={stage.color}
                    stroke={theme.background.primary}
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                )
              })}
              
              {/* Center circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r="40"
                fill={theme.background.primary}
                stroke={theme.border.light}
              />
              <text
                x={centerX}
                y={centerY - 5}
                textAnchor="middle"
                style={{ fill: theme.text.primary, fontSize: '14', fontWeight: 'bold' }}
              >
                {total}
              </text>
              <text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                style={{ fill: theme.text.secondary, fontSize: '10' }}
              >
                Total
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {stagesWithAngles.map((stage, index) => (
              <div key={stage.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-opacity-50 transition-colors" style={{ backgroundColor: theme.background.secondary + '20' }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium text-sm" style={{ color: theme.text.primary }}>
                    {stage.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: theme.text.primary }}>{stage.value}</span>
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: stage.color + '20',
                      color: stage.color
                    }}
                  >
                    {stage.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Redesigned Compact Heatmap Component
  const CompactHeatmap = ({ title }) => {
    const today = new Date()
    const daysData = {}
    
    // Collect activity data
    allRoles.forEach(role => {
      const applicationDate = getDateFromRaw(role.rawData, 'Applied_Date')
      if (applicationDate) {
        const dateKey = applicationDate.toISOString().split('T')[0]
        if (!daysData[dateKey]) {
          daysData[dateKey] = 0
        }
        daysData[dateKey] += 1
      }
      
      Object.values(role.stages).forEach(stage => {
        if (stage.emails) {
          stage.emails.forEach(email => {
            let emailDate = null
            if (email.date) {
              if (typeof email.date === 'string') {
                emailDate = new Date(email.date)
              } else if (email.date.toDate) {
                emailDate = email.date.toDate()
              } else {
                emailDate = new Date(email.date)
              }
            }
            
            if (emailDate && !isNaN(emailDate.getTime())) {
              const dateKey = emailDate.toISOString().split('T')[0]
              if (!daysData[dateKey]) {
                daysData[dateKey] = 0
              }
              daysData[dateKey] += 1
            }
          })
        }
      })
    })

    // Generate last 12 weeks (84 days)
    const weeks = []
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    const maxCount = Math.max(...Object.values(daysData), 1)
    
    for (let week = 11; week >= 0; week--) {
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        const date = new Date(today.getTime() - (week * 7 + (6 - day)) * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        const count = daysData[dateKey] || 0
        
        weekDays.push({
          date,
          count,
          intensity: count > 0 ? (count / maxCount) : 0
        })
      }
      weeks.push(weekDays)
    }
    const totalActivity = Object.values(daysData).reduce((sum, count) => sum + count, 0)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
              Last 12 weeks
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: theme.text.primary }}>{totalActivity}</div>
            <div className="text-xs" style={{ color: theme.text.secondary }}>total activities</div>
          </div>
        </div>

        <div className="w-full flex gap-0.5 justify-center">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5 flex-1">
              {week.map((day, dayIndex) => {
                const hasActivity = day.count > 0
                const intensity = day.intensity
                
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="w-full aspect-square rounded-sm border group relative cursor-pointer transition-transform hover:scale-125"
                    style={{
                      backgroundColor: hasActivity ? '#3b82f6' : theme.background.secondary,
                      opacity: hasActivity ? (intensity * 0.6 + 0.4) : 0.3,
                      borderColor: theme.border.light
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div 
                        className="px-2 py-1 rounded shadow-xl text-xs whitespace-nowrap"
                        style={{ 
                          backgroundColor: theme.background.primary,
                          border: `1px solid ${theme.border.medium}`,
                          color: theme.text.primary
                        }}
                      >
                        <div className="font-semibold">{day.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        <div style={{ color: '#3b82f6' }}>{day.count} {day.count === 1 ? 'activity' : 'activities'}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Day labels */}
        <div className="flex justify-between text-xs" style={{ color: theme.text.tertiary }}>
          <span>3 months ago</span>
          <span>Today</span>
        </div>
      </div>
    )
  }

  // Enhanced Bar Chart Component with Percentages
  const BarChart = ({ data, title, keyField, valueField, color = theme.primary[600], subtitle, showPercentage = true }) => {
    if (!data || data.length === 0) return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <p style={{ color: theme.text.tertiary }}>No data available</p>
      </div>
    )

    const totalValue = data.reduce((sum, item) => sum + item[valueField], 0)
    const maxValue = Math.max(...data.map(item => item[valueField]))
    const sortedData = [...data].sort((a, b) => b[valueField] - a[valueField])

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>{title}</h3>
          {subtitle && <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>{subtitle}</p>}
        </div>
        <div className="space-y-4">
          {sortedData.slice(0, 8).map((item, index) => {
            const percentage = showPercentage ? ((item[valueField] / totalValue) * 100).toFixed(1) : null
            const barWidth = maxValue > 0 ? (item[valueField] / maxValue) * 100 : 0
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium truncate max-w-[200px]" style={{ color: theme.text.primary }}>
                    {item[keyField]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: theme.text.primary }}>
                      {item[valueField]}
                    </span>
                    {percentage && (
                      <span 
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: color + '20',
                          color: color
                        }}
                      >
                        {percentage}%
                      </span>
                    )}
                    {item.interviews > 0 && (
                      <span 
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ 
                          backgroundColor: theme.status.interview + '20',
                          color: theme.status.interview
                        }}
                      >
                        {item.interviews} interviews
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: theme.background.secondary }}>
                  <div 
                    className="rounded-full h-3 transition-all duration-700"
                    style={{ 
                      backgroundColor: color,
                      width: `${barWidth}%`
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Not logged in state
  if (!isAuthenticated) {
    return <AnalyticsDemo />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: theme.primary[600], borderTopColor: 'transparent' }}></div>
          <p style={{ color: theme.text.secondary }}>Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
               style={{ backgroundColor: theme.status.rejected + '20' }}>
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>
            Error Loading Analytics
          </h3>
          <p className="mb-4" style={{ color: theme.text.secondary }}>{error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (allRoles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary[100] }}>
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
            No Analytics Data Yet
          </h3>
          <p className="text-sm mb-4" style={{ color: theme.text.secondary }}>
            Start applying to jobs to see your analytics dashboard
          </p>
        </div>
      </div>
    )
  }

  // Convert exact role data to array and sort
  const exactRoleArray = Object.entries(analyticsData.exactRoleData)
    .map(([position, data]) => ({
      position,
      applications: data.total,
      interviews: data.interviews,
      offers: data.offers,
      rejections: data.rejections
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10)

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: theme.text.primary }}>
            Analytics Dashboard
          </h1>
          <p className="text-lg" style={{ color: theme.text.secondary }}>
            Insights into your job application journey
          </p>
        </div>

        {/* Activity Trends - Full Width */}
        <div className="mb-8">
          <div 
            className="rounded-2xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <ActivityLineChart title="Activity Trends" />
          </div>
        </div>

        {/* Stage Distribution, Funnel and Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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
                    { stage: "Applied", count: analyticsData.funnelData.applied || 0, color: theme.primary[600] },
                    { stage: "Screening", count: analyticsData.funnelData.screening || 0, color: theme.secondary[600] },
                    { stage: "Interview", count: analyticsData.funnelData.interview || 0, color: theme.status.interview },
                    { stage: "Offer", count: analyticsData.funnelData.offer || 0, color: theme.status.offer },
                    { stage: "Rejected", count: analyticsData.funnelData.rejected || 0, color: theme.status.rejected }
                  ].filter(item => item.count > 0)

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
                  {allRoles.length}
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
            <ApplicationFunnel data={analyticsData.funnelData} />
          </div>

          {/* Activity Heatmap */}
          <div 
            className="rounded-2xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <CompactHeatmap title="Activity Heatmap" />
          </div>
        </div>

        {/* Role Analysis */}
        <div className="mb-8">
          <div 
            className="rounded-2xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: theme.text.primary }}>Role Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Most Applied Roles */}
              <div 
                className="rounded-xl p-6"
                style={{ backgroundColor: theme.background.secondary }}
              >
                <h4 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>Most Applied Roles</h4>
                <div className="space-y-4">
                  {Object.entries(analyticsData.exactRoleData)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5)
                    .map(([position, data], i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span style={{ color: theme.text.secondary }}>{position}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium" style={{ color: theme.text.primary }}>{data.total}</span>
                          {data.interviews > 0 && (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: theme.status.interview + '20',
                                color: theme.status.interview
                              }}
                            >
                              {data.interviews} interviews
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Companies */}
              <div 
                className="rounded-xl p-6"
                style={{ backgroundColor: theme.background.secondary }}
              >
                <h4 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>Top Companies</h4>
                <div className="space-y-4">
                  {analyticsData.companyData
                    .sort((a, b) => b.applications - a.applications)
                    .slice(0, 5)
                    .map((company, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span style={{ color: theme.text.secondary }}>{company.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium" style={{ color: theme.text.primary }}>{company.applications}</span>
                          {company.interviews > 0 && (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: theme.status.interview + '20',
                                color: theme.status.interview
                              }}
                            >
                              {company.interviews} interviews
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Response Time */}
              <div 
                className="rounded-xl p-6"
                style={{ backgroundColor: theme.background.secondary }}
              >
                <h4 className="text-lg font-semibold mb-4" style={{ color: theme.text.primary }}>Response Time</h4>
                <div className="space-y-4">
                  {[
                    { 
                      label: "Same Day",
                      value: analyticsData.responseTimes.sameDay + "%",
                      highlight: "↑ 5%"
                    },
                    { 
                      label: "Within Week",
                      value: analyticsData.responseTimes.withinWeek + "%",
                      highlight: "↑ 10%"
                    },
                    { 
                      label: "Over Week",
                      value: analyticsData.responseTimes.overWeek + "%",
                      highlight: "↓ 15%"
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
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
            </div>
          </div>
        </div>

        {/* Response Time Analysis */}
        <div className="mb-8">
          <div 
            className="rounded-2xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: theme.text.primary }}>Response Time Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  label: "Same Day",
                  value: analyticsData.responseTimes.sameDay + "%",
                  icon: "⚡️",
                  color: theme.status.offer
                },
                { 
                  label: "Within Week",
                  value: analyticsData.responseTimes.withinWeek + "%",
                  icon: "📅",
                  color: theme.primary[600]
                },
                { 
                  label: "Over Week",
                  value: analyticsData.responseTimes.overWeek + "%",
                  icon: "⏳",
                  color: theme.status.rejected
                }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="rounded-xl p-6 text-center"
                  style={{ backgroundColor: theme.background.secondary }}
                >
                  <span className="text-4xl mb-4 block">{item.icon}</span>
                  <div className="text-2xl font-bold mb-2" style={{ color: item.color }}>{item.value}</div>
                  <div style={{ color: theme.text.secondary }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics