/**
 * Email Code Generator for JobSync
 * Each user gets a unique code like ABC123 to forward emails to ABC123@jobsync.fyi
 */

/**
 * Generate a unique 6-character alphanumeric code
 * @returns {string} 6-character code like "ABC123"
 */
export const generateEmailCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Format email address with user's code
 * @param {string} emailCode - User's unique code
 * @returns {string} Full email address like "ABC123@jobsync.fyi"
 */
export const getForwardingEmail = (emailCode) => {
  return `${emailCode}@jobsync.fyi`
}

/**
 * Validate email code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export const isValidEmailCode = (code) => {
  if (!code || typeof code !== 'string') return false
  // Must be exactly 6 characters, alphanumeric only
  return /^[A-Z0-9]{6}$/.test(code)
}

/**
 * Check if email code already exists in Firestore
 * @param {Object} db - Firestore instance
 * @param {string} code - Code to check
 * @returns {Promise<boolean>} True if code already exists
 */
export const emailCodeExists = async (db, code) => {
  const { collection, query, where, getDocs } = await import('firebase/firestore')
  
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('emailCode', '==', code))
  const snapshot = await getDocs(q)
  
  return !snapshot.empty
}

/**
 * Generate a unique email code that doesn't exist in database
 * @param {Object} db - Firestore instance
 * @param {number} maxAttempts - Maximum attempts to find unique code
 * @returns {Promise<string>} Unique email code
 */
export const generateUniqueEmailCode = async (db, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateEmailCode()
    const exists = await emailCodeExists(db, code)
    
    if (!exists) {
      return code
    }
  }
  
  // If we couldn't find a unique code after maxAttempts, throw error
  throw new Error('Unable to generate unique email code. Please try again.')
}

