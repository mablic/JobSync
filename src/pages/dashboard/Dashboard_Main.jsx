import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import DashboardDemo from './components/Dashboard_Demo'
import { useToast } from '../../toast/Toast'
import { Timestamp } from 'firebase/firestore'
import {
  getJobsByTrackingCodePage,
  getDashboardJobCounts,
  getJobDetails,
  transformJobsForDashboard,
  updateJob,
  addManualJob,
  deleteJob,
  closeStaleOpenJobs,
  JOBS_PAGE_SIZE,
  INTERVIEW_STAGES
} from '../../lib/jobs'
import RoleEdit from './components/Role_Edit'
import EmailDetails from './components/Email_Details'
import ManualApply from './components/Manual_Apply'
import DeleteConfirmation from './components/Delete_Confirmation'
import MergeCompany from './components/Merge_Company'
import MergeJob from './components/Merge_Job'

/** One spinner style for the whole dashboard: primary ring, gap at top, motion-reduce safe */
const DashboardSpinner = ({ theme, size = 'md', className = '', withGlow = false, ariaHidden = false }) => {
  const dim =
    size === 'xs'
      ? 'w-3.5 h-3.5 border-2'
      : size === 'sm'
        ? 'w-8 h-8 border-2'
        : size === 'md'
          ? 'w-12 h-12 border-[3px]'
          : 'w-14 h-14 border-4'

  return (
    <div
      role={ariaHidden ? 'presentation' : 'status'}
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaHidden ? undefined : 'Loading'}
      className={`shrink-0 rounded-full border-solid border-t-transparent animate-spin motion-reduce:border-t-current motion-reduce:animate-none ${dim} ${className}`}
      style={{
        borderColor: theme.primary[600],
        borderTopColor: 'transparent',
        ...(withGlow ? { boxShadow: `0 0 24px ${theme.primary[600]}40` } : {})
      }}
    />
  )
}

