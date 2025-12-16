import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios'; // تأكد من استيراد axios

interface GroupMember {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
  invitedBy?: string;
  invitedAt?: string;
}

interface TeamInvitation {
  id: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  members: GroupMember[];
}

interface SavedIdea {
  id: string;
  _id?: string;
  title: string;
  date: string;
  status: string;
  score: number;
  keywords: string[];
  visible?: boolean;
  is_agreed?: boolean;
}

interface ResearchPaper {
  title: string;
  platform: string;
}

interface User {
  token: string;
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'supervisor';
  specialization?: string;
  skills?: string[];
  frameworks?: string[];
  groupName?: string;
  groupMembers?: GroupMember[];
  teamInvitations?: TeamInvitation[];
  savedIdeas?: SavedIdea[];
   agreed_idea_id?: string; 
  department?: string;
  office?: string;
  researchInterests?: string[];
  publications?: number;
  activeProjects?: number;
  hasProfile?: boolean;
  researchPapers?: ResearchPaper[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'student' | 'supervisor') => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'student' | 'supervisor') => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
  completeProfileSetup: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('gprs_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('[Auth] User loaded from localStorage:', parsedUser.email);
      } catch (error) {
        console.error('[Auth] Failed to parse saved user:', error);
        localStorage.removeItem('gprs_user');
        setIsAuthenticated(false);
        navigate('/login');
      }
    }
  }, [navigate]);

  const handleResponse = async (response: Response) => {
    const text = await response.text();
    console.log('[Auth] Raw response:', text);
    console.log('[Auth] Response status:', response.status);
    console.log('[Auth] Response URL:', response.url);

    if (!text || text.trim() === '') {
      if (response.status === 404) {
        throw new Error('API endpoint not found. Make sure your backend server is running on http://localhost:3000');
      }
      throw new Error('Server returned an empty response. Check if backend is running.');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('[Auth] Failed to parse JSON:', err);
      console.error('[Auth] Response text:', text);
      throw new Error('Server returned invalid JSON. Check the console for details.');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Server request failed with status ${response.status}`);
    }

    return data;
  };

  const login = async (email: string, password: string, role: 'student' | 'supervisor') => {
    try {
      console.log('[Auth] Login attempt:', { email, role });
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse(res);

      if (data.user.role !== role) {
        throw new Error(`Incorrect user type. Expected: ${role}, Got: ${data.user.role}`);
      }

      const userData: User = {
        token: data.token,
        _id: data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        hasProfile: data.user.hasProfile ?? false,
        groupMembers: data.user.groupMembers || [],
        teamInvitations: data.user.teamInvitations || [],
        savedIdeas: data.user.savedIdeas || [],
        specialization: data.user.specialization,
        skills: data.user.skills,
        frameworks: data.user.frameworks,
        groupName: data.user.groupName,
        department: data.user.department,
        office: data.user.office,
        researchInterests: data.user.researchInterests,
        publications: data.user.publications,
        activeProjects: data.user.activeProjects,
        researchPapers: data.user.researchPapers
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('gprs_user', JSON.stringify(userData));
      toast.success('Login successful!');

      if (userData.role === 'student') {
        if (userData.hasProfile) navigate('/hub');
        else navigate('/profile-setup');
      } else if (userData.role === 'supervisor') {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      toast.error(err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'student' | 'supervisor') => {
    try {
      console.log('[Auth] Signup attempt:', { email, name, role });
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      });
      const data = await handleResponse(res);

      const userData: User = {
        token: data.token,
        _id: data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        hasProfile: data.user.hasProfile ?? false,
        groupMembers: data.user.groupMembers || [],
        teamInvitations: data.user.teamInvitations || [],
        savedIdeas: data.user.savedIdeas || []
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('gprs_user', JSON.stringify(userData));
      toast.success('Account created successfully!');

      if (userData.role === 'student') navigate('/profile-setup');
      else if (userData.role === 'supervisor') navigate('/dashboard');
    } catch (err: any) {
      console.error('[Auth] Signup error:', err);
      toast.error(err.message || 'Failed to create account. Please try again.');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('gprs_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    try {
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          email: user.email,
          ...data,
        }),
      });
      const result = await handleResponse(response);
      if (result.success) {
        const finalUser = { ...user, ...data, ...result.user };
        setUser(finalUser);
        localStorage.setItem('gprs_user', JSON.stringify(finalUser));
        toast.success('Profile updated successfully!');
      }
    } catch (err: any) {
      console.error('[Auth] Update profile error:', err);
      toast.error(err.message || 'Failed to update profile');
      throw err;
    }
  };


  const updateUser = (data: Partial<User>) => {
    if (!user) {
      console.error('[Auth] No user logged in');
      return;
    }
    const updatedUser = { ...user, ...data } as User;
    setUser(updatedUser);
    localStorage.setItem('gprs_user', JSON.stringify(updatedUser));
  };

const refreshUserData = async () => {
  if (!user) return;
  try {
    const response = await axios.post(`${API_BASE_URL}/profile/get`, {
      userId: user._id,
      email: user.email,
    }, {
      headers: { Authorization: `Bearer ${user.token || ''}` },
    });

    if (response.data.success) {
      const serverUser = response.data.user;
      const agreedIdeaId = serverUser.agreed_idea_id;

      const updatedSavedIdeas = (serverUser.savedIdeas || []).map((idea: any) => {
  const ideaId = idea._id || idea.id;
  const isAgreed = agreedIdeaId && (ideaId === agreedIdeaId);

  return {
    ...idea,
    _id: ideaId,
    is_agreed: isAgreed,
    visible: isAgreed ? true : (idea.visible ?? true),
    _previous_visible: idea._previous_visible
  };
});

      const updatedUser = {
        ...serverUser,
        savedIdeas: updatedSavedIdeas,
        agreed_idea_id: agreedIdeaId,
      };

      updateUser(updatedUser);
      console.log("RefreshUserData] Refreshed with agreed_idea_id:", agreedIdeaId);
      console.log("Agreed ideas:", updatedSavedIdeas.filter((i: any) => i.is_agreed));
    }
  } catch (err) {
    console.error('RefreshUserData] Failed to refresh user data:', err);
  }
};

  const completeProfileSetup = async () => {
  if (!user) throw new Error('No user logged in');

  try {
    const response = await fetch(`${API_BASE_URL}/profile/complete-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
      body: JSON.stringify({ userId: user._id }),
    });

    const result = await handleResponse(response);
    if (result.success) {
      const updatedUser = { ...user, hasProfile: true };
      setUser(updatedUser);
      localStorage.setItem('gprs_user', JSON.stringify(updatedUser));
      toast.success('Welcome! Your profile is ready.');
    }
    return result;
  } catch (err: any) {
    console.error('[Auth] completeProfileSetup error:', err);
    toast.error(err.message || 'Failed to complete setup');
    throw err;
  }
};

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile,
    updateUser,
    refreshUserData,
    completeProfileSetup,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}