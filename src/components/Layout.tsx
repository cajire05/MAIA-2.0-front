import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatBot } from './ChatBot';
import { isProfileSetupComplete } from '../utils/profileSetup';
import { notificationsAPI } from '../services/api';
import { NOTIFICATIONS_CHANGED_EVENT } from '../utils/notificationEvents';
import { useShouldAutoStartWalkthrough, useWalkthrough } from '../tour/WalkthroughProvider';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  CalendarDays,
  BarChart3,
  GraduationCap,
  User as UserIconLucide,
  FolderHeart,
  MessageCircle,
  Lock,
  FilePlus,
  Bell,
  ClipboardList,
} from 'lucide-react';
import imgLogo from "figma:asset/logo-completo.png";

interface LayoutProps {
  children: ReactNode;
}

function DashboardIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <Home className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function LibraryIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <BookOpen className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function CalendarIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <CalendarDays className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function AnalyticsIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <BarChart3 className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function EducationIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <GraduationCap className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function UserIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <UserIconLucide className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function CollectionsIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <FolderHeart className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function ChatHistoryIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <MessageCircle className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function CreateResourceIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <FilePlus className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function BellIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <Bell className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

function SurveysIcon({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-[14px] w-[17px]">
      <ClipboardList className={`h-full w-full ${isActive ? 'text-white' : 'text-black'}`} />
    </div>
  );
}

const NAV_TOUR_IDS: Record<string, string> = {
  '/dashboard': 'nav-dashboard',
  '/library': 'nav-library',
  '/collections': 'nav-collections',
  '/my-resources': 'nav-my-resources',
  '/support': 'nav-support',
  '/surveys': 'nav-surveys',
  '/notifications': 'nav-notifications',
  '/chat-history': 'nav-chat-history',
  '/profile': 'nav-profile',
  '/requests': 'nav-requests',
  '/analytics': 'nav-analytics',
  '/admin/surveys': 'nav-admin-surveys',
  '/chat-history/admin': 'nav-chat-history-admin',
};