/** Placeholder layout while the first page of jobs loads — avoids a blank full-screen spinner */
const DashboardInitialSkeleton = ({ theme }) => {
  const bar = (className = '') => (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: theme.border.light }}
    />
  )

  return (
    <div
      className="space-y-0 motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-6 shadow-sm border"
            style={{
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <div className="flex items-center justify-between mb-3">
              {bar('w-10 h-10 rounded-xl')}
              {bar('h-8 w-12')}
            </div>
            {bar('h-4 w-28 max-w-full')}
          </div>
        ))}
      </div>

      <p className="text-xs mb-6 -mt-4 flex items-center gap-2" style={{ color: theme.text.tertiary }}>
        <DashboardSpinner theme={theme} size="xs" className="inline-block motion-reduce:hidden" ariaHidden />
        Loading your applications…
      </p>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {bar('h-11 w-full max-w-md')}
          {bar('h-11 w-full max-w-[240px]')}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>{bar('h-9 w-24')}</div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2].map((c) => (
          <div
            key={c}
            className="rounded-xl shadow-md border overflow-hidden"
            style={{
              backgroundColor: theme.background.primary,
              borderColor: theme.border.light
            }}
          >
            <div
              className="px-6 py-4 border-b flex items-center gap-4"
              style={{ borderColor: theme.border.light }}
            >
              {bar('w-14 h-14 rounded-xl flex-shrink-0')}
              <div className="flex-1 space-y-2 py-1 min-w-0">
                {bar('h-6 w-48 max-w-full')}
                {bar('h-4 w-32 max-w-full opacity-80')}
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: theme.border.light }}>
              {[1, 2].map((r) => (
                <div key={r} className="px-6 py-4">
                  {bar('h-16 w-full max-w-full opacity-90')}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TrackerMain = () => {
  const { theme, isDarkMode } = useTheme()
  const { userData, isAuthenticated, loading: authLoading } = useAuth()
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
  const [loadedJobs, setLoadedJobs] = useState([])
  const [hasMoreJobs, setHasMoreJobs] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const jobsCursorRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, job: null, company: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [mergeCompany, setMergeCompany] = useState({ isOpen: false, sourceCompany: null })
  const [mergeJob, setMergeJob] = useState({ isOpen: false, sourceJob: null, company: null })
  const [autoCloseMonths, setAutoCloseMonths] = useState(3)
  const [autoCloseModalOpen, setAutoCloseModalOpen] = useState(false)
  const [autoCloseRunning, setAutoCloseRunning] = useState(false)
  const [jobCounts, setJobCounts] = useState(null)
  const [listRefreshing, setListRefreshing] = useState(false)
  const isFirstJobsListFetchRef = useRef(true)

  const autoCloseMonthOptions = [1, 2, 3, 6, 9, 12, 18, 24]

  const refreshJobCounts = useCallback(async () => {
    if (!userData?.emailCode) return
    try {
      const counts = await getDashboardJobCounts(userData.emailCode)
      setJobCounts(counts)
    } catch {
      // Counts are supplementary; list still works
    }
  }, [userData?.emailCode])

  const companiesData = useMemo(
    () => transformJobsForDashboard(loadedJobs),
    [loadedJobs]
  )

  const refreshJobsFromStart = useCallback(
    async ({ showFullPageSpinner = true } = {}) => {
      if (!userData?.emailCode) return
      jobsCursorRef.current = null
      if (showFullPageSpinner) {
        setLoadedJobs([])
        setLoading(true)
      } else {
        setListRefreshing(true)
      }
      setError(null)
      try {
        const { jobs, lastDocSnapshot, hasMore } = await getJobsByTrackingCodePage(
          userData.emailCode,
          JOBS_PAGE_SIZE,
          null,
          selectedFilter
        )
        jobsCursorRef.current = lastDocSnapshot
        setHasMoreJobs(hasMore)
        setLoadedJobs(jobs)
      } catch (err) {
        if (showFullPageSpinner) {
          setError('Failed to load job applications. Please try again.')
        } else {
          showToast('Could not refresh the list for this filter.', 'error')
        }
      } finally {
        if (showFullPageSpinner) {
          setLoading(false)
          isFirstJobsListFetchRef.current = false
        } else {
          setListRefreshing(false)
        }
      }
    },
    [userData?.emailCode, selectedFilter, showToast]
  )

  const loadMoreJobs = useCallback(async () => {
    if (!userData?.emailCode || !hasMoreJobs || loadingMore || listRefreshing) return
    setLoadingMore(true)
    try {
      const { jobs, lastDocSnapshot, hasMore } = await getJobsByTrackingCodePage(
        userData.emailCode,
        JOBS_PAGE_SIZE,
        jobsCursorRef.current,
        selectedFilter
      )
      jobsCursorRef.current = lastDocSnapshot
      setHasMoreJobs(hasMore)
      if (jobs.length > 0) {
        setLoadedJobs((prev) => [...prev, ...jobs])
      }
    } catch {
      showToast('Failed to load more applications', 'error')
    } finally {
      setLoadingMore(false)
    }
  }, [userData?.emailCode, hasMoreJobs, loadingMore, listRefreshing, showToast, selectedFilter])

  const loadMoreSentinelRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !userData?.emailCode || loading || listRefreshing || !hasMoreJobs) return
    const el = loadMoreSentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting || loadingMore || listRefreshing) return
        loadMoreJobs()
      },
      {
        root: null,
        // Small bottom inset only — loads as you approach the end; avoids the old 240px “load everything” behavior
        rootMargin: '0px 0px 120px 0px',
        threshold: 0
      }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isAuthenticated, userData?.emailCode, loading, listRefreshing, hasMoreJobs, loadingMore, loadMoreJobs, selectedFilter])

  // Global stat counts (full tracker — not paginated / not filter-scoped)
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setJobCounts(null)
      return
    }
    if (!userData?.emailCode) {
      setJobCounts(null)
      return
    }
    refreshJobCounts()
  }, [authLoading, isAuthenticated, userData?.emailCode, refreshJobCounts])

  // Paginated list — refetch when filter changes; wait for auth so we never flash "no code" while Firestore user doc is still loading
  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      isFirstJobsListFetchRef.current = true
      setLoading(false)
      setListRefreshing(false)
      setLoadedJobs([])
      setHasMoreJobs(false)
      jobsCursorRef.current = null
      setError(null)
      return
    }

    if (!userData?.emailCode) {
      setLoading(false)
      setError('No tracking code found. Please check your profile settings.')
      return
    }

    refreshJobsFromStart({ showFullPageSpinner: isFirstJobsListFetchRef.current })
  }, [authLoading, isAuthenticated, userData?.emailCode, selectedFilter, refreshJobsFromStart])

  // Use real data if available, otherwise use empty array
  const displayData = companiesData.length > 0 ? companiesData : []

  const allRoles = displayData.flatMap(company => company.roles)

  const statCards = {
    total: jobCounts?.total ?? null,
    active: jobCounts?.active ?? null,
    interviews: jobCounts?.interviews ?? null
  }

  const statusFilters = useMemo(() => {
    const j = jobCounts
    return [
      { key: 'active', label: 'Active', count: j?.active ?? 0 },
      { key: 'all', label: 'All', count: j?.total ?? 0 },
      { key: 'applied', label: 'Applied', count: j?.applied ?? 0 },
      { key: 'screening', label: 'Screening', count: j?.screening ?? 0 },
      { key: 'interview', label: 'Interviews', count: j?.interviews ?? 0 },
      { key: 'offer', label: 'Offers', count: j?.offers ?? 0 },
      { key: 'rejected', label: 'Rejected', count: j?.rejected ?? 0 }
    ]
  }, [jobCounts])

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
              (selectedFilter === 'active' && !['rejected', 'offer'].includes(role.currentStage)) ||
              (selectedFilter === 'applied' && role.currentStage === 'applied') ||
              (selectedFilter === 'screening' && role.currentStage === 'screening') ||
              (selectedFilter === 'interview' && INTERVIEW_STAGES.includes(role.currentStage)) ||
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

  const visibleRoleCount = filteredCompanies.reduce((sum, c) => sum + c.roles.length, 0)
  const loadedRoleCount = allRoles.length

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

      const details = await getJobDetails(formData.id)
      setLoadedJobs((prev) =>
        prev.map((job) =>
          job.id === formData.id
            ? {
                ...job,
                Job_Title: formData.position,
                Location: formData.location,
                Salary: formData.salary,
                Contact: formData.contact,
                Current_Stage: formData.currentStage,
                Last_Updated: Timestamp.now(),
                Update_Time: Timestamp.now(),
                details
              }
            : job
        )
      )

      setEditingRole(null)
      setEditingCompany(null)
      await refreshJobCounts()
    } catch (error) {
      throw error // Re-throw to let Role_Edit handle the error toast
    }
  }

  // Handle refreshing data after email stage change
  const handleRefreshAfterStageChange = async () => {
    try {
      await refreshJobsFromStart({ showFullPageSpinner: false })
      await refreshJobCounts()
    } catch (error) {
      // Error refreshing data
    }
  }

  // Handle saving manual application
  const handleSaveManualApplication = async (formData) => {
    try {
      await addManualJob(formData, userData.emailCode, userData.id)

      await refreshJobsFromStart({ showFullPageSpinner: false })
      await refreshJobCounts()

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

      await refreshJobsFromStart({ showFullPageSpinner: false })
      await refreshJobCounts()

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

  // Handle merge company request
  const handleMergeRequest = (company) => {
    setMergeCompany({
      isOpen: true,
      sourceCompany: company
    })
  }

  // Handle merge company close
  const handleMergeClose = () => {
    setMergeCompany({ isOpen: false, sourceCompany: null })
  }

  // Handle merge completion - refresh data
  const handleMergeComplete = async () => {
    try {
      await refreshJobsFromStart({ showFullPageSpinner: false })
      await refreshJobCounts()
    } catch (error) {
      showToast('Failed to refresh data after merge', 'error')
    }
  }

  // Handle merge job request
  const handleMergeJobRequest = (job, company) => {
    setMergeJob({
      isOpen: true,
      sourceJob: job,
      company: company
    })
  }

  // Handle merge job close
  const handleMergeJobClose = () => {
    setMergeJob({ isOpen: false, sourceJob: null, company: null })
  }

  const handleConfirmAutoCloseStale = async () => {
    if (!userData?.emailCode) return
    setAutoCloseRunning(true)
    try {
      const result = await closeStaleOpenJobs(userData.emailCode, autoCloseMonths)
      if (result.closedCount > 0) {
        showToast(
          `Marked ${result.closedCount} application(s) as rejected (applied more than ${autoCloseMonths} month(s) ago).`,
          'success'
        )
        await refreshJobsFromStart({ showFullPageSpinner: false })
        await refreshJobCounts()
      } else {
        showToast('No open applications were old enough to close.', 'info')
      }
      setAutoCloseModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Failed to auto-close applications', 'error')
    } finally {
      setAutoCloseRunning(false)
    }
  }

  // Auth still resolving (refresh / first paint) — avoid demo or bogus "no tracking code" flash
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center">
          <DashboardSpinner theme={theme} size="lg" className="mx-auto mb-4" />
          <p style={{ color: theme.text.secondary }}>Signing you in…</p>
        </div>
      </div>
    )
  }

  // Not logged in state
  if (!isAuthenticated) {
    return <DashboardDemo />
  }

  // Error state (keep layout minimal; no blank dashboard shell for hard errors)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
               style={{ backgroundColor: theme.status.rejected + '20' }}>
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>
            Error Loading Applications
          </h3>
          <p className="mb-4" style={{ color: theme.text.secondary }}>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              if (userData?.emailCode) {
                refreshJobsFromStart({ showFullPageSpinner: true })
                refreshJobCounts()
              } else {
                window.location.reload()
              }
            }}
            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
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

        {loading ? (
          <DashboardInitialSkeleton theme={theme} />
        ) : (
          <>
        {/* Quick Stats - Horizontal Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{statCards.total == null ? '—' : statCards.total}</span>
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
                style={{ backgroundColor: theme.secondary[100] }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.secondary[600] }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{statCards.active == null ? '—' : statCards.active}</span>
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
              <span className="text-2xl font-bold" style={{ color: theme.text.primary }}>{statCards.interviews == null ? '—' : statCards.interviews}</span>
            </div>
            <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>Interviews</p>
          </div>
        </div>

        <p className="text-xs mb-6 -mt-4" style={{ color: theme.text.tertiary }}>
          Showing {visibleRoleCount} application{visibleRoleCount !== 1 ? 's' : ''}
          {loadedRoleCount !== visibleRoleCount ? ` (${loadedRoleCount} loaded for this filter)` : ''}
          {' '}(newest first)
          {hasMoreJobs ? ' — scroll down to load more' : loadedRoleCount > 0 ? ' — all loaded for this filter' : ''}
        </p>

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

          {/* Auto-close stale applications (open roles older than X months → rejected) */}
          <div
            className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-4 rounded-xl border mb-4"
            style={{
              backgroundColor: theme.background.primary,
              borderColor: theme.border.medium
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: theme.text.primary }}>
                Auto-disqualify stale applications
              </p>
              <p className="text-xs mt-1" style={{ color: theme.text.secondary }}>
                Marks open roles (not offer or rejected) as rejected if their applied date is older than your threshold. Jobs without an applied date are skipped. This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm whitespace-nowrap" style={{ color: theme.text.secondary }}>
                Older than
              </label>
              <select
                value={autoCloseMonths}
                onChange={(e) => setAutoCloseMonths(Number(e.target.value))}
                disabled={autoCloseRunning}
                className="px-3 py-2 rounded-lg border text-sm font-medium"
                style={{
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.medium,
                  color: theme.text.primary
                }}
              >
                {autoCloseMonthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? 'month' : 'months'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAutoCloseModalOpen(true)}
                disabled={autoCloseRunning}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.status.rejected + '25',
                  color: theme.status.rejected,
                  border: `1px solid ${theme.status.rejected}55`
                }}
              >
                Apply rule
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

        {/* Companies List Grouped by Company — filter changes refresh here only (no full-page skeleton) */}
        <div className="relative space-y-10 min-h-[120px]">
          {listRefreshing && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-16 rounded-xl pointer-events-auto"
              style={{ backgroundColor: `${theme.background.secondary}cc` }}
              aria-busy="true"
              aria-label="Updating list"
            >
              <div className="relative mb-3 flex items-center justify-center">
                <DashboardSpinner theme={theme} size="md" withGlow />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>
                Updating list…
              </p>
            </div>
          )}
          <div className={listRefreshing ? 'opacity-50 motion-reduce:opacity-100' : ''}>
          {filteredCompanies.map((company) => (
            <section
              key={company.id}
              className="rounded-2xl overflow-hidden border shadow-lg transition-shadow hover:shadow-xl"
              style={{
                backgroundColor: theme.background.primary,
                borderColor: theme.border.medium,
                boxShadow: isDarkMode
                  ? '0 10px 36px -10px rgba(0, 0, 0, 0.5)'
                  : '0 8px 30px -8px rgba(15, 23, 42, 0.12)'
              }}
              aria-labelledby={`company-heading-${company.id}`}
            >
              {/* Company accent */}
              <div
                className="h-1 w-full"
                style={{
                  background: `linear-gradient(90deg, ${theme.primary[600]}, ${theme.primary[400]})`
                }}
                aria-hidden
              />

              {/* Company header — distinct band */}
              <div
                className="px-5 py-4 sm:px-6 sm:py-5 border-b"
                style={{
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.light
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md"
                      style={{ backgroundColor: theme.primary[600] }}
                    >
                      {company.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: theme.text.tertiary }}>
                        Company
                      </p>
                      <h3 id={`company-heading-${company.id}`} className="text-xl font-bold truncate" style={{ color: theme.text.primary }}>
                        {company.company}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color: theme.text.secondary }}>
                        {company.location ? `${company.location} · ` : ''}
                        {company.roles.length} {company.roles.length === 1 ? 'application' : 'applications'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMergeRequest(company)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                    style={{
                      backgroundColor: theme.secondary[100],
                      color: theme.secondary[600],
                      border: `1px solid ${theme.secondary[200]}`
                    }}
                    title="Merge this company with another"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="hidden sm:inline">Merge</span>
                  </button>
                </div>
              </div>

              {/* Roles — each application is its own card */}
              <div
                className="p-4 sm:p-5 flex flex-col gap-4"
                style={{ backgroundColor: theme.background.secondary }}
              >
                {company.roles.map((role, roleIndex) => {
                  const isExpanded = expandedRoles.has(role.id)
                  const stageInfo = getStageInfo(role.currentStage)

                  return (
                    <article
                      key={role.id}
                      className="rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: theme.background.primary,
                        borderColor: theme.border.light,
                        boxShadow: isExpanded
                          ? isDarkMode
                            ? '0 8px 28px -4px rgba(0, 0, 0, 0.5)'
                            : '0 6px 24px -6px rgba(15, 23, 42, 0.14)'
                          : isDarkMode
                            ? '0 1px 3px rgba(0, 0, 0, 0.35)'
                            : '0 1px 3px rgba(15, 23, 42, 0.06)'
                      }}
                    >
                      {company.roles.length > 1 && (
                        <div
                          className="px-4 sm:px-5 pt-3 flex items-center justify-between border-b"
                          style={{ borderColor: theme.border.light, backgroundColor: theme.background.secondary }}
                        >
                          <span
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: theme.text.tertiary }}
                          >
                            Application {roleIndex + 1} of {company.roles.length}
                          </span>
                          <span className="text-[11px] hidden sm:inline" style={{ color: theme.text.tertiary }}>
                            Tap row to expand timeline
                          </span>
                        </div>
                      )}

                      <div
                        className="px-4 py-4 sm:px-5 sm:py-5 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isExpanded ? theme.background.secondary : theme.background.primary
                        }}
                        onClick={() => toggleRoleExpansion(role.id)}
                        aria-expanded={isExpanded}
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

                              {/* Edit, Merge & Delete Buttons */}
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

                                {/* Merge Job Button - only show if there are other jobs in the company */}
                                {company.roles.length > 1 && (
                                  <button
                                    className="p-2 rounded-lg hover:bg-opacity-20 transition-all"
                                    style={{ 
                                      color: theme.secondary[600],
                                      backgroundColor: theme.secondary[100]
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMergeJobRequest(role, company)
                                    }}
                                    title="Merge with another job in this company"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                  </button>
                                )}

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
                          className="px-4 py-5 sm:px-5 sm:py-6 border-t"
                          style={{
                            backgroundColor: theme.background.secondary,
                            borderColor: theme.border.light
                          }}
                        >
                          <h5 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: theme.text.secondary }}>
                            Application timeline
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
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
          </div>
        </div>

        {hasMoreJobs && !loading && !listRefreshing && (
          <div
            ref={loadMoreSentinelRef}
            className="flex flex-col items-center justify-center py-10 min-h-[5rem]"
            aria-hidden
          >
            {loadingMore && (
              <>
                <DashboardSpinner theme={theme} size="sm" />
                <p className="text-sm mt-2" style={{ color: theme.text.secondary }}>
                  Loading more…
                </p>
              </>
            )}
          </div>
        )}

        {/* Filter / search: nothing matches but more pages may exist */}
        {filteredCompanies.length === 0 && loadedJobs.length > 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-sm font-medium mb-1" style={{ color: theme.text.primary }}>
              No applications match your search or filters
            </p>
            <p className="text-xs" style={{ color: theme.text.secondary }}>
              {hasMoreJobs ? 'Scroll down — older applications may load and match.' : 'Try changing filters or search.'}
            </p>
          </div>
        )}

        {/* Empty State — no data at all */}
        {filteredCompanies.length === 0 && loadedJobs.length === 0 && !hasMoreJobs && (
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
          </>
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

      <MergeCompany
        isOpen={mergeCompany.isOpen}
        onClose={handleMergeClose}
        sourceCompany={mergeCompany.sourceCompany}
        allCompanies={companiesData}
        onMergeComplete={handleMergeComplete}
      />

      <MergeJob
        isOpen={mergeJob.isOpen}
        onClose={handleMergeJobClose}
        sourceJob={mergeJob.sourceJob}
        company={mergeJob.company}
        onMergeComplete={handleMergeComplete}
      />

      {autoCloseModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auto-close-title"
        >
          <div
            className="max-w-md w-full rounded-2xl shadow-xl border p-6"
            style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}
          >
            <h3 id="auto-close-title" className="text-lg font-bold mb-2" style={{ color: theme.text.primary }}>
              Confirm auto-disqualify
            </h3>
            <p className="text-sm mb-3" style={{ color: theme.text.secondary }}>
              Every open application (excluding offers and already rejected) with an applied date older than{' '}
              <strong style={{ color: theme.text.primary }}>
                {autoCloseMonths} {autoCloseMonths === 1 ? 'month' : 'months'}
              </strong>{' '}
              will be marked as rejected. This is not reversible from JobSync.
            </p>
            <p
              className="text-sm font-medium mb-6 p-3 rounded-lg"
              style={{ backgroundColor: theme.status.rejected + '18', color: theme.status.rejected }}
            >
              This cannot be undone. Consider exporting or noting anything you need before continuing.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !autoCloseRunning && setAutoCloseModalOpen(false)}
                disabled={autoCloseRunning}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{
                  borderColor: theme.border.medium,
                  color: theme.text.secondary,
                  backgroundColor: theme.background.secondary
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAutoCloseStale}
                disabled={autoCloseRunning}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: theme.status.rejected }}
              >
                {autoCloseRunning ? 'Working…' : 'Yes, disqualify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackerMain
