// Theme Configuration for JobSync
// Light and Dark color palettes

export const colors = {
  light: {
    // Primary Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Secondary Colors (Indigo)
    secondary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    },
    // Text Colors
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    // Border Colors
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      dark: '#94a3b8',
    },
    // Status Colors
    status: {
      applied: '#3b82f6',
      underReview: '#eab308',
      interview: '#a855f7',
      offer: '#22c55e',
      rejected: '#ef4444',
      withdrawn: '#6b7280',
    },
    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      primaryHover: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
      hero: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
      card: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      subtle: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    },
  },
  
  dark: {
    // Primary Colors
    primary: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff',
    },
    // Secondary Colors (Indigo)
    secondary: {
      50: '#312e81',
      100: '#3730a3',
      200: '#4338ca',
      300: '#4f46e5',
      400: '#6366f1',
      500: '#818cf8',
      600: '#a5b4fc',
      700: '#c7d2fe',
      800: '#e0e7ff',
      900: '#eef2ff',
    },
    // Background Colors
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
    // Text Colors
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    // Border Colors
    border: {
      light: '#334155',
      medium: '#475569',
      dark: '#64748b',
    },
    // Status Colors
    status: {
      applied: '#60a5fa',
      underReview: '#fbbf24',
      interview: '#c084fc',
      offer: '#4ade80',
      rejected: '#f87171',
      withdrawn: '#9ca3af',
    },
    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      primaryHover: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
      hero: 'linear-gradient(135deg, #1e293b 0%, #312e81 50%, #3730a3 100%)',
      card: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      subtle: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
  },
}

// Shadow definitions
export const shadows = {
  light: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  dark: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
  },
}

export default { colors, shadows }

