import React, { useMemo, useState, useEffect } from 'react'
import { useTheme } from '../../App'
import { useAuth } from '../../contexts/GlobalProvider'
import AddH1BCompany from './components/Add_H1B_Company'
import AddH1BCompanyRole from './components/Add_H1B_Company_Role'
import { fetchH1BCompaniesList, fetchCompanyRoles, createH1BCompany, createH1BCompanyRole, voteCompany as apiVoteCompany, voteRole as apiVoteRole } from '../../lib/h1bcap'
import { useToast } from '../../toast/Toast'
import { trackEvent } from '../../utils/analytics'

const STORAGE_KEY = 'jobsync_h1b_company_votes'
const STORAGE_KEY_POS = 'jobsync_h1b_position_votes'

const H1BCap = () => {
  const { theme } = useTheme()
  const { userData, isAuthenticated } = useAuth()
  const showToast = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | supports | nosupport
  const [sortBy, setSortBy] = useState('companyName') // companyName | voteRate | lastResponse
  const [sortOrder, setSortOrder] = useState('asc') // asc, desc
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [expanded, setExpanded] = useState({})
  const [votes, setVotes] = useState({}) // company-level historical votes (kept for compatibility)
  const [posVotes, setPosVotes] = useState({}) // key: `${companyId}_${positionId}` -> 'yes' | 'no'
  const [companies, setCompanies] = useState([])
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [activeCompanyForRole, setActiveCompanyForRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingRoles, setLoadingRoles] = useState({}) // Track loading state for individual companies
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)

  // Sort options for the dropdown (memoized to prevent recreating on every render)
  const sortOptions = useMemo(() => [
    { value: 'companyName', label: 'Company Name', icon: '🏢' },
    { value: 'voteRate', label: 'Vote Rate', icon: '📊' },
    { value: 'lastResponse', label: 'Last Response', icon: '🕒' }
  ], [])

  // Items per page options
  const itemsPerPageOptions = [25, 50, 100, 200]

  // Load initial data + persisted votes (lightweight load without roles)
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchH1BCompaniesList()
        const list = Array.isArray(data) ? data : []
        setCompanies(list)
      } catch (e) {
        console.error('Error fetching H1B data:', e)
        setCompanies([])
      } finally {
        setLoading(false)
      }
    })()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setVotes(JSON.parse(raw))
    } catch {}
    try {
      const rawPos = localStorage.getItem(STORAGE_KEY_POS)
      if (rawPos) setPosVotes(JSON.parse(rawPos))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(posVotes))
    } catch {}
  }, [votes, posVotes])

  // Reset to page 1 when filters, sort, or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [query, filter, sortBy, sortOrder])

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
              const defaultOrder = ['lastResponse'].includes(selectedOption) ? 'desc' : 'asc'
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

  const filteredCompanies = useMemo(() => {
    let list = companies
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }
    if (filter === 'supports') list = list.filter(c => c.supportsSponsorship)
    if (filter === 'nosupport') list = list.filter(c => !c.supportsSponsorship)
    
    // Apply sorting
    const sortedList = [...list].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'companyName':
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
          break
        case 'voteRate':
          // Calculate vote rate (yes percentage)
          const aYes = a.companyVotesYes || 0
          const aNo = a.companyVotesNo || 0
          const aAgg = (a.positions && a.positions.length > 0) 
            ? a.positions.reduce((acc, p) => ({ yes: acc.yes + (p.votesYes || 0), no: acc.no + (p.votesNo || 0) }), { yes: 0, no: 0 })
            : { yes: 0, no: 0 }
          const aTotal = (aYes + aNo) > 0 ? (aYes + aNo) : (aAgg.yes + aAgg.no)
          const aRate = aTotal > 0 ? ((aYes > 0 || aAgg.yes > 0) ? ((aYes + aAgg.yes) / aTotal) : 0) : 0
          
          const bYes = b.companyVotesYes || 0
          const bNo = b.companyVotesNo || 0
          const bAgg = (b.positions && b.positions.length > 0)
            ? b.positions.reduce((acc, p) => ({ yes: acc.yes + (p.votesYes || 0), no: acc.no + (p.votesNo || 0) }), { yes: 0, no: 0 })
            : { yes: 0, no: 0 }
          const bTotal = (bYes + bNo) > 0 ? (bYes + bNo) : (bAgg.yes + bAgg.no)
          const bRate = bTotal > 0 ? ((bYes > 0 || bAgg.yes > 0) ? ((bYes + bAgg.yes) / bTotal) : 0) : 0
          
          aValue = aRate
          bValue = bRate
          break
        case 'lastResponse':
          aValue = a.lastVoteAt || 0
          bValue = b.lastVoteAt || 0
          break
        default:
          aValue = (a.name || '').toLowerCase()
          bValue = (b.name || '').toLowerCase()
      }
      
      if (sortBy === 'voteRate' || sortBy === 'lastResponse') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      }
    })
    
    return sortedList
  }, [companies, query, filter, sortBy, sortOrder])

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    const finalSortBy = newSortBy
    let finalSortOrder
    if (newSortBy === sortBy) {
      // If same sort by, toggle order
      finalSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      setSortOrder(finalSortOrder)
    } else {
      // New sort by, set default order based on type
      finalSortOrder = ['lastResponse'].includes(newSortBy) ? 'desc' : 'asc'
      setSortBy(newSortBy)
      setSortOrder(finalSortOrder)
    }
    setDropdownOpen(false)
    // Track sort change
    trackEvent('h1b_sort_changed', {
      sort_by: finalSortBy,
      sort_order: finalSortOrder
    })
  }

  // Get current sort option
  const currentSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0]

  // Handle filter change with tracking
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    trackEvent('h1b_filter_changed', {
      filter_type: newFilter
    })
  }

  // Handle pagination change with tracking
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    trackEvent('h1b_page_changed', {
      page_number: newPage,
      items_per_page: itemsPerPage
    })
  }

  // Handle items per page change with tracking
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    trackEvent('h1b_items_per_page_changed', {
      items_per_page: newItemsPerPage
    })
  }

  // Pagination calculations
  const totalItems = filteredCompanies.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex)

  // Track search query changes (debounced) - must be after filteredCompanies is defined
  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        trackEvent('h1b_search_performed', {
          search_query: query.trim(),
          results_count: filteredCompanies.length
        })
      }, 1000) // Debounce by 1 second
      return () => clearTimeout(timeoutId)
    }
  }, [query, filteredCompanies.length])

  const toggleExpand = async (id) => {
    const isCurrentlyExpanded = expanded[id]
    const newExpandedState = !isCurrentlyExpanded
    setExpanded(prev => ({ ...prev, [id]: newExpandedState }))
    
    // Track expand/collapse event
    trackEvent('h1b_company_expanded', {
      company_id: id,
      action: newExpandedState ? 'expanded' : 'collapsed'
    })
    
    // If expanding and positions not loaded, fetch them
    if (!isCurrentlyExpanded) {
      const company = companies.find(c => c.id === id)
      if (company && (!company.positions || company.positions.length === 0)) {
        setLoadingRoles(prev => ({ ...prev, [id]: true }))
        try {
          const roles = await fetchCompanyRoles(id)
          setCompanies(prev => prev.map(c => 
            c.id === id ? { ...c, positions: roles } : c
          ))
        } catch (e) {
          console.error('Error fetching roles:', e)
        } finally {
          setLoadingRoles(prev => ({ ...prev, [id]: false }))
        }
      }
    }
  }

  const handleVote = async (companyId, type) => {
    const previous = votes[companyId]
    setVotes(prev => ({ ...prev, [companyId]: type }))
    try {
      // Use authenticated uid if available, otherwise a stable local id
      const userId = (isAuthenticated && (userData?.uid || userData?.id)) || localStorage.getItem('jobsync_uid') || 'anonymous'
      const res = await apiVoteCompany(companyId, userId, type)
      if (res?.status === 'same') {
        showToast(`You already voted ${type} for this company.`, 'info')
      } else if (res?.status === 'changed') {
        showToast(`Updated your vote to ${type}.`, 'success')
      } else {
        showToast('Thanks for voting!', 'success')
      }
      // Track vote event
      trackEvent('h1b_company_vote', {
        company_id: companyId,
        vote_type: type,
        action: res?.status || 'new'
      })
      // Refresh only the company that was voted on
      const refreshed = await fetchH1BCompaniesList()
      setCompanies(refreshed)
    } catch {}
  }

  const handlePositionVote = async (companyId, positionId, type) => {
    const key = `${companyId}_${positionId}`
    const prev = posVotes[key]
    setPosVotes(prevMap => ({ ...prevMap, [key]: type }))
    try {
      const userId = (isAuthenticated && (userData?.uid || userData?.id)) || localStorage.getItem('jobsync_uid') || 'anonymous'
      const res = await apiVoteRole(positionId, userId, type)
      if (res?.status === 'same') {
        showToast(`You already voted ${type} for this role.`, 'info')
      } else if (res?.status === 'changed') {
        showToast(`Updated your role vote to ${type}.`, 'success')
      } else {
        showToast('Thanks for voting on this role!', 'success')
      }
      // Track role vote event
      trackEvent('h1b_role_vote', {
        company_id: companyId,
        role_id: positionId,
        vote_type: type,
        action: res?.status || 'new'
      })
      // Update the role vote counts for this company
      const roles = await fetchCompanyRoles(companyId)
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, positions: roles } : c
      ))
    } catch {}
  }

  // Add company
  const addCompany = async (payload) => {
    try {
      const name = payload.name.trim()
      const website = (payload.website || '').trim()
      await createH1BCompany({ name, website })
      // Track company added event
      trackEvent('h1b_company_added', {
        company_name: name,
        has_website: !!website
      })
      const refreshed = await fetchH1BCompaniesList()
      setCompanies(refreshed)
      setIsAddCompanyOpen(false)
    } catch {}
  }

  // Add role to a company
  const addRole = async (companyId, payload) => {
    try {
      const title = payload.title.trim()
      const location = payload.location.trim()
      const link = (payload.link || '').trim()
      await createH1BCompanyRole(companyId, { title, location, link })
      // Track role added event
      trackEvent('h1b_role_added', {
        company_id: companyId,
        role_title: title,
        has_location: !!location,
        has_link: !!link
      })
      // Refresh company list to get updated role count
      const refreshed = await fetchH1BCompaniesList()
      setCompanies(refreshed)
      setIsAddRoleOpen(false)
      setActiveCompanyForRole(null)
    } catch {}
  }

  const chip = (label, color) => (
    <span 
      className="text-xs px-2 py-1 rounded-full font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {label}
    </span>
  )

  const timeAgo = (ms) => {
    if (!ms) return null
    const diff = Date.now() - ms
    if (diff < 60000) return 'just now'
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
                   style={{ borderColor: theme.primary[600], borderTopColor: 'transparent' }}></div>
              <p style={{ color: theme.text.secondary }}>Loading companies...</p>
            </div>
          </div>
        )}

        {/* Full Empty State - Only when no companies exist at all */}
        {!loading && companies.length === 0 && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.primary[100] }}>
                <span className="text-5xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: theme.text.primary }}>
                No Companies Found
              </h3>
              <p className="text-base mb-6" style={{ color: theme.text.secondary }}>
                No companies have been added yet. Be the first to add one and help the community!
              </p>
              {isAuthenticated && (
                <button
                  onClick={() => setIsAddCompanyOpen(true)}
                  className="px-6 py-3 rounded-xl text-sm font-medium shadow-lg transition-all hover:shadow-xl"
                  style={{ background: theme.gradients.primary, color: theme.text.inverse }}
                >
                  + Add Your First Company
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content - Show when there are companies (even if filtered out) */}
        {!loading && companies.length > 0 && (
          <>
        {/* Authentication Banner */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-4" style={{ backgroundColor: theme.primary[50] || theme.background.secondary, borderColor: theme.primary[200] || theme.border.light }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.primary[100] || theme.background.primary }}>
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text.primary }}>Sign in to vote and add companies</p>
                <p className="text-xs" style={{ color: theme.text.secondary }}>Help the community by sharing your experience with the H‑1B sponsorship</p>
              </div>
            </div>
            <a
              href="/Sign_In"
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-sm hover:shadow-md transition-all"
              style={{ background: theme.gradients.primary, color: theme.text.inverse }}
            >
              Sign In
            </a>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text.primary }}>H‑1B Sponsorship Companies & Roles Directory</h1>
              <p className="text-sm" style={{ color: theme.text.secondary }}>Community-sourced list of companies and whether they sponsor. Vote to help others.</p>
            </div>
            <div className="mt-1">
              <button
                disabled={!isAuthenticated}
                onClick={() => {
                  if (!isAuthenticated) {
                    showToast('Please sign in to add companies', 'info')
                  } else {
                    setIsAddCompanyOpen(true)
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all relative group"
                style={{ background: theme.gradients.primary, color: theme.text.inverse, opacity: !isAuthenticated ? 0.5 : 1, cursor: !isAuthenticated ? 'not-allowed' : 'pointer' }}
                title={isAuthenticated ? 'Add a company' : 'Sign in to add a company'}
              >
                + Add Company
                {!isAuthenticated && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    <div className="px-3 py-2 rounded-lg shadow-lg text-xs" style={{ backgroundColor: theme.text.primary, color: theme.text.inverse }}>
                      Sign in to add companies
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                        <div className="w-2 h-2 transform rotate-45" style={{ backgroundColor: theme.text.primary }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies..."
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
                    minWidth: '250px'
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
                onClick={() => {
                  const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
                  setSortOrder(newOrder)
                  trackEvent('h1b_sort_changed', {
                    sort_by: sortBy,
                    sort_order: newOrder
                  })
                }}
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

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: filter === 'all' ? theme.primary[600] : theme.background.primary, color: filter === 'all' ? theme.text.inverse : theme.text.primary, border: `1px solid ${theme.border.light}` }}
            >All</button>
            <button
              onClick={() => handleFilterChange('supports')}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: filter === 'supports' ? theme.status.offer : theme.background.primary, color: filter === 'supports' ? theme.text.inverse : theme.text.primary, border: `1px solid ${theme.border.light}` }}
            >Supports</button>
            <button
              onClick={() => handleFilterChange('nosupport')}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: filter === 'nosupport' ? theme.status.rejected : theme.background.primary, color: filter === 'nosupport' ? theme.text.inverse : theme.text.primary, border: `1px solid ${theme.border.light}` }}
            >No Support</button>
          </div>
        </div>

        {/* List or Filtered Empty State */}
        {filteredCompanies.length > 0 ? (
          <div className="space-y-4">
            {paginatedCompanies.map((c) => {
            // Prefer company-level votes if available, else aggregate from roles
            const companyYes = c.companyVotesYes || 0
            const companyNo = c.companyVotesNo || 0
            const hasCompanyVotes = (companyYes + companyNo) > 0
            const agg = (c.positions && c.positions.length > 0)
              ? c.positions.reduce((acc, p) => ({ yes: acc.yes + (p.votesYes || 0), no: acc.no + (p.votesNo || 0) }), { yes: 0, no: 0 })
              : { yes: 0, no: 0 }
            const totalVotes = hasCompanyVotes ? (companyYes + companyNo) : (agg.yes + agg.no)
            const yesBase = hasCompanyVotes ? companyYes : agg.yes
            const yesPct = totalVotes > 0 ? Math.round((yesBase / totalVotes) * 100) : 0
            const noPct = 100 - yesPct
            const roleCount = c.roleCount || (c.positions ? c.positions.length : 0)
            return (
              <div key={c.id} className="rounded-2xl p-4 border hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Left arrow toggle with larger target and label */}
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="px-3 h-10 rounded-xl flex items-center gap-2 border hover:shadow-sm transition-all"
                        aria-expanded={expanded[c.id] ? 'true' : 'false'}
                        title={expanded[c.id] ? 'Hide roles' : 'Show roles'}
                        style={{ borderColor: theme.border.light, color: theme.text.primary, backgroundColor: theme.background.primary }}
                      >
                        <span style={{ display: 'inline-block', transform: expanded[c.id] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>➤</span>
                        <span className="text-sm" style={{ color: theme.text.secondary }}>Roles {`(${roleCount})`}</span>
                      </button>
                      <span className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: theme.text.primary }}>{c.name}</span>
                        {c.website && c.website !== '#' && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 hover:opacity-90 transition"
                            style={{ backgroundColor: theme.primary[100], color: theme.primary[600] }}
                            title={c.website}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            Visit site
                          </a>
                        )}
                      </span>
                      {totalVotes > 0 && (
                        c.supportsSponsorship
                          ? chip('Sponsorship', theme.status.offer)
                          : chip('No Sponsorship', theme.status.rejected)
                      )}
                      {roleCount > 0 && chip(`${roleCount} ${roleCount === 1 ? 'role' : 'roles'}`, theme.primary[600])}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={!isAuthenticated}
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please sign in to vote', 'info')
                        } else {
                          handleVote(c.id, 'yes')
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-medium relative group"
                      style={{ backgroundColor: theme.status.offer, color: theme.text.inverse, opacity: !isAuthenticated ? 0.5 : 1, cursor: !isAuthenticated ? 'not-allowed' : 'pointer' }}
                      title={isAuthenticated ? 'Agree' : 'Sign in to vote'}
                    >
                      Agree
                      {!isAuthenticated && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="px-3 py-2 rounded-lg shadow-lg text-xs" style={{ backgroundColor: theme.text.primary, color: theme.text.inverse }}>
                            Sign in to vote
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                              <div className="w-2 h-2 transform rotate-45" style={{ backgroundColor: theme.text.primary }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                    <button
                      disabled={!isAuthenticated}
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please sign in to vote', 'info')
                        } else {
                          handleVote(c.id, 'no')
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-medium relative group"
                      style={{ backgroundColor: theme.status.rejected, color: theme.text.inverse, opacity: !isAuthenticated ? 0.5 : 1, cursor: !isAuthenticated ? 'not-allowed' : 'pointer' }}
                      title={isAuthenticated ? 'Disagree' : 'Sign in to vote'}
                    >
                      Disagree
                      {!isAuthenticated && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="px-3 py-2 rounded-lg shadow-lg text-xs" style={{ backgroundColor: theme.text.primary, color: theme.text.inverse }}>
                            Sign in to vote
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                              <div className="w-2 h-2 transform rotate-45" style={{ backgroundColor: theme.text.primary }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                    <button
                      disabled={!isAuthenticated}
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please sign in to add roles', 'info')
                        } else {
                          setActiveCompanyForRole(c)
                          setIsAddRoleOpen(true)
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-sm font-medium relative group"
                      style={{ background: theme.gradients.primary, color: theme.text.inverse, opacity: !isAuthenticated ? 0.5 : 1, cursor: !isAuthenticated ? 'not-allowed' : 'pointer' }}
                      title={isAuthenticated ? 'Add a role' : 'Sign in to add roles'}
                    >
                      + Add Role
                      {!isAuthenticated && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="px-3 py-2 rounded-lg shadow-lg text-xs" style={{ backgroundColor: theme.text.primary, color: theme.text.inverse }}>
                            Sign in to add roles
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                              <div className="w-2 h-2 transform rotate-45" style={{ backgroundColor: theme.text.primary }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Vote meter or LCA source info */}
                <div className="mt-3">
                  {totalVotes > 0 ? (
                    <>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.background.tertiary }}>
                        <div className="h-full" style={{ width: `${yesPct}%`, backgroundColor: theme.status.offer }} />
                      </div>
                      <div className="flex justify-between text-xs mt-1" style={{ color: theme.text.secondary }}>
                        <span>{yesPct}% agree</span>
                        <span className="flex items-center gap-3">
                          <span>{noPct}% disagree</span>
                          {c.lastVoteAt && (
                            <span className="opacity-80">Last vote {timeAgo(c.lastVoteAt)}</span>
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs" style={{ color: theme.text.secondary }}>
                      <span className="opacity-80">
                        {c.sourceUrl ? (
                          <>Based on LCA data from <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:opacity-70 transition" style={{ color: theme.primary[600] }}>H1B Data</a>. Vote to update status.</>
                        ) : (
                          <>No votes yet. Community voting will help determine sponsorship status.</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Positions (per-role voting) */}
                {expanded[c.id] && (
                  <div className="mt-4">
                    {loadingRoles[c.id] ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3" 
                               style={{ borderColor: theme.primary[600], borderTopColor: 'transparent' }}></div>
                          <p className="text-sm" style={{ color: theme.text.secondary }}>Loading roles...</p>
                        </div>
                      </div>
                    ) : c.positions && c.positions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {c.positions.map((p) => {
                      const key = `${c.id}_${p.id}`
                      const total = (p.votesYes || 0) + (p.votesNo || 0)
                      const yes = total > 0 ? Math.round(((p.votesYes || 0) / total) * 100) : 0
                      const userVote = posVotes[key]
                      return (
                        <div key={p.id} className="p-4 rounded-xl border hover:shadow-md transition-all duration-200"
                          style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold" style={{ color: theme.text.primary }}>{p.title}</div>
                              <div className="text-xs mt-0.5" style={{ color: theme.text.secondary }}>{p.location}</div>
                            </div>
                            {p.link && p.link !== '#' && (
                              <a
                                href={p.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1 hover:opacity-90 transition"
                                style={{ backgroundColor: theme.primary[100], color: theme.primary[600] }}
                                title={p.link}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                Job link
                              </a>
                            )}
                          </div>

                          {/* Meter */}
                          <div className="mt-3">
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.background.tertiary }}>
                              <div className="h-full" style={{ width: `${yes}%`, backgroundColor: theme.status.offer }} />
                            </div>
                            <div className="flex justify-between text-xs mt-1" style={{ color: theme.text.secondary }}>
                              <span>{yes}% agree</span>
                              <span className="flex items-center gap-3">
                                <span>{total} votes</span>
                                {p.lastVoteAt && (
                                  <span className="opacity-80">Last vote {timeAgo(p.lastVoteAt)}</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Segmented vote control */}
                          <div className="mt-3">
                            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: theme.border.light }}>
                              <button
                                disabled={!isAuthenticated}
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    showToast('Please sign in to vote', 'info')
                                  } else {
                                    handlePositionVote(c.id, p.id, 'yes')
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium transition-all relative group"
                                style={{
                                  backgroundColor: userVote === 'yes' ? theme.status.offer : theme.background.primary,
                                  color: userVote === 'yes' ? theme.text.inverse : theme.text.primary,
                                  opacity: !isAuthenticated ? 0.6 : 1,
                                  cursor: !isAuthenticated ? 'not-allowed' : 'pointer'
                                }}
                                title={isAuthenticated ? 'Agree' : 'Sign in to vote'}
                              >
                                👍 Agree
                                {!isAuthenticated && (
                                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                    <div className="px-2 py-1 rounded text-xs shadow-lg" style={{ backgroundColor: theme.text.primary, color: theme.text.inverse }}>
                                      Sign in to vote
                                    </div>
                                  </div>
                                )}
                              </button>
                              <button
                                disabled={!isAuthenticated}
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    showToast('Please sign in to vote', 'info')
                                  } else {
                                    handlePositionVote(c.id, p.id, 'no')
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium transition-all border-l relative group"
                                style={{
                                  backgroundColor: userVote === 'no' ? theme.status.rejected : theme.background.primary,
                                  color: userVote === 'no' ? theme.text.inverse : theme.text.primary,
                                  borderColor: theme.border.light,
                                  opacity: !isAuthenticated ? 0.6 : 1,
                                  cursor: !isAuthenticated ? 'not-allowed' : 'pointer'
                                }}
                                title={isAuthenticated ? 'Disagree' : 'Sign in to vote'}
                              >
                                👎 Disagree
                                {!isAuthenticated && (
                                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                    <div className="px-2 py-1 rounded text-xs shadow-lg" style={{ backgroundColor: theme.text.primary, color: theme.text.inverse }}>
                                      Sign in to vote
                                    </div>
                                  </div>
                                )}
                              </button>
                            </div>
                            {userVote && (
                              <div className="text-xs mt-2" style={{ color: theme.text.secondary }}>
                                You voted: <span style={{ color: userVote === 'yes' ? theme.status.offer : theme.status.rejected }}>{userVote === 'yes' ? 'Agree' : 'Disagree'}</span>. You can change your vote anytime.
                              </div>
                            )}
                          </div>
                        </div>
                      )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 rounded-xl border" style={{ backgroundColor: theme.background.primary, borderColor: theme.border.light }}>
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm font-medium" style={{ color: theme.text.secondary }}>No roles added yet</p>
                        <p className="text-xs mt-1" style={{ color: theme.text.tertiary }}>Be the first to add a role for this company!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile extra button removed for cleaner UX */}
              </div>
            )
          })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center max-w-lg">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.background.tertiary }}>
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>
                No Companies Match Your Filters
              </h3>
              <p className="text-sm mb-6" style={{ color: theme.text.secondary }}>
                {query.trim() 
                  ? `We couldn't find any companies matching "${query}" with the current filters. Try adjusting your search or filters.`
                  : filter === 'supports' 
                    ? 'No companies found that support sponsorship. Try changing the filter or adding a company.'
                    : filter === 'nosupport'
                      ? 'No companies found that don\'t support sponsorship. Try changing the filter.'
                      : 'No companies found. Try adjusting your filters.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                {query.trim() && (
                  <button
                    onClick={() => setQuery('')}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: theme.background.primary, 
                      borderColor: theme.border.medium,
                      color: theme.text.primary 
                    }}
                  >
                    Clear Search
                  </button>
                )}
                {(filter !== 'all') && (
                  <button
                    onClick={() => handleFilterChange('all')}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-md"
                    style={{ background: theme.gradients.primary, color: theme.text.inverse }}
                  >
                    Show All Companies
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredCompanies.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Info */}
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: theme.text.secondary }}>
                Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of {totalItems} companies
              </span>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: theme.text.secondary }}>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: theme.background.primary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary,
                    focusRingColor: theme.primary[600]
                  }}
                >
                  {itemsPerPageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.background.primary,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.medium}`
                }}
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.background.primary,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.medium}`
                }}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1
                  // Show first page, last page, current page, and pages around current
                  const showPage = pageNum === 1 || 
                                  pageNum === totalPages || 
                                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  
                  if (!showPage) {
                    // Show ellipsis
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="px-2" style={{ color: theme.text.secondary }}>...</span>
                      )
                    }
                    return null
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum ? 'shadow-md' : ''
                      }`}
                      style={{
                        backgroundColor: currentPage === pageNum ? theme.primary[600] : theme.background.primary,
                        color: currentPage === pageNum ? theme.text.inverse : theme.text.primary,
                        border: `1px solid ${currentPage === pageNum ? theme.primary[600] : theme.border.medium}`
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.background.primary,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.medium}`
                }}
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.background.primary,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.medium}`
                }}
              >
                Last
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Add Company Modal */}
      <AddH1BCompany isOpen={isAddCompanyOpen} onClose={() => setIsAddCompanyOpen(false)} onSubmit={addCompany} />

      {/* Add Role Modal */}
      <AddH1BCompanyRole
        isOpen={isAddRoleOpen && !!activeCompanyForRole}
        onClose={() => { setIsAddRoleOpen(false); setActiveCompanyForRole(null) }}
        onSubmit={(payload) => addRole(activeCompanyForRole.id, payload)}
        companyName={activeCompanyForRole?.name || ''}
      />
    </div>
  )
}

export default H1BCap


