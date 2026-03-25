'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { fleetNavigation, toolsNavigation, adminNavigation } from '@/data/mock-data';
import { useAuth } from '@/contexts';
import { notificationsService } from '@/lib/api';
import { changeLanguage } from '@/lib/i18n';
import { Truck, Wrench, ShieldCheck } from 'lucide-react';
import type { User, NavItem, UserRole, Notification } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
}

// Filter navigation items based on user role
function filterNavigationByRole(navigation: NavItem[], userRole: UserRole): NavItem[] {
  return navigation
    .filter((item) => {
      // If no roles specified, show to everyone
      if (!item.roles || item.roles.length === 0) return true;
      // Check if user's role is in the allowed roles
      return item.roles.includes(userRole);
    })
    .map((item) => {
      // If item has children, filter them too
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter((child) => {
          if (!child.roles || child.roles.length === 0) return true;
          return child.roles.includes(userRole);
        });
        return { ...item, children: filteredChildren };
      }
      return item;
    });
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(false);

  // Sync language with user profile
  React.useEffect(() => {
    if (user?.language) {
      changeLanguage(user.language);
    }
  }, [user?.language]);

  // Persist sidebar state
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Fetch notifications
  React.useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        setIsLoadingNotifications(true);
        const data = await notificationsService.getAll({ limit: 20 });
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // Keep empty array on error
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // TODO: Implement global search
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Create display user from auth context
  const displayUser: User = user || {
    id: '',
    organizationId: '',
    email: '',
    firstName: 'User',
    lastName: '',
    role: 'viewer' as const,
    isActive: true,
    themePreference: 'system',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Select navigation and branding based on current module
  const isToolsModule = pathname.startsWith('/tools');
  const isAdminModule = pathname.startsWith('/admin') || pathname.startsWith('/settings');
  const moduleNavigation = React.useMemo(() => {
    if (isToolsModule) return toolsNavigation;
    if (isAdminModule) return adminNavigation;
    return fleetNavigation;
  }, [isToolsModule, isAdminModule]);
  const moduleName = isToolsModule ? 'Tool Manager' : isAdminModule ? 'Administration' : 'Fleet Manager';
  const moduleIcon = isToolsModule ? Wrench : isAdminModule ? ShieldCheck : Truck;

  // Filter navigation based on user role
  const filteredNavigation = React.useMemo(() => filterNavigationByRole(moduleNavigation, displayUser.role), [moduleNavigation, displayUser.role]);

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Sidebar */}
      <Sidebar navigation={filteredNavigation} isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} moduleName={moduleName} moduleIcon={moduleIcon} />

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <Header
          user={displayUser}
          notifications={notifications}
          onLogout={logout}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />

        {/* Page Content */}
        <main className='flex-1 overflow-auto bg-muted/30 p-6'>{children}</main>
      </div>
    </div>
  );
}
