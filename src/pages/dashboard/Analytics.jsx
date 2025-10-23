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

  // Helper function to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Data processing functions
  const processAnalyticsData = () => {
    if (allRoles.length === 0) return {}

    // Calculate response times - improved with better date handling and fallbacks
    const responseTimes = allRoles.reduce((acc, role) => {
      const appliedDate = getDateFromRaw(role.rawData, 'Applied_Date')
      if (!appliedDate) return acc

      // Find first response after application
      let firstResponse = null
      
      // Helper function to safely parse dates
      const parseDate = (dateValue) => {
        if (!dateValue) return null
        try {
          if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            return dateValue.toDate()
          } else if (dateValue instanceof Date) {
            return dateValue
          } else if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue)
            return isNaN(parsed.getTime()) ? null : parsed
          } else if (typeof dateValue === 'number') {
            const parsed = new Date(dateValue)
            return isNaN(parsed.getTime()) ? null : parsed
          }
        } catch (error) {
          console.warn('Failed to parse date:', dateValue, error)
        }
        return null
      }

      // Method 1: Look through job details in rawData
      if (role.rawData && role.rawData.details && Array.isArray(role.rawData.details)) {
        role.rawData.details.forEach(detail => {
          // Skip the applied stage as that's not a response
          if (detail.Stage && detail.Stage !== 'applied') {
            let responseDate = parseDate(detail.Sent_Date) || parseDate(detail.Update_Time)
            
            // Check if this is a valid response date after application
            if (responseDate && !isNaN(responseDate.getTime()) && responseDate > appliedDate) {
              if (!firstResponse || responseDate < firstResponse) {
                firstResponse = responseDate
              }
            }
          }
        })
      }
      
      // Method 2: Look through stages and emails (fallback and additional check)
      if (!firstResponse && role.stages) {
        Object.values(role.stages).forEach(stage => {
          if (stage.emails && Array.isArray(stage.emails) && stage.emails.length > 0) {
            stage.emails.forEach(email => {
              let emailDate = null
              
              // Try different ways to get the email date
              if (email.date) {
                emailDate = parseDate(email.date)
              }
              
              if (emailDate && !isNaN(emailDate.getTime()) && emailDate > appliedDate) {
                if (!firstResponse || emailDate < firstResponse) {
                  firstResponse = emailDate
                }
              }
            })
          }
        })
      }

      // Method 3: If current stage is beyond 'applied', use the current stage date as response
      if (!firstResponse && role.currentStage && role.currentStage !== 'applied') {
        // Try to get a date from the current stage
        if (role.stages && role.stages[role.currentStage]) {
          const currentStageData = role.stages[role.currentStage]
          if (currentStageData.date) {
            const stageDate = parseDate(currentStageData.date)
            if (stageDate && !isNaN(stageDate.getTime()) && stageDate > appliedDate) {
              firstResponse = stageDate
            }
          }
        }
      }

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
        const dateKey = getLocalDateString(date) // YYYY-MM-DD format
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

    // Application funnel with detailed interview stages
    const funnelData = {
      applied: stageDistribution.applied || 0,
      screening: stageDistribution.screening || 0,
      interview1: stageDistribution.interview1 || 0,
      interview2: stageDistribution.interview2 || 0,
      interview3: stageDistribution.interview3 || 0,
      interview4: stageDistribution.interview4 || 0,
      interview5: stageDistribution.interview5 || 0,
      interview6: stageDistribution.interview6 || 0,
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
        sameDayCount: responseTimes.sameDay,
        withinWeekCount: responseTimes.withinWeek,
        overWeekCount: responseTimes.overWeek,
        total: responseTimes.total
      }
    }
  }

  const analyticsData = processAnalyticsData()

  // Application Funnel Component
  const ApplicationFunnel = ({ data }) => {
    // Calculate total interviews across all rounds
    const totalInterviews = (data.interview1 || 0) + (data.interview2 || 0) + (data.interview3 || 0) + 
                           (data.interview4 || 0) + (data.interview5 || 0) + (data.interview6 || 0)
    
    const stages = [
      { stage: "Applied", count: data.applied || 0, color: theme?.primary?.[600] || '#3b82f6' },
      { stage: "Screening", count: data.screening || 0, color: theme?.secondary?.[600] || '#8b5cf6' },
      { stage: "Interview", count: totalInterviews, color: theme?.status?.interview || '#f59e0b' },
      { stage: "Offer", count: data.offer || 0, color: theme?.status?.offer || '#10b981' },
      { stage: "Rejected", count: data.rejected || 0, color: theme?.status?.rejected || '#ef4444' }
    ] // Show ALL stages, even with 0 count

    const appliedCount = stages[0].count || 1 // Use first stage (Applied) as baseline
    
    return (
      <div className="space-y-3">
        {stages.map((stage, i) => {
          // For funnel visualization, show conversion rate from applied stage
          // Cap at 100% to prevent display issues
          let conversionRate = 0
          if (i === 0) {
            // First stage (Applied) is always 100%
            conversionRate = 100
          } else if (appliedCount > 0) {
            // Later stages show conversion rate from applied
            conversionRate = Math.min((stage.count / appliedCount) * 100, 100)
          }
          
          const displayPercent = conversionRate.toFixed(1)
          
          return (
            <div key={stage.stage} className="group hover:bg-opacity-50 p-2 rounded-lg transition-all duration-300 cursor-pointer relative">
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div 
                  className="px-4 py-3 rounded-lg shadow-xl text-sm whitespace-nowrap border-2"
                  style={{ 
                    backgroundColor: theme?.background?.primary || '#ffffff',
                    borderColor: stage.color,
                    color: theme?.text?.primary || '#0f172a'
                  }}
                >
                  <div className="font-semibold mb-1">{stage.stage}</div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: stage.color }}>{stage.count}</div>
                      <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>
                        {stage.stage === 'Applied' ? 'applications' : 
                         stage.stage === 'Screening' ? 'in screening' :
                         stage.stage === 'Interview' ? 'interviewed' :
                         stage.stage === 'Offer' ? 'offers' : 'rejected'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: stage.color }}>
                        {i === 0 ? '100.0' : displayPercent}%
                      </div>
                      <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>
                        conversion rate
                      </div>
                    </div>
                  </div>
                  {i > 0 && (
                    <div className="text-xs mt-2 pt-2 border-t" style={{ borderColor: theme?.border?.light || '#e2e8f0' }}>
                      {appliedCount > 0 ? `${((stage.count / appliedCount) * 100).toFixed(1)}%` : '0.0%'} of total applications
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium group-hover:font-semibold transition-all duration-200" style={{ color: theme?.text?.primary || '#0f172a' }}>{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm group-hover:text-base transition-all duration-200" style={{ color: theme?.text?.secondary || '#475569' }}>{stage.count}</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full group-hover:scale-110 transition-all duration-200"
                    style={{ backgroundColor: stage.color + '20', color: stage.color }}
                  >
                    {i === 0 ? '100.0' : displayPercent}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden group-hover:h-2 transition-all duration-300" style={{ backgroundColor: theme?.background?.secondary || '#f8fafc' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500 group-hover:shadow-sm"
                  style={{ 
                    width: `${i === 0 ? 100 : Math.min(conversionRate, 100)}%`,
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
                  <span 
                    className="text-xs px-3 py-0.5 rounded-full whitespace-nowrap"
                    style={{ 
                      backgroundColor: theme.status.interview + '20',
                      color: theme.status.interview
                    }}
                  >
                    {role.interviews} interviews
                  </span>
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
                  <span 
                    className="text-xs px-3 py-0.5 rounded-full whitespace-nowrap"
                    style={{ 
                      backgroundColor: theme.status.interview + '20',
                      color: theme.status.interview
                    }}
                  >
                    {company.interviews} interviews
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Combined Chart Component with Daily Bars and Average Line
  const ActivityLineChart = ({ title }) => {
    // Collect all activity dates
    const allActivityDates = {}
    
    allRoles.forEach(role => {
      const applicationDate = getDateFromRaw(role.rawData, 'Applied_Date')
      if (applicationDate) {
        const dateKey = getLocalDateString(applicationDate)
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
              const dateKey = getLocalDateString(emailDate)
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
    today.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison
    
    const chartData = []
    const currentDate = new Date(firstDate)
    currentDate.setHours(0, 0, 0, 0) // Set to start of day
    
    while (currentDate <= today) {
      const dateKey = getLocalDateString(currentDate)
      chartData.push({
        date: new Date(currentDate),
        dateKey,
        count: allActivityDates[dateKey]?.count || 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Limit to last 30 days for better visualization
    const displayData = chartData.slice(-30)

    const maxCount = Math.max(...displayData.map(d => d.count), 1)
    const chartHeight = 300
    const chartWidth = 100 // percentage-based

    // Calculate running average for trend line
    const runningAverages = displayData.map((_, index) => {
      const dataUpToNow = displayData.slice(0, index + 1)
      const total = dataUpToNow.reduce((sum, d) => sum + d.count, 0)
      return total / (index + 1)
    })
    
    // Overall average for display
    const totalActivities = displayData.reduce((sum, d) => sum + d.count, 0)
    const average = totalActivities / displayData.length

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
              Last 30 days of activity • Daily bars with running average trend
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#3b82f6' + '20' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                {displayData.reduce((sum, d) => sum + d.count, 0)} activities
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#f97316' + '20' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
              <span className="text-sm font-medium" style={{ color: '#f97316' }}>
                Avg: {average.toFixed(1)}/day
              </span>
            </div>
          </div>
        </div>

        <div className="relative" style={{ height: `${chartHeight}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs" style={{ color: theme.text.tertiary, width: '40px' }}>
            {[maxCount, Math.floor(maxCount * 0.75), Math.floor(maxCount * 0.5), Math.floor(maxCount * 0.25), 0].map((val, idx) => (
              <div key={idx} className="text-right pr-2">{val}</div>
            ))}
          </div>

          {/* Combined Chart: Bars + Average Line */}
          <div className="absolute left-12 right-0 top-0 bottom-8">
            <div className="relative w-full h-full">
              {/* SVG for running average line - ON TOP */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                {/* 添加渐变和阴影效果 */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.9" />
                  </linearGradient>
                  
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feMerge> 
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Consistent width line with gradient and glow */}
                <path
                  d={runningAverages.map((avg, index) => {
                    const x = (index / Math.max(1, runningAverages.length - 1)) * 100
                    const y = 100 - (maxCount > 0 ? (avg / maxCount) * 100 : 0)
                    return `${index === 0 ? 'M' : 'L'} ${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="1"
                  vectorEffect="non-scaling-stroke"
                  filter="url(#glow)"
                />
                
              </svg>
              
              {/* Daily bars - BEHIND the line */}
              <div className="absolute inset-0 flex items-end gap-0.5 z-0">
                {displayData.map((data, index) => {
                  const heightPercent = maxCount > 0 ? (data.count / maxCount) * 100 : 0
                  const hasData = data.count > 0
                  const heightPx = hasData ? Math.max((heightPercent / 100) * (chartHeight - 32), 2) : 0
                  
                  // Determine bar color based on running average
                  const currentRunningAvg = runningAverages[index]
                  const isAboveAverage = data.count > currentRunningAvg
                  const barColor = isAboveAverage ? '#3b82f6' : '#6b7280'
                  
                  return (
                    <div key={data.dateKey} className="flex-1 group relative" style={{ height: '100%' }}>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div 
                          className="px-4 py-3 rounded-lg shadow-xl text-xs whitespace-nowrap border-2"
                          style={{ 
                            backgroundColor: theme?.background?.primary || '#ffffff',
                            borderColor: barColor,
                            color: theme?.text?.primary || '#0f172a'
                          }}
                        >
                          <div className="font-semibold">{data.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                          <div style={{ color: barColor }}>{data.count} activities</div>
                          <div className="text-xs mt-1 flex items-center gap-1" style={{ color: theme?.text?.secondary || '#475569' }}>
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: isAboveAverage ? '#10b981' : '#ef4444' }}
                            />
                            {isAboveAverage ? 'Above running avg' : 'Below running avg'} ({currentRunningAvg.toFixed(1)})
                          </div>
                        </div>
                      </div>
                      
                      {/* Bar */}
                      {hasData && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300 group-hover:opacity-90 group-hover:shadow-lg"
                          style={{ 
                            height: `${heightPx}px`,
                            backgroundColor: barColor
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((_, idx) => (
              <div key={idx} className="w-full border-t" style={{ borderColor: theme.border.light, opacity: 0.3 }} />
            ))}
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
        const dateKey = getLocalDateString(applicationDate)
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
              const dateKey = getLocalDateString(emailDate)
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
        const dateKey = getLocalDateString(date)
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>{title}</h3>
            <p className="text-xs mt-1" style={{ color: theme.text.secondary }}>
              Last 12 weeks
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: theme.text.primary }}>{totalActivity}</div>
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
                    className="w-full aspect-square rounded-sm border group relative cursor-pointer transition-all duration-300 hover:scale-125 hover:shadow-lg hover:z-10"
                    style={{
                      backgroundColor: hasActivity ? '#3b82f6' : theme?.background?.secondary || '#f8fafc',
                      opacity: hasActivity ? (intensity * 0.6 + 0.4) : 0.3,
                      borderColor: theme?.border?.light || '#e2e8f0'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div 
                        className="px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap border-2"
                        style={{ 
                          backgroundColor: theme?.background?.primary || '#ffffff',
                          borderColor: hasActivity ? '#3b82f6' : theme?.border?.medium || '#cbd5e1',
                          color: theme?.text?.primary || '#0f172a'
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
                    <span 
                      className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap"
                      style={{ 
                        backgroundColor: theme.status.interview + '20',
                        color: theme.status.interview
                      }}
                    >
                      {item.interviews} interviews
                    </span>
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
            className="rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: theme?.background?.primary || '#ffffff',
              borderColor: theme?.border?.light || '#e2e8f0'
            }}
          >
            <ActivityLineChart title="Activity Trends" />
          </div>
        </div>

        {/* Stage Distribution and Application Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stage Distribution Pie Chart */}
          <div 
            className="rounded-2xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: theme?.background?.primary || '#ffffff',
              borderColor: theme?.border?.light || '#e2e8f0'
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: theme?.text?.primary || '#0f172a' }}>Stage Distribution</h3>
            <div className="flex flex-col items-center gap-8 min-h-[500px]">
              {/* Large pie chart centered */}
              <div className="flex-shrink-0 relative">
                {/* Hover Tooltip */}
                <div id="pie-chart-tooltip" className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 opacity-0 transition-opacity pointer-events-none z-10">
                  <div 
                    className="px-4 py-3 rounded-lg shadow-xl text-sm whitespace-nowrap border-2"
                    style={{ 
                      backgroundColor: theme?.background?.primary || '#ffffff',
                      borderColor: '#3b82f6',
                      color: theme?.text?.primary || '#0f172a'
                    }}
                  >
                    <div className="font-semibold mb-1" id="tooltip-stage">Stage</div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold" id="tooltip-count" style={{ color: '#3b82f6' }}>0</div>
                        <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" id="tooltip-percentage" style={{ color: '#3b82f6' }}>0.0%</div>
                        <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>of total</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <svg width="320" height="320" viewBox="0 0 320 320">
                  {(() => {
                    const data = [
                      { stage: "Applied", count: analyticsData.funnelData.applied || 0, color: "#3b82f6" },
                      { stage: "Screening", count: analyticsData.funnelData.screening || 0, color: "#8b5cf6" },
                      { stage: "Interview", count: analyticsData.funnelData.interview || 0, color: "#f59e0b" },
                      { stage: "Offer", count: analyticsData.funnelData.offer || 0, color: "#10b981" },
                      { stage: "Rejected", count: analyticsData.funnelData.rejected || 0, color: "#ef4444" }
                    ].filter(item => item.count > 0)

                    const total = data.reduce((sum, item) => sum + item.count, 0)
                    const centerX = 160
                    const centerY = 160
                    const radius = 120

                    let startAngle = -90
                    return data.map((item, i) => {
                      const percentage = (item.count / total) * 100
                      const angle = (percentage / 100) * 360
                      const endAngle = startAngle + angle

                      const startRad = (startAngle * Math.PI) / 180
                      const endRad = (endAngle * Math.PI) / 180
                      const x1 = centerX + radius * Math.cos(startRad)
                      const y1 = centerY + radius * Math.sin(startRad)
                      const x2 = centerX + radius * Math.cos(endRad)
                      const y2 = centerY + radius * Math.sin(endRad)
                      const largeArcFlag = angle > 180 ? 1 : 0

                      const path = [
                        'M', centerX, centerY,
                        'L', x1, y1,
                        'A', radius, radius, 0, largeArcFlag, 1, x2, y2,
                        'Z'
                      ].join(' ')

                      startAngle += angle

                      return (
                        <g key={item.stage} className="group">
                          <path
                            d={path}
                            fill={item.color}
                            stroke={theme?.background?.primary || '#ffffff'}
                            strokeWidth="2"
                            className="transition-all duration-300 cursor-pointer hover:opacity-80 hover:scale-105"
                            style={{ transformOrigin: '160px 160px' }}
                            onMouseEnter={(e) => {
                              const tooltip = document.getElementById('pie-chart-tooltip')
                              const stageEl = document.getElementById('tooltip-stage')
                              const countEl = document.getElementById('tooltip-count')
                              const percentageEl = document.getElementById('tooltip-percentage')
                              
                              if (tooltip && stageEl && countEl && percentageEl) {
                                stageEl.textContent = item.stage
                                countEl.textContent = item.count
                                percentageEl.textContent = percentage.toFixed(1) + '%'
                                countEl.style.color = item.color
                                percentageEl.style.color = item.color
                                tooltip.style.borderColor = item.color
                                tooltip.style.opacity = '1'
                              }
                            }}
                            onMouseLeave={() => {
                              const tooltip = document.getElementById('pie-chart-tooltip')
                              if (tooltip) {
                                tooltip.style.opacity = '0'
                              }
                            }}
                          />
                          {/* Enhanced Hover tooltip */}
                          <title>{item.stage}: {item.count} applications ({percentage.toFixed(1)}%)</title>
                        </g>
                      )
                    })
                  })()}
                  {/* Center circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="50"
                    fill={theme?.background?.primary || '#ffffff'}
                    stroke={theme?.border?.light || '#e2e8f0'}
                    strokeWidth="3"
                  />
                  <text
                    x="160"
                    y="150"
                    textAnchor="middle"
                    fontSize="36"
                    fontWeight="bold"
                    fill={theme?.text?.primary || '#0f172a'}
                  >
                    {allRoles.length}
                  </text>
                  <text
                    x="160"
                    y="175"
                    textAnchor="middle"
                    fontSize="16"
                    fill={theme?.text?.secondary || '#475569'}
                  >
                    Total
                  </text>
                </svg>
              </div>

              {/* Smart legend below the chart */}
              <div className="w-full max-w-4xl">
                <div className="flex flex-wrap justify-center gap-4">
                {(() => {
                  const data = [
                    { stage: "Applied", count: analyticsData.funnelData.applied || 0, color: "#3b82f6" },
                    { stage: "Screening", count: analyticsData.funnelData.screening || 0, color: "#8b5cf6" },
                    { stage: "Interview", count: analyticsData.funnelData.interview || 0, color: "#f59e0b" },
                    { stage: "Offer", count: analyticsData.funnelData.offer || 0, color: "#10b981" },
                    { stage: "Rejected", count: analyticsData.funnelData.rejected || 0, color: "#ef4444" }
                  ].filter(item => item.count > 0)

                  const total = data.reduce((sum, item) => sum + item.count, 0)
                  
                  return data.map((item, i) => {
                    const percentage = (item.count / total) * 100
                    return (
                      <div key={item.stage} className="flex flex-col items-center p-3 rounded-xl text-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group min-w-[120px] max-w-[140px]" style={{ backgroundColor: (theme?.background?.secondary || '#f8fafc') + '40' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm flex-shrink-0" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-sm truncate" style={{ color: theme?.text?.primary || '#0f172a' }}>
                            {item.stage}
                          </span>
                        </div>
                        <div className="text-xl font-bold mb-1" style={{ color: theme?.text?.primary || '#0f172a' }}>
                          {item.count}
                        </div>
                        <div 
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ 
                            backgroundColor: item.color + '20',
                            color: item.color
                          }}
                        >
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    )
                  })
                })()}
                </div>
              </div>
            </div>
          </div>

          {/* Application Funnel */}
          <div 
            className="rounded-2xl p-6 shadow-lg border"
            style={{ 
              backgroundColor: theme?.background?.primary || '#ffffff',
              borderColor: theme?.border?.light || '#e2e8f0'
            }}
          >
            <h3 className="text-xl font-bold mb-6" style={{ color: theme?.text?.primary || '#0f172a' }}>Application Funnel</h3>
            <ApplicationFunnel data={analyticsData.funnelData} />
          </div>
        </div>

        {/* Role Analysis */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Most Applied Roles */}
            <div 
              className="rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: theme?.background?.primary || '#ffffff',
                borderColor: theme?.border?.light || '#e2e8f0'
              }}
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: theme?.text?.primary || '#0f172a' }}>Most Applied Roles</h3>
              <div className="space-y-4">
                {Object.entries(analyticsData.exactRoleData)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .slice(0, 8)
                  .map(([position, data], i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg hover:bg-opacity-50 transition-all duration-300 cursor-pointer group" style={{ backgroundColor: theme?.background?.secondary + '20' || '#f8fafc20' }}>
                      <div className="flex-1">
                        <span className="font-medium group-hover:font-semibold transition-all duration-200" style={{ color: theme?.text?.primary || '#0f172a' }}>{position}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold group-hover:text-3xl transition-all duration-200" style={{ color: theme?.text?.primary || '#0f172a' }}>{data.total}</div>
                          <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>applications</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold group-hover:text-xl transition-all duration-200" style={{ color: theme?.status?.interview || '#a855f7' }}>
                            {data.total > 0 ? ((data.interviews / data.total) * 100).toFixed(1) : '0.0'}%
                          </div>
                          <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>
                            {data.interviews} interview{data.interviews !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Companies */}
            <div 
              className="rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: theme?.background?.primary || '#ffffff',
                borderColor: theme?.border?.light || '#e2e8f0'
              }}
            >
              <h3 className="text-xl font-bold mb-6" style={{ color: theme?.text?.primary || '#0f172a' }}>Top Companies</h3>
              <div className="space-y-4">
                {analyticsData.companyData
                  .sort((a, b) => b.applications - a.applications)
                  .slice(0, 8)
                  .map((company, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg hover:bg-opacity-50 transition-all duration-300 cursor-pointer group" style={{ backgroundColor: theme?.background?.secondary + '20' || '#f8fafc20' }}>
                      <div className="flex-1">
                        <span className="font-medium group-hover:font-semibold transition-all duration-200" style={{ color: theme?.text?.primary || '#0f172a' }}>{company.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold group-hover:text-3xl transition-all duration-200" style={{ color: theme?.text?.primary || '#0f172a' }}>{company.applications}</div>
                          <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>applications</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold group-hover:text-xl transition-all duration-200" style={{ color: theme?.status?.interview || '#a855f7' }}>
                            {company.applications > 0 ? ((company.interviews / company.applications) * 100).toFixed(1) : '0.0'}%
                          </div>
                          <div className="text-xs" style={{ color: theme?.text?.secondary || '#475569' }}>
                            {company.interviews} interview{company.interviews !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Analysis and Activity Heatmap */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Response Time Analysis - 2/3 width */}
            <div className="lg:col-span-2">
              <div 
                className="rounded-2xl p-6 shadow-lg border h-full"
                style={{ 
                  backgroundColor: theme?.background?.primary || '#ffffff',
                  borderColor: theme?.border?.light || '#e2e8f0'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" style={{ color: theme?.text?.primary || '#0f172a' }}>Response Time Analysis</h3>
                  {analyticsData.responseTimes.total > 0 && (
                    <div className="text-sm" style={{ color: theme?.text?.secondary || '#475569' }}>
                      Based on {analyticsData.responseTimes.total} response{analyticsData.responseTimes.total > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
            
            {analyticsData.responseTimes.total === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
                  No Response Data Yet
                </h4>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  Response time analytics will appear once you receive responses to your job applications.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    label: "Same Day",
                    value: analyticsData.responseTimes.sameDay + "%",
                    count: analyticsData.responseTimes.sameDayCount,
                    icon: "⚡️",
                    color: theme.status.offer
                  },
                  { 
                    label: "Within Week",
                    value: analyticsData.responseTimes.withinWeek + "%",
                    count: analyticsData.responseTimes.withinWeekCount,
                    icon: "📅",
                    color: theme.primary[600]
                  },
                  { 
                    label: "Over Week",
                    value: analyticsData.responseTimes.overWeek + "%",
                    count: analyticsData.responseTimes.overWeekCount,
                    icon: "⏳",
                    color: theme.status.rejected
                  }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="rounded-xl p-6 text-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    style={{ backgroundColor: theme?.background?.secondary || '#f8fafc' }}
                  >
                    <span className="text-4xl mb-4 block group-hover:scale-110 transition-all duration-200">{item.icon}</span>
                    <div className="text-2xl font-bold mb-1 group-hover:text-3xl transition-all duration-200" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs mb-2 group-hover:text-sm transition-all duration-200" style={{ color: theme?.text?.tertiary || '#64748b' }}>
                      {item.count} response{item.count !== 1 ? 's' : ''}
                    </div>
                    <div className="group-hover:font-medium transition-all duration-200" style={{ color: theme?.text?.secondary || '#475569' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            )}
              </div>
            </div>

            {/* Activity Heatmap - 1/3 width */}
            <div className="lg:col-span-1">
              <div 
                className="rounded-2xl p-6 shadow-lg border h-full"
                style={{ 
                  backgroundColor: theme?.background?.primary || '#ffffff',
                  borderColor: theme?.border?.light || '#e2e8f0'
                }}
              >
                <CompactHeatmap title="Activity Heatmap" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics