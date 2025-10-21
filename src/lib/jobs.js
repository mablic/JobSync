import { db } from './firebase'
import { collection, query, where, getDocs, getDoc, orderBy, doc, updateDoc, addDoc, Timestamp, deleteDoc } from 'firebase/firestore'

/**
 * Get all jobs for a user by their tracking code
 * @param {string} trackingCode - User's email tracking code
 * @returns {Array} - Array of job applications with details
 */
export const getJobsByTrackingCode = async (trackingCode) => {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('Tracking_Code', '==', trackingCode.toUpperCase()),
      orderBy('Last_Updated', 'desc')
    )
    const snapshot = await getDocs(q)
    
    const jobs = []
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      
      // Skip jobs that have been merged into another job
      if (data._merged_into) {
        continue
      }
      
      const jobData = {
        id: docSnap.id,
        ...data
      }
      
      // Fetch job details for this job
      const details = await getJobDetails(docSnap.id)
      jobData.details = details
      
      jobs.push(jobData)
    }
    
    return jobs
  } catch (error) {
    throw error
  }
}

/**
 * Get job details (emails/stages) for a specific job
 * @param {string} jobId - Job document ID
 * @returns {Array} - Array of job detail records
 */
export const getJobDetails = async (jobId) => {
  try {
    const q = query(
      collection(db, 'job_details'),
      where('Job_ID', '==', jobId),
      orderBy('Update_Time', 'asc')
    )
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    throw error
  }
}

/**
 * Get email content from mailin collection
 * @param {string} emailId - Document ID from mailin collection
 * @returns {Object|null} - Email data or null
 */
export const getEmailContent = async (emailId) => {
  try {
    const emailDocRef = doc(db, 'mailin', emailId)
    const emailDoc = await getDoc(emailDocRef)
    if (emailDoc.exists()) {
      return {
        id: emailDoc.id,
        ...emailDoc.data()
      }
    }
    return null
  } catch (error) {
    throw error
  }
}

/**
 * Transform Firebase job data to Dashboard format
 * Groups jobs by company and formats stages for timeline display
 * @param {Array} jobs - Raw jobs from Firebase
 * @returns {Array} - Formatted companies data for Dashboard
 */
export const transformJobsForDashboard = (jobs) => {
  // Group jobs by company
  const companiesMap = new Map()
  
  jobs.forEach(job => {
    const companyName = job.Company || ''
    
    if (!companiesMap.has(companyName)) {
      companiesMap.set(companyName, {
        id: companyName.toLowerCase().replace(/\s+/g, '-'),
        company: companyName,
        logo: companyName.charAt(0).toUpperCase(),
        location: job.Location || '',
        roles: []
      })
    }
    
    // Transform stages from job details
    const currentStage = job.Current_Stage || 'applied'
    const stages = transformJobDetailsToStages(job.details || [], currentStage)
    
    // If rejected, ensure the rejected stage is properly set
    if (currentStage === 'rejected' && stages.rejected) {
      stages.rejected.current = true
    }
    
    const role = {
      id: job.id,
      position: (job.Job_Title && job.Job_Title !== 'Unknown Position') ? job.Job_Title : '',
      salary: (job.Salary && job.Salary !== 'Not specified') ? job.Salary : '',
      location: (job.Location && job.Location !== 'Location not specified') ? job.Location : '',
      contact: (job.Contact && job.Contact !== 'No contact provided') ? job.Contact : '',
      appliedDate: job.Applied_Date ? formatTimestamp(job.Applied_Date) : 'N/A',
      lastUpdated: job.Last_Updated ? formatRelativeTime(job.Last_Updated) : 'N/A',
      currentStage: currentStage,
      notes: job.Notes,
      stages: stages,
      rawData: job // Keep raw data for reference
    }
    
    companiesMap.get(companyName).roles.push(role)
  })
  
  return Array.from(companiesMap.values())
}

/**
 * Transform job_details array into stages object for timeline
 * ONLY creates stages that have actual email data - dynamic based on emails received
 * @param {Array} details - Array of job detail records
 * @param {string} currentStage - The current stage from jobs collection
 * @returns {Object} - Stages object with timeline info (only stages with data)
 */
