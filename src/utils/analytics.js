// Google Analytics utility functions

/**
 * Track a page view
 * @param {string} path - The page path
 * @param {string} title - The page title
 */
export const trackPageView = (path, title) => {
  if (typeof window.gtag !== 'undefined') {
    const measurementId = window.GA_MEASUREMENT_ID || 'G-TRWBT6ZBK5'
    window.gtag('config', measurementId, {
      page_path: path,
      page_title: title
    })
  } else {
    console.warn('GA: gtag not loaded yet')
  }
}

/**
 * Track a custom event
 * @param {string} eventName - The name of the event
 * @param {object} eventParams - Additional event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, eventParams)
    console.log('GA: Tracked event', { eventName, eventParams })
  } else {
    console.warn('GA: gtag not loaded yet')
  }
}

/**
 * Track user authentication events
 * @param {string} method - The authentication method (e.g., 'google', 'email')
 * @param {string} action - The action (e.g., 'sign_up', 'sign_in', 'sign_out')
 */
export const trackAuth = (method, action) => {
  trackEvent(action, {
    method: method
  })
}

/**
 * Track job application actions
 * @param {string} action - The action (e.g., 'add_manual', 'edit', 'delete', 'email_forward')
 * @param {object} params - Additional parameters
 */
export const trackJobAction = (action, params = {}) => {
  trackEvent('job_application', {
    action: action,
    ...params
  })
}

/**
 * Track email interactions
 * @param {string} action - The action (e.g., 'view', 'reclassify')
 * @param {object} params - Additional parameters
 */
export const trackEmailAction = (action, params = {}) => {
  trackEvent('email_interaction', {
    action: action,
    ...params
  })
}

/**
 * Track profile actions
 * @param {string} action - The action (e.g., 'update_email_code', 'change_password')
 */
export const trackProfileAction = (action) => {
  trackEvent('profile_action', {
    action: action
  })
}

/**
 * Track navigation
 * @param {string} from - Where the user is navigating from
 * @param {string} to - Where the user is navigating to
 */
export const trackNavigation = (from, to) => {
  trackEvent('navigation', {
    from: from,
    to: to
  })
}

/**
 * Track errors
 * @param {string} errorMessage - The error message
 * @param {string} location - Where the error occurred
 */
export const trackError = (errorMessage, location) => {
  trackEvent('error', {
    description: errorMessage,
    location: location,
    fatal: false
  })
}