function isNavItemActive(pathname: string, itemPath: string): boolean {
  if (pathname === itemPath) return true;
  if (itemPath === '/my-resources' && pathname === '/library/create') return true;
  return false;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const walkthrough = useWalkthrough();
  const shouldAutoStartWalkthrough = useShouldAutoStartWalkthrough();
  const [didAutoStart, setDidAutoStart] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnread = () => {
      notificationsAPI.getUnreadCount(user.id).then((res) => {
        setUnreadCount(res.count);
      }).catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    const onNotificationsChanged = () => fetchUnread();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onNotificationsChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onNotificationsChanged);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    notificationsAPI.getUnreadCount(user.id).then((res) => {
      setUnreadCount(res.count);
    }).catch(() => {});
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if (didAutoStart) return;
    if (!shouldAutoStartWalkthrough) return;
    // Dispara el tour solo una vez cuando el layout ya está montado.
    setDidAutoStart(true);
    setIsCollapsed(false);
    const t = setTimeout(() => walkthrough.start(), 300);
    return () => clearTimeout(t);
  }, [didAutoStart, shouldAutoStartWalkthrough, walkthrough]);

  const profileComplete = isProfileSetupComplete(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    const isProfilePath = path === '/profile';
    if (!profileComplete && !isProfilePath) {
      setLockedTooltip(path);
      setTimeout(() => setLockedTooltip(null), 3000);
      return;
    }
    navigate(path);
  };

  const professorNavItems = [
    { path: '/dashboard', label: 'Inicio', icon: DashboardIcon },
    { path: '/library', label: 'Biblioteca', icon: LibraryIcon },
    { path: '/collections', label: 'Colecciones', icon: CollectionsIcon },
    { path: '/my-resources', label: 'Mis Recursos', icon: CreateResourceIcon },
    { path: '/support', label: 'Solicitar Apoyo', icon: CalendarIcon },
    { path: '/surveys', label: 'Encuestas', icon: SurveysIcon },
    { path: '/notifications', label: 'Notificaciones', icon: BellIcon },
    { path: '/chat-history', label: 'Historial IA', icon: ChatHistoryIcon },
    { path: '/profile', label: 'Perfil', icon: UserIcon }
  ];

  const departmentHeadNavItems = [
    { path: '/dashboard', label: 'Inicio', icon: DashboardIcon },
    ...(user?.isAdministrator
      ? [{ path: '/admin/surveys', label: 'Encuestas', icon: SurveysIcon }]
      : []),
    { path: '/requests', label: 'Solicitudes', icon: EducationIcon },
    { path: '/analytics', label: 'Analítica', icon: AnalyticsIcon },
    { path: '/library', label: 'Biblioteca', icon: LibraryIcon },
    { path: '/collections', label: 'Colecciones', icon: CollectionsIcon },
    { path: '/my-resources', label: 'Mis Recursos', icon: CreateResourceIcon },
    { path: '/chat-history/admin', label: 'Historial IA (usuarios)', icon: ChatHistoryIcon },
    { path: '/profile', label: 'Perfil', icon: UserIcon }
  ];

  const navItems = user?.role === 'professor' ? professorNavItems : departmentHeadNavItems;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className={`bg-white h-full rounded-br-[24px] rounded-tr-[24px] border-r-2 border-[#f5f7fb] transition-all duration-300 ${isCollapsed ? 'w-[98px]' : 'w-[280px]'} relative`}>
        <div className="box-border flex flex-col gap-[21px] h-full px-[15px] py-[20px]">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between gap-2" data-tour="sidebar-logo">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="relative shrink-0 size-[60px]">
                <img
                  alt="Universidad ICESI"
                  className="w-full h-full object-contain"
                  src={imgLogo}
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <h2 className="text-sm">Plataforma MAIA</h2>
                  <p className="text-xs text-muted-foreground">{user?.department}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-muted rounded transition-colors"
                data-testid="sidebar-collapse"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex justify-center p-1 hover:bg-muted rounded transition-colors"
              data-testid="sidebar-expand"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Navigation Icons */}
          <div className="flex flex-col gap-[10px] items-start w-full flex-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(location.pathname, item.path);
              const isProfilePath = item.path === '/profile';
              const isLocked = !profileComplete && !isProfilePath;
              const showTooltip = lockedTooltip === item.path;
              const isNotifications = item.path === '/notifications';
              const tourId = NAV_TOUR_IDS[item.path];
              return (
                <div key={index} className="relative w-full">
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.path)}
                    className={`${
                      isActive ? 'bg-[#5454e9]' : isLocked ? 'bg-white opacity-50 cursor-not-allowed' : 'bg-white hover:bg-muted'
                    } flex gap-3 h-[40px] items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4 text-left'} py-[8px] rounded-[8px] w-full transition-colors`}
                    title={isLocked ? 'Completa tu perfil primero' : item.label}
                    data-tour={tourId}
                    data-testid={tourId}
                  >
                    <div className="shrink-0">
                      <Icon isActive={isActive} />
                    </div>
                    {!isCollapsed && (
                      <span
                        className={`min-w-0 flex-1 text-left flex items-center gap-2 ${isActive ? 'text-white' : 'text-foreground'}`}
                      >
                        {item.label}
                        {isNotifications && unreadCount > 0 && (
                          <span className="inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </span>
                    )}
                    {isLocked && !isCollapsed && (
                      <Lock className="h-3 w-3 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {showTooltip && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-48 shadow-lg pointer-events-none">
                      <p className="font-medium">Perfil incompleto</p>
                      <p className="text-gray-300 mt-0.5">Completa tu perfil antes de acceder a esta sección.</p>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Info and Logout */}
          <div className="border-t border-border pt-4 space-y-2">
            {!isCollapsed && (
              <div className="px-2 py-1">
                <p className="text-sm truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">ID: {user?.idNumber}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className={`flex gap-3 h-[40px] items-center w-full px-4 py-2 rounded-[8px] bg-white hover:bg-muted transition-colors ${isCollapsed ? 'justify-center' : 'justify-start text-left'}`}
              title="Cerrar Sesión"
              data-testid="logout-button"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="min-w-0 flex-1 text-left">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>

      {/* Floating Chatbot*/}
      {user?.role === 'professor' && <ChatBot />}
    </div>
  );
}
