import axios from 'axios';
import { API_BASE_URL, ENDPOINTS, STORAGE_KEYS } from './config';
import  { AxiosResponse, AxiosError} from 'axios';
import { InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// 📦 Axios Instance
// ---------------------------------------------------------------------------
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Interceptor لإضافة التوكن فقط للطلبات التي تحتاج توثيق
apiClient.interceptors.request.use((config) => {
  // لا نضيف التوكن لطلبات /analysis/analyze
  if (!config.url?.includes('/analysis/analyze')) {
    const token = localStorage.getItem('gprs_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});


// ---------------------------------------------------------------------------
// 📚 Types
// ---------------------------------------------------------------------------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  user_type: 'student' | 'supervisor';
}

export interface AuthResponse {
  access_token: string;
  //token_type: string;
  user_id: string;
  //user_type: 'student' | 'supervisor';
}

export interface AnalyzeIdeaRequest {
  title: string;
  description: string;
  technologies?: string[];
  student_id: string;
  language?: string;
}

export interface AnalysisResponse {
  id: string;
  message: string;
  stage_1_initial_analysis: any;
  stage_2_extended_analysis: any;
  similar_projects: any[];
  recommended_supervisors: any[];
}

// ---------------------------------------------------------------------------
// 🔐 Authentication Functions
// ---------------------------------------------------------------------------

export const saveAuthToken = (token: string, userId: string, userType: string) => {
  localStorage.setItem('gprs_access_token', token);
  localStorage.setItem('gprs_user_id', userId);
  localStorage.setItem('gprs_user_type', userType);};

export const clearAuthToken = () => {
  localStorage.removeItem('gprs_access_token');
  localStorage.removeItem('gprs_user_id');
  localStorage.removeItem('gprs_user_type');
  localStorage.removeItem('gprs_user');
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<void> => {
  await axios.post(`${API_BASE_URL}/auth/register`, data);
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('gprs_access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(`${API_BASE_URL}/students/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/*

// ---------------------------------------------------------------------------
// 👨‍🎓 Student Endpoints
// ---------------------------------------------------------------------------

export const getStudents = async (): Promise<any[]> => {
  const response = await apiClient.get(ENDPOINTS.STUDENTS.BASE);
  return response.data;
};

export const getStudentById = async (id: string): Promise<any> => {
  const response = await apiClient.get(ENDPOINTS.STUDENTS.BY_ID(id));
  return response.data;
};

export const updateStudent = async (id: string, data: any): Promise<any> => {
  const response = await apiClient.put(ENDPOINTS.STUDENTS.BY_ID(id), data);
  return response.data;
};

/**
 * ✅ Update Student Profile
 */
export const updateStudentProfile = async (profileData: any): Promise<any> => {
  try {
    console.log('💾 [API] Updating student profile...');
    const response = await apiClient.put(ENDPOINTS.STUDENTS.PROFILE, profileData);
    console.log('✅ [API] Profile updated successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Profile update failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Get Student Profile
 */
export const getStudentProfile = async (): Promise<any> => {
  try {
    console.log('📥 [API] Fetching student profile...');
    const response = await apiClient.get(ENDPOINTS.STUDENTS.PROFILE);
    console.log('✅ [API] Profile fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Failed to fetch profile:', error.response?.data || error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 👨‍🏫 Supervisor Endpoints
// ---------------------------------------------------------------------------

export const getSupervisors = async (): Promise<any[]> => {
  const response = await apiClient.get(ENDPOINTS.SUPERVISORS.BASE);
  return response.data;
};

export const getSupervisorById = async (id: string): Promise<any> => {
  const response = await apiClient.get(ENDPOINTS.SUPERVISORS.BY_ID(id));
  return response.data;
};

export const searchSupervisors = async (query: string): Promise<any[]> => {
  const response = await apiClient.get(ENDPOINTS.SUPERVISORS.SEARCH, { params: { query } });
  return response.data;
};

// ---------------------------------------------------------------------------
// 📊 Project Endpoints
// ---------------------------------------------------------------------------

export const getProjects = async (): Promise<any[]> => {
  const response = await apiClient.get(ENDPOINTS.PROJECTS.BASE);
  return response.data;
};

export const getProjectById = async (id: string): Promise<any> => {
  const response = await apiClient.get(ENDPOINTS.PROJECTS.BY_ID(id));
  return response.data;
};

export const searchProjects = async (query: string): Promise<any[]> => {
  const response = await apiClient.get(ENDPOINTS.PROJECTS.SEARCH, { params: { query } });
  return response.data;
};

// ---------------------------------------------------------------------------
// 💡 Analysis Endpoints (✅ موحّدة مع Backend)
// ---------------------------------------------------------------------------

/**
 * ✅ Analyze Idea - POST /analysis/analyze
 */
export const analyzeIdea = async (data: AnalyzeIdeaRequest): Promise<AnalysisResponse> => {
  try {
    console.log('🔍 [API] Analyzing idea...', { title: data.title });
    const response = await apiClient.post<AnalysisResponse>(
      ENDPOINTS.ANALYSIS.ANALYZE,
      data
    );
    console.log('✅ [API] Analysis completed');
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Analysis failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Get Student Ideas - GET /analysis/student-ideas/{student_id}
 */
export const getStudentIdeas = async (studentId: string): Promise<any[]> => {
  try {
    console.log('📥 [API] Fetching student ideas...', { studentId });
    const response = await apiClient.get(ENDPOINTS.ANALYSIS.BY_STUDENT(studentId));
    console.log('✅ [API] Ideas fetched:', response.data.length);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Failed to fetch ideas:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Get Idea Details - GET /analysis/idea-details/{idea_id}
 */
export const getIdeaById = async (ideaId: string): Promise<any> => {
  try {
    console.log('📥 [API] Fetching idea details...', { ideaId });
    const response = await apiClient.get(ENDPOINTS.ANALYSIS.BY_ID(ideaId));
    console.log('✅ [API] Idea details fetched');
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Failed to fetch idea:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Save Idea to Profile - POST /students/profile/ideas
 */
export const saveIdea = async (ideaData: any): Promise<any> => {
  try {
    console.log('💾 [API] Saving idea to profile...');
    const response = await apiClient.post('/students/profile/ideas', ideaData);
    console.log('✅ [API] Idea saved successfully');
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Failed to save idea:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * ✅ Delete Idea - DELETE /analysis/idea/{idea_id}
 */
export const deleteIdea = async (ideaId: string): Promise<void> => {
  try {
    console.log('🗑️ [API] Deleting idea...', { ideaId });
    await apiClient.delete(ENDPOINTS.ANALYSIS.DELETE(ideaId));
    console.log('✅ [API] Idea deleted');
  } catch (error: any) {
    console.error('❌ [API] Failed to delete idea:', error.response?.data || error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 🛠️ Generic HTTP Methods
// ---------------------------------------------------------------------------

export const get = async <T>(url: string, config?: any): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const post = async <T>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const put = async <T>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const del = async <T>(url: string, config?: any): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};