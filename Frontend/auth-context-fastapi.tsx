import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  login as apiLogin, 
  register as apiRegister, 
  getCurrentUser as apiGetCurrentUser, 
  saveAuthToken, 
  clearAuthToken, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse 
} from './api-fastapi';
import { STORAGE_KEYS, API_BASE_URL, FLASK_API_URL, ENDPOINTS, FLASK_ENDPOINTS } from "./config";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  userType: 'student' | 'supervisor' | 'admin' | null;
  login: (email: string, password: string, type: 'student' | 'supervisor') => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateProfile: (profileData: any) => Promise<any>;
  refreshUserData: () => Promise<void>;
  updateUser: (updates: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [userType, setUserType] = useState<'student' | 'supervisor' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUserType = localStorage.getItem(STORAGE_KEYS.USER_TYPE) as 'student' | 'supervisor' | 'admin' | null;
      
      if (token && storedUserType) {
        try {
          const currentUser = await apiGetCurrentUser();
          setUser(currentUser);
          setUserType(storedUserType);
          setIsAuthenticated(true);
          console.log('✅ [Auth] User loaded from token');
        } catch (error) {
          console.error('❌ [Auth] Failed to load user from token:', error);
          clearAuthToken();
          setIsAuthenticated(false);
          setUser(null);
          setUserType(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setUserType(null);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string, type: 'student' | 'supervisor') => {
    setLoading(true);
    try {
      const response: AuthResponse = await apiLogin({ email, password }); 
      saveAuthToken(response.access_token, response.user_id, type);
      localStorage.setItem(STORAGE_KEYS.USER_TYPE, type);
      
      const currentUser = await apiGetCurrentUser();
      setUser(currentUser);
      setUserType(type);
      setIsAuthenticated(true);
      
      console.log('✅ [Auth] Login successful');
    } catch (error) {
      console.error('❌ [Auth] Login failed:', error);
      clearAuthToken();
      setIsAuthenticated(false);
      setUser(null);
      setUserType(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setLoading(true);
    try {
      await apiRegister(userData);
      toast.success('Registration successful! Please log in.');
      console.log('✅ [Auth] Registration successful');
    } catch (error) {
      console.error('❌ [Auth] Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    setUserType(null);
    toast.info('You have been logged out.');
    console.log('🚪 [Auth] User logged out');
  };

  
  const updateProfile = async (profileData: any) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('💾 [Auth] Updating profile with data:', {
        hasName: !!profileData.name,
        skillsCount: profileData.skills?.length || 0,
        frameworksCount: profileData.frameworks?.length || 0,
        hasGroup: !!profileData.groupName,
        membersCount: profileData.groupMembers?.length || 0
      });

      
      const response = await axios.put(
  `${FLASK_API_URL}${FLASK_ENDPOINTS.PROFILE.UPDATE}`,
        {
          name: profileData.name,
          skills: profileData.skills || [],
          frameworks: profileData.frameworks || [],
          groupName: profileData.groupName,
          groupMembers: profileData.groupMembers || []
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [Auth] Profile update response:', response.status);

      
      if (response.data && response.data.student) {
        const updatedUser = response.data.student;
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        console.log('✅ [Auth] Local user data updated');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [Auth] Update profile error:', error);
      
      
      if (error?.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error?.response?.status === 403) {
        throw new Error('You can only update your own profile');
      } else if (error?.response?.status === 404) {
        throw new Error('Student profile not found');
      } else if (error?.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error?.message) {
        throw new Error(error.message);
      }
      
      throw new Error('Failed to update profile');
    }
  };

  
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!token) {
        console.log('⚠️ [Auth] No token found for refresh');
        return;
      }

      console.log('🔄 [Auth] Refreshing user data...');

      
      const response = await axios.get(
  `${FLASK_API_URL}${FLASK_ENDPOINTS.PROFILE.GET}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setUser(response.data);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
        console.log('✅ [Auth] User data refreshed successfully');
      }
    } catch (error: any) {
      console.error('❌ [Auth] Failed to refresh user data:', error);
      
      
      if (error?.response?.status === 401) {
        console.log('🔐 [Auth] Token expired, logging out...');
        logout();
      }
    }
  };

  
  const updateUser = (updates: any) => {
    setUser((prevUser: any) => {
      const updatedUser = {
        ...prevUser,
        ...updates
      };
      
      
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      console.log('🔄 [Auth] User state updated locally');
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      userType, 
      login, 
      register, 
      logout, 
      loading,
      updateProfile,
      refreshUserData,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};