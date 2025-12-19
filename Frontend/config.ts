/**
 * ⚙️ GPRS Configuration - Unified Frontend Config
 */


const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';


export const API_BASE_URL = isDevelopment
  ? 'http://127.0.0.1:8001'
  : 'https://your-production-domain.com';


export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gprs_access_token',
  USER_DATA: 'gprs_user',
  USER_TYPE: 'gprs_user_type',
  USER_ID: 'gprs_user_id'
} as const;


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


if (isDevelopment) {
  console.log('⚙️ [Config] API Base URL:', API_BASE_URL);
  console.log('🔧 [Config] Environment: LOCAL DEVELOPMENT');
  console.log('📋 [Config] Endpoints:', ENDPOINTS);
}


export type UserType = 'student' | 'supervisor' | 'admin';
export type AnalysisStatus = typeof UI_CONFIG.ANALYSIS_STATUS[keyof typeof UI_CONFIG.ANALYSIS_STATUS];