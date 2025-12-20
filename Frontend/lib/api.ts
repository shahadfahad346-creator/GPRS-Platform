// src/lib/api.ts - Updated for Flask Backend

const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment
  ? 'http://localhost:5000/api'
  : 'https://gprs-platform.onrender.com/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(`API Error for ${endpoint}:`, data);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// ==================== Projects API ====================

export async function getProjects(options?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    
    const response = await apiRequest(`/projects?${params.toString()}`);
    return {
      projects: response.data || [],
      pagination: response.pagination || {}
    };
  } catch (err) {
    console.error('Error fetching projects:', err);
    return {
      projects: [],
      pagination: {}
    };
  }
}

// ==================== Supervisors API ====================

// محسّن في api.ts

// ==================== Optimized Supervisors API ====================

export async function getSupervisors(options?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    
    const response = await apiRequest(`/supervisors?${params.toString()}`);
    return {
      supervisors: response.data || [],
      pagination: response.pagination || {}
    };
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    return {
      supervisors: [],
      pagination: {}
    };
  }
}

// جلب عدد المشرفين فقط (سريع جداً)
export async function getSupervisorsCount() {
  try {
    const response = await apiRequest('/supervisors/count');
    return response.count || 0;
  } catch (error) {
    console.error('Error fetching supervisors count:', error);
    return 0;
  }
}

// جلب مشرف واحد
export async function getSupervisorById(supervisorId: string) {
  try {
    const response = await apiRequest(`/supervisors/${supervisorId}`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    return null;
  }
}


// ==================== Students API ====================

export async function getStudents() {
  try {
    const response = await apiRequest('/students');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}

export async function getStudentByEmail(email: string) {
  try {
    const response = await apiRequest('/team/get-student', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return response.student || null;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
}

// ==================== Users API ====================

export async function getUsers() {
  const response = await apiRequest('/users');
  return response.data || response;
}

export async function getUserById(userId: string) {
  try {
    const response = await apiRequest('/auth/get-user', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    return response.user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function updateUser(userId: string, userData: any) {
  const response = await apiRequest('/profile/update', {
    method: 'POST',
    body: JSON.stringify({ userId, ...userData }),
  });
  return response.user || response;
}

// ==================== Team Management API ====================

export async function syncTeam(teamData: {
  userEmail: string;
  userId?: string;
  groupName: string;
  groupMembers: any[];
}) {
  try {
    const response = await apiRequest('/team/sync', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
    return response;
  } catch (error) {
    console.error('Error syncing team:', error);
    throw error;
  }
}

export async function removeTeamMember(data: {
  userEmail: string;
  userId?: string;
  memberEmailToRemove: string;
  groupMembers: any[];
  groupName: string;
}) {
  try {
    const response = await apiRequest('/team/remove-member', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

export async function updateTeamLeader(data: {
  userEmail: string;
  userId?: string;
  newLeaderId: string;
  groupMembers: any[];
  groupName: string;
}) {
  try {
    const response = await apiRequest('/team/update-leader', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error updating team leader:', error);
    throw error;
  }
}

// ==================== Team Invitations API ====================

export async function getTeamInvitations(userId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/team/invitations?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch invitations');
    }
    
    return data.invitations || [];
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    throw error;
  }
}

export async function acceptTeamInvitation(data: {
  userId: string;
  userEmail: string;
  invitationId: string;
  teamName: string;
  members: any[];
}) {
  try {
    const response = await apiRequest('/team/accept-invitation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

export async function rejectTeamInvitation(data: {
  userId: string;
  userEmail: string;
  invitationId: string;
  teamName: string;
  members: any[];
}) {
  try {
    const response = await apiRequest('/team/reject-invitation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    throw error;
  }
}

// ==================== Ideas API ====================

export async function getIdeas(supervisorId?: string) {
  try {
    const endpoint = supervisorId 
      ? `/ideas?supervisorId=${supervisorId}` 
      : '/ideas';
    const response = await apiRequest(endpoint);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching ideas:', error);
    throw error;
  }
}

export async function addIdea(ideaData: {
  supervisorId: string;
  title: string;
  description: string;
  category: string;
}) {
  try {
    const response = await apiRequest('/ideas/add', {
      method: 'POST',
      body: JSON.stringify(ideaData)
    });
    return response.idea;
  } catch (error) {
    console.error('Error adding idea:', error);
    throw error;
  }
}

export async function updateIdea(ideaId: string, ideaData: {
  title?: string;
  description?: string;
  category?: string;
}) {
  try {
    const response = await apiRequest('/ideas/update', {
      method: 'POST',
      body: JSON.stringify({ ideaId, ...ideaData })
    });
    return response.idea;
  } catch (error) {
    console.error('Error updating idea:', error);
    throw error;
  }
}

export async function deleteIdea(ideaId: string) {
  try {
    const response = await apiRequest('/ideas/delete', {
      method: 'POST',
      body: JSON.stringify({ ideaId })
    });
    return response;
  } catch (error) {
    console.error('Error deleting idea:', error);
    throw error;
  }
}

// ==================== Profile API ====================

export async function getProfile(userId?: string, email?: string) {
  try {
    const response = await apiRequest('/profile/get', {
      method: 'POST',
      body: JSON.stringify({ userId, email })
    });
    return response.user;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

export async function updateProfile(profileData: any) {
  try {
    const response = await apiRequest('/profile/update', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
    return response.user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// ==================== Import Sample Data ====================

export async function importSampleData(projects: any[], supervisors: any[]) {
  const response = await apiRequest('/import-sample-data', {
    method: 'POST',
    body: JSON.stringify({ projects, supervisors }),
  });
  return response.data || response;
}