const transformJobDetailsToStages = (details, currentStage = 'applied') => {
  // Start with empty stages object - only add stages that have emails
  const stages = {}
  
  // If no details, create a minimal applied stage
  if (details.length === 0) {
    stages.applied = {
      completed: false,
      current: true,
      date: '',
      notes: 'Application submitted',
      emails: []
    }
    return stages
  }
  
  // Group details by stage
  const stageGroups = {}
  details.forEach(detail => {
    const stage = detail.Stage || 'applied'
    if (!stageGroups[stage]) {
      stageGroups[stage] = []
    }
    
    stageGroups[stage].push({
      id: detail.id, // Use job_details document ID, not Email_ID
      emailId: detail.Email_ID, // Keep email ID for reference
      from: detail.Sender || 'Unknown',
      subject: detail.Subject || 'No subject',
      body: detail.Content_Summary || 'No content',
      date: detail.Sent_Date || formatTimestamp(detail.Update_Time)
    })
  })
  
  // Define the proper stage order
  const stageOrder = ['applied', 'screening', 'interview1', 'interview2', 'interview3', 'interview4', 'interview5', 'interview6', 'offer', 'rejected']
  
  // Create stages in proper chronological order
  stageOrder.forEach(stageName => {
    // Check if this stage has emails
    const stageData = stageGroups[stageName]
    if (stageData && stageData.length > 0) {
      const mappedStage = mapStageNameToDashboard(stageName)
      const isRejected = stageName === 'rejected'
      // Fix: Compare the mapped stage with the mapped current stage
      const mappedCurrentStage = mapStageNameToDashboard(currentStage)
      const isCurrent = mappedStage === mappedCurrentStage
      
      stages[mappedStage] = {
        completed: !isCurrent && !isRejected,
        rejected: isRejected,
        current: isCurrent,
        date: stageData[0]?.date || '',
        notes: '', // Don't show email content in notes - keep it clean
        emails: stageData
      }
    }
  })
  
  // Get the order of stages that actually exist (based on emails received)
  const existingStages = stageOrder.filter(stage => stages[stage] !== undefined)
  
  // Mark stages as completed if they come before the current stage
  const currentIndex = existingStages.indexOf(currentStage)
  if (currentIndex > 0 && currentStage !== 'rejected') {
    for (let i = 0; i < currentIndex; i++) {
      const stageName = existingStages[i]
      if (stages[stageName]) {
        stages[stageName].completed = true
        stages[stageName].current = false
      }
    }
  }
  
  // Mark current stage
  if (stages[currentStage]) {
    stages[currentStage].current = true
    stages[currentStage].completed = false
  }
  
  return stages
}

/**
 * Map Firebase stage names to Dashboard stage names
 * @param {string} firebaseStage - Stage name from Firebase
 * @returns {string} - Mapped stage name for Dashboard
 */
const mapStageNameToDashboard = (firebaseStage) => {
  const stageMap = {
    'applied': 'applied',
    'screening': 'screening',
    'interview': 'interview1',
    'interview1': 'interview1',
    'interview2': 'interview2',
    'interview3': 'interview3',
    'interview4': 'interview4',
    'interview5': 'interview5',
    'interview6': 'interview6',
    'offer': 'offer',
    'rejected': 'rejected'
  }
  
  return stageMap[firebaseStage?.toLowerCase()] || 'applied'
}

/**
 * Format Firestore Timestamp to readable date string
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} - Formatted date string
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

/**
 * Format timestamp to relative time (e.g., "2 days ago")
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} - Relative time string
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    
    // Normalize dates to remove time-of-day precision issues
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const diffMs = today - targetDate
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    
    // Handle same day or very small differences (within same day)
    if (diffDays === 0 || Math.abs(diffMs) < 24 * 60 * 60 * 1000) {
      return 'Today'
    }
    
    // Handle future dates (shouldn't happen but just in case)
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays)
      if (absDays === 1) return 'Tomorrow'
      if (absDays < 7) return `In ${absDays} days`
      return 'Future date'
    }
    
    // Handle past dates
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch (error) {
    return 'Unknown'
  }
}

/**
 * Update job information
 * @param {string} jobId - Job document ID
 * @param {Object} updates - Fields to update
 */
