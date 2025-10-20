import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import DashboardDemo from './components/Dashboard_Demo'
import { useToast } from '../../toast/Toast'
import { getJobsByTrackingCode, transformJobsForDashboard, updateJob, addManualJob, deleteJob } from '../../lib/jobs'
import RoleEdit from './components/Role_Edit'
import EmailDetails from './components/Email_Details'
import ManualApply from './components/Manual_Apply'
import DeleteConfirmation from './components/Delete_Confirmation'

const TrackerMain = () => {
  const { theme } = useTheme()
  const { userData, isAuthenticated } = useAuth()
  const showToast = useToast()
  const [selectedFilter, setSelectedFilter] = useState('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('appliedDate') // appliedDate, companyName, roleCount, lastUpdated
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc
  const [expandedRoles, setExpandedRoles] = useState(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [editingRole, setEditingRole] = useState(null)

  // Sort options for the dropdown
  const sortOptions = [
    { value: 'appliedDate', label: 'Applied Date', icon: '📅' },
    { value: 'companyName', label: 'Company Name', icon: '🏢' },
    { value: 'roleCount', label: 'Number of Roles', icon: '📊' },
    { value: 'lastUpdated', label: 'Last Updated', icon: '🔄' }
  ]

  // Close dropdown when clicking outside and handle keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.sort-dropdown')) {
        setDropdownOpen(false)
        setFocusedIndex(-1)
      }
    }
    
    const handleKeyDown = (event) => {
      if (!dropdownOpen) return
      
      switch (event.key) {
        case 'Escape':
          setDropdownOpen(false)
          setFocusedIndex(-1)
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => (prev + 1) % sortOptions.length)
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => prev <= 0 ? sortOptions.length - 1 : prev - 1)
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0 && sortOptions[focusedIndex]) {
            const selectedOption = sortOptions[focusedIndex].value
            if (selectedOption === sortBy) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            } else {
              const defaultOrder = ['appliedDate', 'lastUpdated'].includes(selectedOption) ? 'desc' : 'asc'
              setSortBy(selectedOption)
              setSortOrder(defaultOrder)
            }
            setDropdownOpen(false)
          }
          break
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen, focusedIndex, sortBy, sortOrder, sortOptions])
  const [editingCompany, setEditingCompany] = useState(null)
  const [emailDetails, setEmailDetails] = useState(null)
  const [showManualApply, setShowManualApply] = useState(false)
  const [companiesData, setCompaniesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, job: null, company: null })
  const [isDeleting, setIsDeleting] = useState(false)

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
        setError('Failed to load job applications. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [userData, isAuthenticated])

  // Use real data if available, otherwise use empty array
  const displayData = companiesData.length > 0 ? companiesData : []

  // Calculate stats from grouped data
  const allRoles = displayData.flatMap(company => company.roles)
  
  // Helper function to check if a role was updated today
  const isUpdatedToday = (role) => {
    if (!role.rawData?.Last_Updated) return false
    const lastUpdated = role.rawData.Last_Updated.toDate ? role.rawData.Last_Updated.toDate() : new Date(role.rawData.Last_Updated)
    const today = new Date()
    return lastUpdated.toDateString() === today.toDateString()
  }
  
  const stats = {
    total: allRoles.length,
    active: allRoles.filter(role => !['rejected', 'offer'].includes(role.currentStage)).length,
    interviews: allRoles.filter(role => ['interview1', 'interview2'].includes(role.currentStage)).length,
    offers: allRoles.filter(role => role.currentStage === 'offer').length,
    updatedToday: allRoles.filter(role => isUpdatedToday(role)).length
  }

  const statusFilters = [
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'today', label: '📬 Updated Today', count: stats.updatedToday, highlight: true },
    { key: 'all', label: 'All', count: allRoles.length },
    { key: 'applied', label: 'Applied', count: allRoles.filter(r => r.currentStage === 'applied').length },
    { key: 'screening', label: 'Screening', count: allRoles.filter(r => r.currentStage === 'screening').length },
    { key: 'interview', label: 'Interviews', count: allRoles.filter(r => ['interview1', 'interview2'].includes(r.currentStage)).length },
    { key: 'offer', label: 'Offers', count: allRoles.filter(r => r.currentStage === 'offer').length },
    { key: 'rejected', label: 'Rejected', count: allRoles.filter(r => r.currentStage === 'rejected').length }
  ]

  // Sort helpers
  const getCompanySortValue = (company, sortBy) => {
    switch (sortBy) {
      case 'companyName':
        return company.company.toLowerCase()
      case 'roleCount':
        return company.roles.length
      case 'appliedDate':
        // Get the most recent applied date from all roles in the company
        const dates = company.roles
          .map(role => {
            if (role.rawData?.Applied_Date) {
              return role.rawData.Applied_Date.toDate ? 
                role.rawData.Applied_Date.toDate() : 
                new Date(role.rawData.Applied_Date)
            }
            return new Date(0) // Fallback to epoch for roles without applied date
          })
          .filter(date => date.getTime() > 0)
        return dates.length > 0 ? Math.max(...dates.map(d => d.getTime())) : 0
      case 'lastUpdated':
        // Get the most recent update from all roles in the company
        const updates = company.roles
          .map(role => {
            if (role.rawData?.Last_Updated) {
              return role.rawData.Last_Updated.toDate ? 
                role.rawData.Last_Updated.toDate() : 
                new Date(role.rawData.Last_Updated)
            }
            return new Date(0)
          })
          .filter(date => date.getTime() > 0)
        return updates.length > 0 ? Math.max(...updates.map(d => d.getTime())) : 0
      default:
        return company.company.toLowerCase()
    }
  }

  // Filter and sort companies
  const filteredCompanies = displayData
    .map(company => {
      const filteredRoles = company.roles.filter(role => {
        const matchesFilter = selectedFilter === 'all' || 
              (selectedFilter === 'active' && role.currentStage !== 'rejected') ||
              (selectedFilter === 'today' && isUpdatedToday(role)) ||
              (selectedFilter === 'applied' && role.currentStage === 'applied') ||
              (selectedFilter === 'screening' && role.currentStage === 'screening') ||
              (selectedFilter === 'interview' && ['interview1', 'interview2'].includes(role.currentStage)) ||
              (selectedFilter === 'offer' && role.currentStage === 'offer') ||
              (selectedFilter === 'rejected' && role.currentStage === 'rejected')
        
        const matchesSearch = searchTerm === '' || 
              company.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
              role.position.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesFilter && matchesSearch
      })

      if (filteredRoles.length > 0) {
        // Sort roles within each company
        const sortedRoles = [...filteredRoles].sort((a, b) => {
          let aValue, bValue
          
          switch (sortBy) {
            case 'appliedDate':
              aValue = a.rawData?.Applied_Date ? 
                (a.rawData.Applied_Date.toDate ? a.rawData.Applied_Date.toDate().getTime() : new Date(a.rawData.Applied_Date).getTime()) : 0
              bValue = b.rawData?.Applied_Date ? 
                (b.rawData.Applied_Date.toDate ? b.rawData.Applied_Date.toDate().getTime() : new Date(b.rawData.Applied_Date).getTime()) : 0
              break
            case 'lastUpdated':
              aValue = a.rawData?.Last_Updated ? 
                (a.rawData.Last_Updated.toDate ? a.rawData.Last_Updated.toDate().getTime() : new Date(a.rawData.Last_Updated).getTime()) : 0
              bValue = b.rawData?.Last_Updated ? 
                (b.rawData.Last_Updated.toDate ? b.rawData.Last_Updated.toDate().getTime() : new Date(b.rawData.Last_Updated).getTime()) : 0
              break
            case 'companyName':
              // When sorting by company name, sort roles by position within each company
              aValue = (a.position || '').toLowerCase()
              bValue = (b.position || '').toLowerCase()
              break
            default:
              aValue = (a.position || '').toLowerCase()
              bValue = (b.position || '').toLowerCase()
          }
          
          if (sortBy === 'appliedDate' || sortBy === 'lastUpdated') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
          } else {
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
            return 0
          }
        })
        
        return { ...company, roles: sortedRoles }
      }
      
      return null
    })
    .filter(company => company !== null)
    .sort((a, b) => {
      const aValue = getCompanySortValue(a, sortBy)
      const bValue = getCompanySortValue(b, sortBy)
      
      if (sortBy === 'roleCount') {
        // For role count, higher numbers first by default (desc)
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      } else if (sortBy === 'appliedDate' || sortBy === 'lastUpdated') {
        // For dates, more recent first by default (desc)
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        // For strings, alphabetical
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      }
    })

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // If same sort by, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New sort by, set default order based on type
      const defaultOrder = ['appliedDate', 'lastUpdated'].includes(newSortBy) ? 'desc' : 'asc'
      setSortBy(newSortBy)
      setSortOrder(defaultOrder)
    }
    setDropdownOpen(false)
  }

  // Get current sort option
  const currentSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0]

  // Toggle role expansion
  const toggleRoleExpansion = (roleId) => {
    const newExpanded = new Set(expandedRoles)
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId)
    } else {
      newExpanded.add(roleId)
    }
    setExpandedRoles(newExpanded)
  }

  // Get current stage display info
  const getStageInfo = (currentStage) => {
    const stageMap = {
      applied: { label: 'Applied', color: theme.primary[600], bgColor: theme.primary[100] },
      screening: { label: 'Screening', color: theme.secondary[600], bgColor: theme.secondary[100] },
      interview1: { label: '1st Round', color: theme.status.interview, bgColor: theme.status.interview + '20' },
      interview2: { label: '2nd Round', color: theme.status.interview, bgColor: theme.status.interview + '20' },
      offer: { label: 'Offer', color: theme.status.offer, bgColor: theme.status.offer + '20' },
      rejected: { label: 'Rejected', color: theme.status.rejected, bgColor: theme.status.rejected + '20' }
    }
    return stageMap[currentStage] || stageMap.applied
  }

  // Dynamic stage configuration
  const getStageConfig = (stageName) => {
    const configs = {
      applied: { label: 'Applied', icon: '📝' },
      screening: { label: 'Screening', icon: '👁️' },
      offer: { label: 'Offer', icon: '🎉' },
      rejected: { label: 'Rejected', icon: '❌' }
    }
    
    // Handle dynamic interview rounds
    if (stageName.startsWith('interview')) {
      const roundNum = stageName.replace('interview', '')
      const rounds = ['1st', '2nd', '3rd', '4th', '5th', '6th']
      const roundLabel = rounds[parseInt(roundNum) - 1] || `${roundNum}th`
      return { label: `${roundLabel} Round`, icon: roundNum === '1' ? '💬' : '🎯' }
    }
    
    return configs[stageName] || { label: stageName, icon: '○' }
  }

  // Handle save from edit modal
  const handleSaveRole = async (formData) => {
    try {
      await updateJob(formData.id, {
        Job_Title: formData.position,
        Location: formData.location,
        Salary: formData.salary,
        Contact: formData.contact,
        Current_Stage: formData.currentStage
      })
      
      // Optimized update: only update the specific job in state without reloading everything
      setCompaniesData(prevData => {
        return prevData.map(company => ({
          ...company,
          roles: company.roles.map(role => {
            if (role.id === formData.id) {
              // Update the role with new data
              const updatedRole = {
                ...role,
                position: formData.position,
                location: formData.location,
                salary: formData.salary,
                contact: formData.contact,
                currentStage: formData.currentStage,
                lastUpdated: 'Just now'
              }
              
              // Update the stages to reflect the new current stage
              const updatedStages = { ...role.stages }
              Object.keys(updatedStages).forEach(stageName => {
                if (updatedStages[stageName]) {
                  updatedStages[stageName] = {
                    ...updatedStages[stageName],
                    current: stageName === formData.currentStage,
                    completed: stageName !== formData.currentStage && updatedStages[stageName].completed
                  }
                }
              })
              
              return { ...updatedRole, stages: updatedStages }
            }
            return role
          })
        }))
      })
      
      setEditingRole(null)
      setEditingCompany(null)
    } catch (error) {
      throw error // Re-throw to let Role_Edit handle the error toast
    }
  }

  // Handle refreshing data after email stage change
  const handleRefreshAfterStageChange = async () => {
    try {
      const jobs = await getJobsByTrackingCode(userData.emailCode)
      const transformedData = transformJobsForDashboard(jobs)
      setCompaniesData(transformedData)
    } catch (error) {
      // Error refreshing data
    }
  }

  // Handle saving manual application
  const handleSaveManualApplication = async (formData) => {
    try {
      await addManualJob(formData, userData.emailCode, userData.id)
      
      // Refresh data
      const jobs = await getJobsByTrackingCode(userData.emailCode)
      const transformedData = transformJobsForDashboard(jobs)
      setCompaniesData(transformedData)
      
      setShowManualApply(false)
    } catch (error) {
      throw error // Re-throw to let Manual_Apply handle the error toast
    }
  }

  // Handle delete job request (open confirmation modal)
  const handleDeleteRequest = (role, company) => {
    setDeleteConfirmation({
      isOpen: true,
      job: {
        ...role,
        company: company.company // Ensure company name is available
      },
      company: company
    })
  }

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.job) return

    setIsDeleting(true)
    
    try {
      await deleteJob(deleteConfirmation.job.id)
      
      showToast('Application deleted successfully', 'success')
      
      // Refresh data
      const jobs = await getJobsByTrackingCode(userData.emailCode)
      const transformedData = transformJobsForDashboard(jobs)
      setCompaniesData(transformedData)
      
      // Close modal
      setDeleteConfirmation({ isOpen: false, job: null, company: null })
    } catch (error) {
      showToast('Failed to delete application: ' + error.message, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, job: null, company: null })
  }


  // Not logged in state
  if (!isAuthenticated) {
    return <DashboardDemo />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: theme.primary[600], borderTopColor: 'transparent' }}></div>
          <p style={{ color: theme.text.secondary }}>Loading your applications...</p>
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
            Error Loading Applications
          </h3>
          <p className="mb-4" style={{ color: theme.text.secondary }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: theme.primary[600], color: theme.text.inverse }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3" style={{ color: theme.text.primary }}>
                Dashboard
              </h1>
            </div>
            
            <button
              onClick={() => setShowManualApply(true)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
              style={{ 
                background: theme.gradients.primary, 
                color: theme.text.inverse 
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Application
            </button>
          </div>
        </div>

        {/* Quick Stats - Horizontal Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.total}</span>
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
                style={{ backgroundColor: theme.status.offer + '20' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.status.offer }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.updatedToday}</span>
            </div>
            <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Updated Today</p>
            {stats.updatedToday > 0 && (
              <p className="text-xs mt-1" style={{ color: theme.text.tertiary }}>New emails received</p>
            )}
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
                style={{ backgroundColor: theme.secondary[100] }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.secondary[600] }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.active}</span>
            </div>
            <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Active</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{stats.interviews}</span>
            </div>
            <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Interviews</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            {/* Search */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none w-full"
                style={{
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.medium,
                  color: theme.text.primary,
                  focusRingColor: theme.primary[600]
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

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                Sort by:
              </span>
              
              {/* Custom Dropdown */}
              <div className="relative sort-dropdown">
                <button
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen)
                    if (!dropdownOpen) {
                      setFocusedIndex(sortOptions.findIndex(opt => opt.value === sortBy))
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDropdownOpen(!dropdownOpen)
                      if (!dropdownOpen) {
                        setFocusedIndex(sortOptions.findIndex(opt => opt.value === sortBy))
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setDropdownOpen(true)
                      setFocusedIndex(0)
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: theme.background.primary,
                    borderColor: dropdownOpen ? theme.primary[600] : theme.border.medium,
                    color: theme.text.primary,
                    focusRingColor: theme.primary[600],
                    minWidth: '200px'
                  }}
                >
                  <span className="text-base">{currentSortOption.icon}</span>
                  <span className="flex-1 text-left">{currentSortOption.label}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-full rounded-lg shadow-lg border overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-200"
                    style={{
                      backgroundColor: theme.background.primary,
                      borderColor: theme.border.light,
                      boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
                    }}
                  >
                    {sortOptions.map((option, index) => {
                      const isSelected = option.value === sortBy
                      const isFocused = focusedIndex === index
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-150 text-left ${
                            isSelected ? 'font-semibold' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected 
                              ? theme.primary[50] 
                              : isFocused 
                                ? theme.background.secondary 
                                : 'transparent',
                            color: isSelected ? theme.primary[600] : theme.text.primary,
                            borderBottom: index < sortOptions.length - 1 ? `1px solid ${theme.border.light}` : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.target.style.backgroundColor = theme.background.secondary
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected && !isFocused) {
                              e.target.style.backgroundColor = 'transparent'
                            }
                          }}
                          ref={(el) => {
                            if (isFocused && el) {
                              el.scrollIntoView({ block: 'nearest' })
                            }
                          }}
                        >
                          <span className="text-base">{option.icon}</span>
                          <span className="flex-1">{option.label}</span>
                          {isSelected && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2 rounded-lg border transition-all hover:opacity-80 ${
                  sortOrder === 'desc' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: theme.background.primary,
                  borderColor: theme.border.medium,
                  color: theme.text.secondary,
                  ringColor: sortOrder === 'desc' ? theme.primary[600] : 'transparent'
                }}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Status Filters - Scrollable on Mobile */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
            <div className="flex gap-2 min-w-max lg:min-w-0 lg:flex-wrap">
              {statusFilters.map((filter) => {
                const isHighlighted = filter.highlight && filter.count > 0 && selectedFilter !== filter.key
                const isSelected = selectedFilter === filter.key
                
                return (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
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
                        : (isHighlighted ? theme.status.offer : theme.text.secondary),
                      fontWeight: isHighlighted ? '600' : '500'
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Companies List Grouped by Company */}
        <div className="space-y-6">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="rounded-xl shadow-md border"
              style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}
            >
              {/* Company Header */}
              <div className="px-6 py-4 border-b" style={{ borderColor: theme.border.light }}>
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

              {/* Roles List */}
              <div className="divide-y" style={{ borderColor: theme.border.light }}>
                {company.roles.map((role) => {
                  const isExpanded = expandedRoles.has(role.id)
                  const stageInfo = getStageInfo(role.currentStage)
                  
                  return (
                    <div key={role.id} className="transition-all">
                      {/* High-Level Overview - Clickable */}
                      <div 
                        className="px-6 py-4 cursor-pointer hover:bg-opacity-50 transition-all"
                        style={{ backgroundColor: isExpanded ? theme.background.secondary : 'transparent' }}
                        onClick={() => toggleRoleExpansion(role.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Expand/Collapse Icon */}
                          <div>
                            <svg 
                              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              style={{ color: theme.text.tertiary }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>

                          {/* Role Information Grid */}
                          <div className="flex-1">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Title & Stage */}
                              <div className="col-span-12 md:col-span-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-base font-semibold truncate" style={{ color: theme.text.primary }}>
                                    {role.position || 'Unknown Position'}
                                  </h4>
                                </div>
                                <span 
                                  className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: stageInfo.bgColor, 
                                    color: stageInfo.color 
                                  }}
                                >
                                  {stageInfo.label}
                                </span>
                              </div>
                    
                              {/* Salary */}
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Salary
                                </p>
                                <p className="text-sm font-medium truncate" style={{ color: theme.text.secondary }}>
                                  {role.salary || 'Not specified'}
                                </p>
                              </div>

                              {/* Location */}
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Location
                                </p>
                                <p className="text-sm font-medium truncate" style={{ color: theme.text.secondary }}>
                                  {role.location || 'Location not specified'}
                                </p>
                              </div>

                              {/* Recruiter */}
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Recruiter
                                </p>
                                <p className="text-sm font-medium truncate" style={{ color: theme.text.secondary }}>
                                  {role.contact || 'No contact provided'}
                                </p>
                              </div>

                              {/* Last Updated */}
                              <div className="col-span-6 md:col-span-2">
                                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: theme.text.tertiary }}>
                                  Updated
                                </p>
                                <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                                  {role.lastUpdated}
                                </p>
                              </div>

                              {/* Edit & Delete Buttons */}
                              <div className="col-span-12 md:col-span-1 flex justify-end gap-2">
                                {/* Edit Button */}
                                <button
                                  className="p-2 rounded-lg hover:bg-opacity-20 transition-all"
                                  style={{ 
                                    color: theme.primary[600],
                                    backgroundColor: theme.primary[100]
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingRole(role)
                                    setEditingCompany(company)
                                  }}
                                  title="Edit Role"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>

                                {/* Delete Button */}
                                <button
                                  className="p-2 rounded-lg hover:bg-opacity-20 transition-all"
                                  style={{ 
                                    color: theme.status.rejected,
                                    backgroundColor: theme.status.rejected + '20'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteRequest(role, company)
                                  }}
                                  title="Delete Application"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Notes */}
                            {role.notes && (
                              <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border.light }}>
                                <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.text.tertiary }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                  </svg>
                                  <p className="text-sm line-clamp-2" style={{ color: theme.text.secondary }}>
                                    {role.notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details - Stage Workflow */}
                      {isExpanded && (
                        <div 
                          className="px-6 py-6 border-t"
                          style={{ 
                            backgroundColor: theme.background.secondary,
                            borderColor: theme.border.light 
                          }}
                        >
                          <h5 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: theme.text.secondary }}>
                            Application Timeline
                          </h5>
                          
                          {/* Detailed Stage Timeline */}
                          <div className="space-y-4">
                            {(() => {
                              // Define the proper stage order
                              const stageOrder = ['applied', 'screening', 'interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6', 'offer', 'rejected']
                              
                              // Get stages in proper chronological order
                              return stageOrder
                                .map(stageName => [stageName, role.stages[stageName]])
                                .filter(([stageName, stage]) => stage && (
                                  stage.completed || 
                                  stage.current || 
                                  stage.rejected || 
                                  (stage.emails && stage.emails.length > 0) || 
                                  (stage.date && stage.date !== '') || 
                                  (stage.notes && stage.notes !== '')
                                ))
                                .map(([stageName, stage], index, filteredArray) => {
                              const config = getStageConfig(stageName)
                              const isCompleted = stage.completed
                              const isCurrent = stage.current
                              const isRejected = stage.rejected
                              const isActive = isCompleted || isCurrent || isRejected
                              const hasEmails = stage.emails && stage.emails.length > 0
                              const emailCount = stage.emails?.length || 0
                              
                              return (
                                <div 
                                  key={stageName} 
                                  className={`flex gap-4 ${hasEmails ? 'cursor-pointer hover:bg-opacity-50' : ''}`}
                                  style={{ 
                                    padding: hasEmails ? '8px' : '0',
                                    marginLeft: hasEmails ? '-8px' : '0',
                                    marginRight: hasEmails ? '-8px' : '0',
                                    borderRadius: '8px',
                                    backgroundColor: hasEmails ? 'transparent' : 'transparent'
                                  }}
                                  onClick={() => {
                                    if (hasEmails) {
                                      setEmailDetails({
                                        emails: stage.emails,
                                        stageName: config?.label || stageName,
                                        jobId: role.id
                                      })
                                    }
                                  }}
                                >
                                  {/* Timeline Indicator */}
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium ${
                                        isRejected ? 'border-2' : ''
                                      }`}
                                      style={{
                                        backgroundColor: isCompleted 
                                          ? theme.status.offer 
                                          : isCurrent 
                                            ? theme.primary[600] 
                                            : isRejected
                                              ? theme.status.rejected
                                              : theme.background.primary,
                                        color: isCompleted || isCurrent || isRejected
                                          ? '#fff' 
                                          : theme.text.tertiary,
                                        borderColor: isRejected ? theme.status.rejected : 'transparent'
                                      }}
                                    >
                                      {isCompleted ? '✓' : isRejected ? '✕' : config?.icon || '○'}
                                    </div>
                                    {index < filteredArray.length - 1 && (
                                      <div
                                        className="w-0.5 h-12 mt-1"
                                        style={{
                                          backgroundColor: isCompleted 
                                            ? theme.status.offer 
                                            : theme.border.light
                                        }}
                                      />
                                    )}
                                  </div>

                                  {/* Stage Details */}
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h6 className="font-semibold" style={{ color: isActive ? theme.text.primary : theme.text.tertiary }}>
                                        {config?.label || stageName}
                                      </h6>
                                      {stage.date && (
                                        <span className="text-xs" style={{ color: theme.text.tertiary }}>
                                          {stage.date}
                                        </span>
                                      )}
                                      {hasEmails && (
                                        <div className="flex items-center gap-1 ml-1">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary[600] }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                          </svg>
                                          {emailCount > 1 && (
                                            <span 
                                              className="text-xs font-medium px-1.5 py-0.5 rounded-full" 
                                              style={{ 
                                                backgroundColor: theme.primary[600],
                                                color: '#fff'
                                              }}
                                            >
                                              {emailCount}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {stage.notes && (
                                      <p className="text-sm" style={{ color: theme.text.secondary }}>
                                        {stage.notes}
                                      </p>
                                    )}
                                    {hasEmails && (
                                      <p className="text-xs mt-1 font-medium" style={{ color: theme.primary[600] }}>
                                        Click to view {emailCount > 1 ? `${emailCount} emails` : 'email'} →
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })})()}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary[100] }}>
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
              No applications found
            </h3>
            <p className="text-sm mb-4" style={{ color: theme.text.secondary }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Start by forwarding job application emails to your JobSync address'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowManualApply(true)}
                className="px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 shadow-md"
                style={{ backgroundColor: theme.primary[600], color: theme.text.inverse }}
              >
                Add Your First Application
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <RoleEdit
        role={editingRole}
        company={editingCompany}
        isOpen={editingRole !== null}
        onClose={() => {
          setEditingRole(null)
          setEditingCompany(null)
        }}
        onSave={handleSaveRole}
      />

      <EmailDetails
        emails={emailDetails?.emails}
        stageName={emailDetails?.stageName}
        jobId={emailDetails?.jobId}
        isOpen={emailDetails !== null}
        onClose={() => setEmailDetails(null)}
        onSaveStageChange={handleRefreshAfterStageChange}
      />

      <ManualApply
        isOpen={showManualApply}
        onClose={() => setShowManualApply(false)}
        onSave={handleSaveManualApplication}
      />

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        jobData={deleteConfirmation.job}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default TrackerMain
