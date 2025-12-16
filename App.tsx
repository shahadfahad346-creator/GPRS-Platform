
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./frontend/lib/auth-context";
import { 
  Header, 
  Hero, 
  Features, 
  HowItWorks, 
  CTA, 
  Footer,
  ProfileSetup, 
  SmartHub, 
  ProjectArchive, 
  TextAnalysis,
  SupervisorProfiles, 
  MyProfile, 
  MemberProfile, 
  Login,
  SignUp, 
  SupervisorDashboard, 
  
} from "./frontend/components";
import { TeamInvitations } from "./src/components/TeamInvitations";
import { toast, Toaster } from 'sonner';
import { SupervisorProfile } from "./src/components/SupervisorProfile";
import "./frontend/styles/globals.css";

// Interfaces 
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

interface AppContentProps {
  invitations: TeamInvitation[];
  setInvitations: React.Dispatch<React.SetStateAction<TeamInvitation[]>>;
}
// إخفاء الطلبات المزعجة في الكونسول (للتطوير فقط)
if (process.env.NODE_ENV === 'development') {
  const originalLog = console.log;
  console.log = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('POST') && args[0].includes('/api/profile/get')) return;
    if (typeof args[0] === 'string' && args[0].includes('GET') && args[0].includes('/api/team/invitations')) return;
    originalLog(...args);
  };
}

function AppContent({ invitations, setInvitations }: AppContentProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Fetch invitations from the backend
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user?._id || !user?.token) {
        console.log('No user or token, skipping fetch invitations');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/team/invitations?userId=${user._id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.success && Array.isArray(data.invitations)) {
          setInvitations(data.invitations);
          console.log('Fetched invitations:', data.invitations);
        } else {
          throw new Error(data.error || 'Failed to fetch invitations');
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
        setInvitations([]);
        toast.error('Failed to fetch team invitations');
      }
    };
    fetchInvitations();
  }, [user, setInvitations]);

  // Check URL for admin access on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isAdminRoute = urlParams.get('admin') === 'update-supervisor';
    if (isAdminRoute && location.pathname !== '/admin-update' && location.pathname !== '/login' && location.pathname !== '/signup') {
      console.log('Redirecting to /admin-update due to admin param');
      navigate('/admin-update');
    }
  }, [location, navigate]);

  // Check if student needs profile setup based on user.hasProfile
  const needsProfileSetup = isAuthenticated && user?.role === 'student' && !user?.hasProfile;

  // Debug logging
  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      console.log('Student auth state:', {
        isAuthenticated,
        role: user.role,
        hasProfile: user.hasProfile,
        needsProfileSetup,
        userName: user.name,
        userId: user._id
      });
    }
  }, [isAuthenticated, user]);

  // Find selected member data
  const getSelectedMember = () => {
    if (!selectedMemberId || !user?.groupMembers) return null;
    const member = user.groupMembers.find((m: any) => m.id === selectedMemberId);
    if (!member) return null;
    return {
      ...member,
      _id: member.id,
      email: member.email,
      name: member.name
    };
  };


