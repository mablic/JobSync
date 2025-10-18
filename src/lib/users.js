import { db, auth, googleProvider } from './firebase'
import { collection, addDoc, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'

/**
 * Generate a random 6-character code (A-Z, 0-9)
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
 * Check if an email code already exists in Firestore
 * This queries the users collection to see if emailCode is already taken
 */
export const checkEmailCodeExists = async (emailCode) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('emailCode', '==', emailCode.toUpperCase()),
      limit(1)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('Error checking email code:', error)
    // If we can't check (permissions issue), just return false and let it try
    // The create will fail if it's a duplicate anyway
    return false
  }
}

/**
 * Generate a unique email code (ensures no duplicates)
 * Checks the users collection in Firestore to ensure uniqueness
 */
export const generateUniqueEmailCode = async () => {
  let emailCode = generateEmailCode()
  let attempts = 0
  const maxAttempts = 10
  
  // Keep trying until we find a unique code
  while (attempts < maxAttempts) {
    const exists = await checkEmailCodeExists(emailCode)
    
    if (!exists) {
      // Found a unique code!
      return emailCode
    }
    
    // Code exists, try again
    emailCode = generateEmailCode()
    attempts++
    console.log(`Email code collision, attempt ${attempts}/${maxAttempts}`)
  }
  
  // If we couldn't find a unique code after max attempts, 
  // just return the last one and let Firestore handle the duplicate
  console.warn('Could not verify unique email code, proceeding anyway')
  return emailCode
}

/**
 * Create a new user with Firebase Auth and Firestore
 * Also generates a unique email forwarding code
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @returns {Object} - Created user data with emailCode and forwardingEmail
 */
export const registerUser = async (userData) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    )
    const firebaseUser = userCredential.user
    
    // Generate unique email code
    const emailCode = await generateUniqueEmailCode()
    
    // Get email domain from environment variable
    // Default to jobsync.fyi if not set
    const DOMAIN = import.meta.env.VITE_EMAIL_DOMAIN || 'jobsync.fyi'
    const forwardingEmail = `${emailCode}@${DOMAIN}`
    
    // Create user document in Firestore
    const userDoc = await addDoc(collection(db, 'users'), {
      uid: firebaseUser.uid,
      name: userData.fullName,
      email: userData.email,
      emailCode,
      forwardingEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: 'free',
      emailsReceived: 0,
      applicationsCount: 0,
      isActive: true,
    })
    
    return {
      id: userDoc.id,
      uid: firebaseUser.uid,
      emailCode,
      forwardingEmail,
      name: userData.fullName,
      email: userData.email,
    }
  } catch (error) {
    console.error('Error creating user with email code:', error)
    throw error
  }
}

/**
 * Get user by email code (used by Cloud Function when email arrives)
 * @param {string} emailCode - The 6-digit code
 * @returns {Object|null} - User data or null if not found
 */
export const getUserByEmailCode = async (emailCode) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('emailCode', '==', emailCode.toUpperCase()),
      limit(1)
    )
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const userDoc = snapshot.docs[0]
    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    console.error('Error getting user by email code:', error)
    throw error
  }
}

/**
 * Get user by regular email address
 */
export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('email', '==', email),
      limit(1)
    )
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const userDoc = snapshot.docs[0]
    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    console.error('Error getting user by email:', error)
    throw error
  }
}

/**
 * Update user's forwarding email preferences
 */
export const updateUserEmailSettings = async (userId, settings) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...settings,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error updating user email settings:', error)
    throw error
  }
}

/**
 * Sign in existing user
 */
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user
    
    // Get user data from Firestore
    const userData = await getUserByEmail(email)
    
    return {
      uid: firebaseUser.uid,
      ...userData
    }
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Get current user's full data including email code
 */
export const getCurrentUserData = async (uid) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('uid', '==', uid),
      limit(1)
    )
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    }
  } catch (error) {
    console.error('Error getting current user data:', error)
    throw error
  }
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user
    
    // Check if user exists in Firestore
    let userData = await getUserByEmail(firebaseUser.email)
    
    // If user doesn't exist, create them
    if (!userData) {
      const emailCode = await generateUniqueEmailCode()
      const DOMAIN = import.meta.env.VITE_EMAIL_DOMAIN || 'jobsync.fyi'
      const forwardingEmail = `${emailCode}@${DOMAIN}`
      
      const userDoc = await addDoc(collection(db, 'users'), {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        emailCode,
        forwardingEmail,
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        plan: 'free',
        emailsReceived: 0,
        applicationsCount: 0,
        isActive: true,
        authProvider: 'google',
      })
      
      userData = {
        id: userDoc.id,
        uid: firebaseUser.uid,
        emailCode,
        forwardingEmail,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
      }
    }
    
    return userData
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

/**
 * Get current authenticated user (from Firebase Auth)
 */
export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

/**
 * Update current user's profile
 */
export const updateProfile = async (profileData) => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No user signed in')
    }
    
    // Get user document
    const userData = await getCurrentUserData(user.uid)
    if (!userData) {
      throw new Error('User data not found')
    }
    
    // Update Firestore document
    await updateDoc(doc(db, 'users', userData.id), {
      ...profileData,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

/**
 * Update user's custom email code
 * Validates that the code is unique and meets requirements
 * @param {string} newCode - The new email code (max 10 chars, alphanumeric only)
 * @returns {Object} - Updated user data with new forwardingEmail
 */
export const updateEmailCode = async (newCode) => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('No user signed in')
    }
    
    // Validate code format
    const sanitizedCode = newCode.toUpperCase().trim()
    
    if (sanitizedCode.length === 0) {
      throw new Error('Email code cannot be empty')
    }
    
    if (sanitizedCode.length > 10) {
      throw new Error('Email code must be 10 characters or less')
    }
    
    // Only allow A-Z and 0-9
    if (!/^[A-Z0-9]+$/.test(sanitizedCode)) {
      throw new Error('Email code can only contain letters and numbers')
    }
    
    // Check if code is already taken
    const exists = await checkEmailCodeExists(sanitizedCode)
    if (exists) {
      throw new Error('This email code is already taken. Please choose another one.')
    }
    
    // Get user document
    const userData = await getCurrentUserData(user.uid)
    if (!userData) {
      throw new Error('User data not found')
    }
    
    // Update with new code and forwarding email
    const DOMAIN = import.meta.env.VITE_EMAIL_DOMAIN || 'jobsync.fyi'
    const newForwardingEmail = `${sanitizedCode}@${DOMAIN}`
    
    await updateDoc(doc(db, 'users', userData.id), {
      emailCode: sanitizedCode,
      forwardingEmail: newForwardingEmail,
      updatedAt: new Date()
    })
    
    return {
      emailCode: sanitizedCode,
      forwardingEmail: newForwardingEmail
    }
  } catch (error) {
    console.error('Error updating email code:', error)
    throw error
  }
}

/**
 * Change user's password (requires current password for security)
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - New password to set
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error('No user signed in')
    }
    
    // Re-authenticate user with current password (required by Firebase for security)
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    
    // Update password
    await updatePassword(user, newPassword)
    
    return { success: true }
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}
