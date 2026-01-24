import React from 'react';
import { MessageCircle, HelpCircle, Book, ClipboardList, Mail, FileText, Archive, Shield, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../design-system';

export const SidebarNav = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { unreadCounts, unreadDocs, tasksUnreadCount, tasksReviewCount } = useUnreadStore();
  
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const navItems = [
    { 
      icon: MessageCircle, 
      label: t('sidebar.chats'), 
      to: '/chat', 
      badge: totalUnread 
    },
    { 
      icon: Mail, 
      label: t('layout.nav_email'), 
      to: '/email' 
    },
    { 
      icon: Book, 
      label: t('layout.nav_directory'), 
      to: '/company' 
    },
    { 
      icon: ClipboardList, 
      label: t('layout.nav_tasks'), 
      to: '/tasks',
      badge: tasksUnreadCount,
      warningBadge: tasksReviewCount
    },
    { 
      icon: FileText, 
      label: t('board.title'), 
      to: '/board',
      badge: unreadDocs.length
    },
    { 
      icon: Archive, 
      label: t('sidebar.archive'), 
      to: '/archive' 
    },
    { 
      icon: Shield, 
      label: t('zsspd.title'), 
      to: '/zsspd',
      iconClassName: 'text-amber-400'
    },
  ];

  return (
    <nav className="hidden md:flex flex-col w-[68px] bg-teams-sidebar items-center py-4 space-y-2 text-slate-400 shrink-0 z-50 border-r border-slate-700/50 fixed inset-y-0 left-0">
      <div className="mb-4">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <img src="/icon.png" alt="Logo" className="w-6 h-6 object-contain" />
        </div>
      </div>

      {navItems.map((item) => (
        <SidebarItem key={item.to} {...item} />
      ))}

      <div className="flex-1" />

      <SidebarItem 
        to="/help"
        icon={HelpCircle}
        label={t('help.title')}
      />

      {user?.role === 'admin' && (
        <SidebarItem
          to="/admin"
          icon={Shield}
          label={t('admin.dashboard')}
        />
      )}

      <SidebarItem
        to="/settings"
        label={user?.full_name || ''}
        customIcon={
            <Avatar
                src={user?.avatar_url}
                name={user?.full_name || user?.username || ''}
                size="sm"
                className="ring-2 ring-slate-600 w-8 h-8"
            />
        }
      />

      <button
        onClick={() => logout()}
        className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 hover:text-white hover:bg-red-500/20 text-slate-400"
        title={t('common.logout')}
      >
        <LogOut size={20} />
      </button>
    </nav>
  );
};

interface SidebarItemProps {
  to: string;
  icon?: React.ElementType;
  customIcon?: React.ReactNode;
  label: string;
  badge?: number;
  warningBadge?: number;
  iconClassName?: string;
}

const SidebarItem = ({ to, icon: Icon, customIcon, label, badge, warningBadge, iconClassName }: SidebarItemProps) => {
    return (
        <NavLink
          to={to}
          className={({ isActive }) =>
            `group relative flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'text-teams-accent border-l-4 border-teams-accent bg-white/5 shadow-lg' 
                : 'hover:text-white hover:bg-white/10'
            }`
          }
          title={label}
        >
          {customIcon ? customIcon : Icon && <Icon size={24} className={iconClassName} />}
          
          {badge !== undefined && badge > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-[#2D2F3F]">
                {badge > 99 ? '99+' : badge}
            </div>
          )}

          {warningBadge !== undefined && warningBadge > 0 && (
            <div className="absolute -bottom-1 -right-1 min-w-[16px] h-[16px] bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm ring-2 ring-[#2D2F3F]">
                {warningBadge > 99 ? '99+' : warningBadge}
            </div>
          )}
        </NavLink>
    );
};
