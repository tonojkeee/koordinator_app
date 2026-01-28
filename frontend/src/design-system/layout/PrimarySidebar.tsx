import React, { useMemo } from 'react';
import {
  MessageSquare,
  Mail,
  CheckSquare,
  Layout,
  Archive,
  ShieldCheck,
  Settings,
  Hexagon,
  HelpCircle,
  LogOut,
  Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../stores/useUIStore';
import { SidebarItem } from './SidebarItem';
import { Avatar } from '../components/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useTranslation } from 'react-i18next';

export const PrimarySidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeModule, setActiveModule } = useUIStore();
  const { user, logout } = useAuthStore();
  const { unreadCounts, unreadDocs, tasksUnreadCount, tasksReviewCount, emailsUnreadCount } = useUnreadStore();

  const totalChatUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const modules = useMemo(() => [
    {
      id: 'chat',
      label: t('sidebar.chats'),
      icon: <MessageSquare size={24} />,
      path: '/chat',
      badge: totalChatUnread
    },
    {
      id: 'email',
      label: t('layout.nav_email'),
      icon: <Mail size={24} />,
      path: '/email',
      badge: emailsUnreadCount
    },
    {
      id: 'tasks',
      label: t('layout.nav_tasks'),
      icon: <CheckSquare size={24} />,
      path: '/tasks',
      badge: tasksUnreadCount,
      warningBadge: tasksReviewCount
    },
    {
      id: 'board',
      label: t('board.title'),
      icon: <Layout size={24} />,
      path: '/board',
      badge: unreadDocs.length
    },
    {
      id: 'company',
      label: t('layout.nav_directory'),
      icon: <Users size={24} />,
      path: '/company'
    },
    {
      id: 'archive',
      label: t('sidebar.archive'),
      icon: <Archive size={24} />,
      path: '/archive'
    },
    {
      id: 'zsspd',
      label: t('zsspd.title'),
      icon: <ShieldCheck size={24} />,
      path: '/zsspd'
    },
  ], [t, totalChatUnread, emailsUnreadCount, tasksUnreadCount, tasksReviewCount, unreadDocs.length]);

  const handleModuleClick = (id: string, path: string) => {
    setActiveModule(id);
    navigate(path);
  };

  // Sync activeModule based on current path
  React.useEffect(() => {
    const currentPath = location.pathname;
    const module = modules.find(m => currentPath.startsWith(m.path));
    if (module) {
      setActiveModule(module.id);
    } else if (currentPath.startsWith('/settings')) {
      setActiveModule('settings');
    } else if (currentPath.startsWith('/admin')) {
      setActiveModule('admin');
    } else if (currentPath.startsWith('/help')) {
      setActiveModule('help');
    }
  }, [location.pathname, setActiveModule, modules]);

  return (
    <aside className="flex flex-col items-center w-16 h-screen bg-surface-1 border-r border-border py-4 z-40 shrink-0">
      {/* App Logo */}
      <div className="flex items-center justify-center w-12 h-12 mb-6 text-primary">
        <Hexagon size={32} fill="currentColor" fillOpacity={0.1} strokeWidth={2.5} className="animate-spin-slow" />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto no-scrollbar w-full">
        {modules.map((module) => (
          <SidebarItem
            key={module.id}
            icon={module.icon}
            label={module.label}
            isActive={activeModule === module.id}
            onClick={() => handleModuleClick(module.id, module.path)}
            badge={module.badge}
            warningBadge={module.warningBadge}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-2 mt-auto pt-4 border-t border-border/50 w-full">
        {user?.role === 'admin' && (
          <SidebarItem
            icon={<ShieldCheck size={24} className="text-amber-500" />}
            label={t('admin.dashboard')}
            isActive={activeModule === 'admin'}
            onClick={() => handleModuleClick('admin', '/admin')}
          />
        )}

        <SidebarItem
          icon={<HelpCircle size={24} />}
          label={t('help.title')}
          isActive={activeModule === 'help'}
          onClick={() => handleModuleClick('help', '/help')}
        />

        <SidebarItem
          icon={<Settings size={24} />}
          label={t('settings.title')}
          isActive={activeModule === 'settings'}
          onClick={() => handleModuleClick('settings', '/settings')}
        />

        <div className="h-px w-8 bg-border/50 my-1" />

        <button
          onClick={() => logout()}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
          title={t('common.logout')}
        >
          <LogOut size={22} />
        </button>

        <button
          onClick={() => handleModuleClick('settings', '/settings')}
          className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-primary/20 transition-all mt-1"
        >
          <Avatar
            src={user?.avatar_url}
            name={user?.full_name || user?.username || ''}
            size="sm"
            status="online"
          />
        </button>
      </div>
    </aside>
  );
};
