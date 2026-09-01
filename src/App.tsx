import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { WalkthroughProvider } from './tour/WalkthroughProvider';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { DepartmentDashboard } from './pages/DepartmentDashboard';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { CreateResource } from './pages/CreateResource';
import { MyResources } from './pages/MyResources';
import { SupportRequest } from './pages/SupportRequest';
import { RequestManagement } from './pages/RequestManagement';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { Collections } from './pages/Collections';
import { ChatHistory } from './pages/ChatHistory';
import { ChatHistoryAdmin } from './pages/ChatHistoryAdmin';
import { Notifications } from './pages/Notifications';
import { TeacherSurveys } from './pages/TeacherSurveys';
import { SurveyAdmin } from './pages/SurveyAdmin';
import { isProfileSetupComplete } from './utils/profileSetup';

function getDefaultRoute(user: Parameters<typeof isProfileSetupComplete>[0]): string {
  if (!user) return '/login';
  return isProfileSetupComplete(user) ? '/dashboard' : '/profile';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5454e9] mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const setupComplete = isProfileSetupComplete(user);
  if (!setupComplete && location.pathname !== '/profile' && location.pathname !== '/edit-profile') {
    return <Navigate to="/profile" replace />;
  }

  return <Layout>{children}</Layout>;
}

function DashboardRouter() {
  const { user } = useAuth();

  // Debug: Log user role to help diagnose issues
  if (user) {
    console.log('DashboardRouter - User role:', user.role);
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'professor') {
    return <ProfessorDashboard />;
  } else if (user.role === 'department_head') {
    return <DepartmentDashboard />;
  }

  // Fallback: if role doesn't match, show professor dashboard
  console.warn('Unknown role, defaulting to professor dashboard. Role was:', user.role);
  return <ProfessorDashboard />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={getDefaultRoute(user)} replace /> : <Register />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <ResourceLibrary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library/create"
        element={
          <ProtectedRoute>
            <CreateResource />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-resources"
        element={
          <ProtectedRoute>
            <MyResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <SupportRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <RequestManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/collections"
        element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-history"
        element={
          <ProtectedRoute>
            <ChatHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-history/admin"
        element={
          <ProtectedRoute>
            <ChatHistoryAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys"
        element={
          <ProtectedRoute>
            <TeacherSurveys />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/surveys"
        element={
          <ProtectedRoute>
            <SurveyAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={getDefaultRoute(user)} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute(user)} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalkthroughProvider>
          <ChatProvider>
            <AppRoutes />
            <Toaster />
          </ChatProvider>
        </WalkthroughProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