export const updateJob = async (jobId, updates) => {
  try {
    // If Current_Stage is being updated, we need to update all job_details for this job
    if (updates.Current_Stage) {
      // Get all job_details for this job
      const detailsQuery = query(
        collection(db, 'job_details'),
        where('Job_ID', '==', jobId)
      )
      const detailsSnapshot = await getDocs(detailsQuery)
      
      // Update all job_details to the new stage
      const updatePromises = detailsSnapshot.docs.map(detailDoc => 
        updateDoc(doc(db, 'job_details', detailDoc.id), {
          Stage: updates.Current_Stage,
          Update_Time: Timestamp.now()
        })
      )
      
      // Execute all updates in parallel
      await Promise.all(updatePromises)
    }
    
    // Update the job document
    await updateDoc(doc(db, 'jobs', jobId), {
      ...updates,
      Update_Time: Timestamp.now()
    })
  } catch (error) {
    throw error
  }
}

/**
 * Add a manual job application
 * @param {Object} jobData - Job application data
 * @param {string} trackingCode - User's tracking code
 * @param {string} userId - User's document ID
 * @returns {Object} - Created job document
 */
export const addManualJob = async (jobData, trackingCode, userId) => {
  try {
    const jobDoc = await addDoc(collection(db, 'jobs'), {
      Applied_Date: Timestamp.now(),
      Company: jobData.company,
      Contact: jobData.contact || null,
      Current_Stage: jobData.currentStage || 'applied',
      Email_IDs: [],
      Job_Title: jobData.jobTitle,
      Last_Updated: Timestamp.now(),
      Location: jobData.location || null,
      Notes: null,
      Salary: jobData.salary || null,
      Tracking_Code: trackingCode.toUpperCase(),
      Update_Time: Timestamp.now(),
      User_ID: userId
    })
    
    return {
      id: jobDoc.id,
      ...jobData
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update job stage and add note
 * @param {string} jobId - Job document ID
 * @param {string} newStage - New stage name
 * @param {string} notes - Optional notes for the stage change
 */
export const updateJobStage = async (jobId, newStage, notes = null) => {
  try {
    const updates = {
      Current_Stage: newStage,
      Last_Updated: Timestamp.now(),
      Update_Time: Timestamp.now()
    }
    
    if (notes) {
      updates.Notes = notes
    }
    
    await updateDoc(doc(db, 'jobs', jobId), updates)
  } catch (error) {
    throw error
  }
}

/**
 * Update email/job_detail stage
 * Moves an email to a different stage in the timeline
 * @param {string} emailDetailId - job_details document ID
 * @param {string} jobId - Associated job document ID
 * @param {string} newStage - New stage name
 */
export const updateEmailStage = async (emailDetailId, jobId, newStage) => {
  try {
    // Update the job_details entry with new stage
    await updateDoc(doc(db, 'job_details', emailDetailId), {
      Stage: newStage,
      Update_Time: Timestamp.now()
    })
    
    // Update the job's current stage based on all job_details
    await updateJobCurrentStageFromDetails(jobId)
  } catch (error) {
    throw error
  }
}

/**
 * Update job's Current_Stage based on the latest stage from all job_details
 * @param {string} jobId - Job document ID
 */
export const updateJobCurrentStageFromDetails = async (jobId) => {
  try {
    // Get all job_details for this job (without orderBy to avoid index requirement)
    const detailsQuery = query(
      collection(db, 'job_details'),
      where('Job_ID', '==', jobId)
    )
    const detailsSnapshot = await getDocs(detailsQuery)
    
    if (detailsSnapshot.empty) {
      return
    }
    
    // Sort by Update_Time in memory (fallback until index is ready)
    const details = detailsSnapshot.docs.map(doc => doc.data())
    details.sort((a, b) => {
      const aTime = a.Update_Time?.toMillis?.() || 0
      const bTime = b.Update_Time?.toMillis?.() || 0
      return bTime - aTime // Descending order (latest first)
    })
    
    // Get the latest stage from the most recent job_detail
    const latestStage = details[0].Stage || 'applied'
    
    // Update the job's Current_Stage
    await updateDoc(doc(db, 'jobs', jobId), {
      Current_Stage: latestStage,
      Last_Updated: Timestamp.now(),
      Update_Time: Timestamp.now()
    })
  } catch (error) {
    throw error
  }
}

/**
 * Delete a job and all its associated data (job_details and mailin emails)
 * @param {string} jobId - Job document ID to delete
 * @returns {Object} - Result with success status
 */
export const deleteJob = async (jobId) => {
  try {
    // First, get the job document to access Email_IDs
    const jobDocRef = doc(db, 'jobs', jobId)
    const jobDoc = await getDoc(jobDocRef)
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found')
    }
    
    const jobData = jobDoc.data()
    const emailIds = jobData.Email_IDs || []
    
    // Delete all associated job_details
    const detailsQuery = query(
      collection(db, 'job_details'),
      where('Job_ID', '==', jobId)
    )
    const detailsSnapshot = await getDocs(detailsQuery)
    
    const deleteDetailsPromises = detailsSnapshot.docs.map(detailDoc => 
      deleteDoc(doc(db, 'job_details', detailDoc.id))
    )
    await Promise.all(deleteDetailsPromises)
    
    // Delete all associated emails from mailin collection
    const deleteEmailsPromises = emailIds.map(emailId => 
      deleteDoc(doc(db, 'mailin', emailId))
    )
    await Promise.all(deleteEmailsPromises)
    
    // Finally, delete the job document itself
    await deleteDoc(jobDocRef)
    
    return {
      success: true,
      message: 'Job and all associated data deleted successfully',
      deletedDetailsCount: detailsSnapshot.docs.length,
      deletedEmailsCount: emailIds.length
    }
  } catch (error) {
    throw error
  }
}

/**
 * Detect and merge duplicate jobs
 * Finds jobs with same company and similar titles, merges them into one
 * @param {string} trackingCode - User's tracking code
 * @param {string} userId - User's document ID
 * @returns {Object} - Result with merged count
 */
export const mergeDuplicateJobs = async (trackingCode, userId) => {
  try {
    // Get all jobs for this user
    const q = query(
      collection(db, 'jobs'),
      where('Tracking_Code', '==', trackingCode.toUpperCase())
    )
    const snapshot = await getDocs(q)
    
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Group jobs by normalized company + title
    const jobGroups = new Map()
    
    jobs.forEach(job => {
      const company = job.Company?.trim().toLowerCase() || ''
      const title = job.Job_Title?.trim().toLowerCase() || ''
      const key = `${company}|||${title}`
      
      if (!jobGroups.has(key)) {
        jobGroups.set(key, [])
      }
      jobGroups.get(key).push(job)
    })
    
    // Find and merge duplicates
    let mergedCount = 0
    
    for (const [key, duplicates] of jobGroups.entries()) {
      if (duplicates.length > 1) {
        // Keep the oldest job (first created)
        duplicates.sort((a, b) => {
          const aTime = a.Applied_Date?.toDate?.() || new Date(0)
          const bTime = b.Applied_Date?.toDate?.() || new Date(0)
          return aTime - bTime
        })
        
        const primaryJob = duplicates[0]
        const duplicateJobs = duplicates.slice(1)
        
        // Merge email IDs and update primary job
        const allEmailIds = new Set(primaryJob.Email_IDs || [])
        duplicateJobs.forEach(dup => {
          (dup.Email_IDs || []).forEach(emailId => allEmailIds.add(emailId))
        })
        
        // Update primary job with merged data
        await updateDoc(doc(db, 'jobs', primaryJob.id), {
          Email_IDs: Array.from(allEmailIds),
          Last_Updated: Timestamp.now(),
          Update_Time: Timestamp.now()
        })
        
        // Update job_details to point to primary job
        for (const dupJob of duplicateJobs) {
          const detailsQuery = query(
            collection(db, 'job_details'),
            where('Job_ID', '==', dupJob.id)
          )
          const detailsSnapshot = await getDocs(detailsQuery)
          
          for (const detailDoc of detailsSnapshot.docs) {
            await updateDoc(doc(db, 'job_details', detailDoc.id), {
              Job_ID: primaryJob.id,
              Update_Time: Timestamp.now()
            })
          }
          
          // Delete duplicate job
          await updateDoc(doc(db, 'jobs', dupJob.id), {
            _merged_into: primaryJob.id,
            _merged_at: Timestamp.now()
          })
          
          // You can uncomment this to actually delete instead of marking
          // await deleteDoc(doc(db, 'jobs', dupJob.id))
        }
        
        mergedCount += duplicateJobs.length
      }
    }
    
    return {
      success: true,
      mergedCount,
      message: mergedCount > 0 
        ? `Merged ${mergedCount} duplicate job(s)` 
        : 'No duplicates found'
    }
  } catch (error) {
    throw error
  }
}

