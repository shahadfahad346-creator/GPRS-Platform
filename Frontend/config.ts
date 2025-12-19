/**
 * ⚙️ GPRS Configuration - Production Ready
 */

// 🌍 تحديد البيئة
const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// 🔗 Flask API (Authentication & Teams)
export const FLASK_API_URL = isDevelopment
  ? 'http://localhost:5000'
  : (import.meta.env?.VITE_FLASK_API_URL || 'https://gprs-platform.onrender.com');

// 🔗 FastAPI (Analysis & Projects)
export const API_BASE_URL = isDevelopment
  ? 'http://127.0.0.1:8001'
  : (import.meta.env?.VITE_FASTAPI_URL || 'https://gprs-fastapi.onrender.com');

// 💾 مفاتيح التخزين
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gprs_access_token',
  USER_DATA: 'gprs_user',
  USER_TYPE: 'gprs_user_type',
  USER_ID: 'gprs_user_id'
} as const;

// 📡 Flask API Endpoints
export const FLASK_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout'
  },
  PROFILE: {
    GET: '/api/profile/get',
    UPDATE: '/api/profile/update'
  },
  TEAM: {
    INVITATIONS: '/api/team/invitations',
    ACCEPT: '/api/team/accept-invitation',
    REJECT: '/api/team/reject-invitation',
    CREATE: '/api/team/create',
    UPDATE: '/api/team/update'
  }
} as const;

// 🚀 FastAPI Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout'
  },
  
  STUDENTS: {
    BASE: '/students',
    BY_ID: (id: string) => `/students/${id}`,
    PROFILE: '/students/profile',
    UPDATE_PROFILE: '/students/profile'
  },
  
  SUPERVISORS: {
    BASE: '/supervisors',
    BY_ID: (id: string) => `/supervisors/${id}`,
    SEARCH: '/supervisors/search'
  },
  
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
    SEARCH: '/projects/search'
  },
  
  ANALYSIS: {
    ANALYZE: '/analysis/analyze',
    BY_STUDENT: (studentId: string) => `/analysis/student-ideas/${studentId}`,
    BY_ID: (ideaId: string) => `/analysis/idea-details/${ideaId}`,
    DELETE: (ideaId: string) => `/analysis/idea/${ideaId}`
  }
} as const;

// 🎨 إعدادات الواجهة
export const UI_CONFIG = {
  ANIMATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500
  },
  
  TOAST: {
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
    WARNING_DURATION: 4000
  },
  
  ANALYSIS_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
} as const;

// ✅ قواعد التحقق
export const VALIDATION = {
  PROJECT_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200
  },
  PROJECT_DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 2000
  },
  TECHNOLOGIES: {
    MAX_COUNT: 15
  }
} as const;

// 🐛 Debug في Development
if (isDevelopment) {
  console.log('⚙️ [Config] Flask API:', FLASK_API_URL);
  console.log('🚀 [Config] FastAPI:', API_BASE_URL);
  console.log('🔧 [Config] Environment: DEVELOPMENT');
}

// 📝 TypeScript Types
export type UserType = 'student' | 'supervisor' | 'admin';
export type AnalysisStatus = typeof UI_CONFIG.ANALYSIS_STATUS[keyof typeof UI_CONFIG.ANALYSIS_STATUS];