if (!isAuthenticated || !user?._id) {
  return (
    <Routes>
      {/* صفحة تسجيل الدخول */}
      <Route
        path="/login"
        element={<Login 
          onNavigateToSignUp={() => navigate('/signup')} 
          onNavigateToHome={() => navigate('/')}   // ← هنا التغيير المهم
        />}
      />

      {/* صفحة التسجيل */}
      <Route
        path="/signup"
        element={<SignUp 
          onNavigateToLogin={() => navigate('/login')} 
          onNavigateToHome={() => navigate('/')}    // ← وهنا كمان
        />}
      />

      {/* الصفحة الرئيسية (Landing Page) */}
      <Route
        path="/"
        element={
          <div className="min-h-screen">
            <Header
              onOpenAuthModal={() => navigate('/login')}
              isAuthModalOpen={false}
              onCloseAuthModal={() => {}}
            />
            <main>
              <Hero onOpenAuth={() => navigate('/login')} />
              <Features />
              <HowItWorks />
              <CTA onOpenAuth={() => navigate('/login')} />
            </main>
            <Footer />
          </div>
        }
      />

      {/* أي رابط غلط → ارجع للصفحة الرئيسية */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

  // If authenticated student without profile, show Profile Setup
  if (needsProfileSetup) {
    return (
      <ProfileSetup 
        onComplete={() => {
          console.log('Profile setup completed, redirecting to /SmartHub');
          navigate('/SmartHub');
        }} 
      />
    );
  }

  return (
    <Routes>
      {/* Authenticated Routes */}
      {user.role === 'supervisor' ? (
        <Route path="*" element={<SupervisorDashboard />} />
      ) : (
        <>
          <Route path="/SmartHub" element={<SmartHub onNavigate={(page) => navigate(`/${page}`)} />} />
          <Route
            path="/archive"
            element={
              <ProjectArchive
                onBack={() => navigate('/SmartHub')}
                onNavigate={(page, searchTerm) => {
                  console.log("Navigation triggered:", { page, searchTerm });
                  const path = searchTerm ? `/${page}?search=${encodeURIComponent(searchTerm)}` : `/${page}`;
                  navigate(path);
                }}
              />
            }
          />
          <Route path="/analysis" element={<TextAnalysis onBack={() => navigate('/SmartHub')} />} />
          <Route
            path="/supervisors"
            element={
              <SupervisorProfiles
                onBack={() => navigate('/SmartHub')}
                initialSearch={new URLSearchParams(location.search).get('search') || ''}
              />
            }
          />
          <Route
            path="/SupervisorProfile"
            element={<SupervisorProfile onBack={() => navigate('/supervisors')} />}
          />
          <Route
            path="/profile"
            element={
              <MyProfile
                onBack={() => navigate('/SmartHub')}
                onViewMember={(memberId) => {
                  setSelectedMemberId(memberId);
                  navigate('/member-profile');
                }}
              />
            }
          />
          <Route
            path="/member-profile"
            element={
              getSelectedMember() ? (
                <MemberProfile
                  member={getSelectedMember()!}
                  onBack={() => navigate('/profile')}
                />
              ) : (
                <Navigate to="/profile" replace />
              )
            }
          />
          <Route
            path="/invitations"
            element={
              user._id && user.email ? (
                <TeamInvitations
                  invitations={invitations}
                  currentUserId={user._id}
                  currentUserEmail={user.email}
                  onInvitationResponse={async (invitationId: string, action: 'accepted' | 'declined') => {
                    try {
                      const response = await fetch(`http://localhost:5000/api/team/${action === 'accepted' ? 'accept' : 'reject'}-invitation`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${user.token || ''}`
                        },
                        body: JSON.stringify({ invitationId, userId: user._id })
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                        setInvitations((prev) =>
                          prev.map((inv) =>
                            inv.id === invitationId 
                              ? { ...inv, status: action === 'accepted' ? 'accepted' : 'rejected' } 
                              : inv
                          )
                        );
                        toast.success(`Invitation ${action} successfully`);
                      } else {
                        throw new Error(data.error || `Failed to ${action} invitation`);
                      }
                    } catch (error) {
                      console.error(`Error ${action} invitation:`, error);
                      toast.error(`Failed to ${action} invitation`);
                    }
                  }}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </>
      )}
      {/* Unauthenticated Routes */}
      <Route
        path="/login"
        element={
          <Login
            onNavigateToSignUp={() => navigate('/signup')}
            onNavigateToHome={() => navigate('/')}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignUp
            onNavigateToLogin={() => navigate('/login')}
            onNavigateToHome={() => navigate('/')}
          />
        }
      />
      
      <Route
        path="/"
        element={
          <div className="min-h-screen">
            <Header
              onOpenAuthModal={() => navigate('/login')}
              isAuthModalOpen={false}
              onCloseAuthModal={() => {}}
            />
            <main>
              <Hero onOpenAuth={() => navigate('/login')} />
              <Features />
              <HowItWorks />
              <CTA onOpenAuth={() => navigate('/login')} />
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent invitations={invitations} setInvitations={setInvitations} />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}