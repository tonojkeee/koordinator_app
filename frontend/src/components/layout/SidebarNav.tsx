import React from 'react';
import { MessageCircle, HelpCircle, Book, ClipboardList, Mail, FileText, Archive, Shield, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useTranslation } from 'react-i18next';
import { Avatar, cn } from '../../design-system';

export const SidebarNav = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { unreadCounts, unreadDocs, tasksUnreadCount, tasksReviewCount, emailsUnreadCount } = useUnreadStore();

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
      to: '/email',
      badge: emailsUnreadCount
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
      iconClassName: 'text-amber-500' // Material Amber for security/shield
    },
  ];

  return (
    <nav className="hidden md:flex flex-col w-[68px] bg-teams-sidebar-rail border-r border-border items-center py-3 space-y-1.5 shrink-0 z-50 fixed inset-y-0 left-0">
      <div className="mb-4">
        <div className="w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 duration-300">
          <img src="/icon.png" alt="Logo" className="w-7 h-7 object-contain animate-spin-slow" />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-1 w-full px-2">
        {navItems.map((item) => (
          <SidebarItem key={item.to} {...item} />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center space-y-1 w-full px-2 pb-2">
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
            <div className="relative">
              <Avatar
                src={user?.avatar_url}
                name={user?.full_name || user?.username || ''}
                size="sm"
                className="w-8 h-8 rounded-full border border-border shadow-sm group-hover:border-primary/50 transition-colors"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-teams-sidebar-rail rounded-full" />
            </div>
          }
        />

        <button
          onClick={() => logout()}
          className="group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 hover:bg-destructive/10 text-muted-foreground hover:text-destructive mt-1"
          title={t('common.logout')}
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </div>
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
      className={({ isActive }) => {
        const baseClass = "group relative flex flex-col items-center justify-center w-[52px] h-[52px] rounded-xl transition-all duration-300";
        return isActive
          ? `${baseClass} text-primary bg-surface shadow-m3-1 scale-[1.05] is-active`
          : `${baseClass} text-muted-foreground hover:text-foreground hover:bg-surface-2`;
      }}
    >
      <div className="relative">
        {customIcon ? customIcon : Icon && (
          <NavLink to={to}>
            {({ isActive }) => (
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(iconClassName, "transition-transform group-hover:scale-110")}
              />
            )}
          </NavLink>
        )}

        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-destructive text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-m3-1 border-2 border-teams-sidebar-rail animate-scale-in">
            {badge > 99 ? '99+' : badge}
          </div>
        )}

        {warningBadge !== undefined && warningBadge > 0 && (
          <div className="absolute -bottom-2 -right-2 min-w-[18px] h-[18px] bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-m3-1 border-2 border-teams-sidebar-rail animate-scale-in">
            {warningBadge > 99 ? '99+' : warningBadge}
          </div>
        )}
      </div>

      {/* Indicator bar for active state */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full scale-y-0 transition-transform duration-300 origin-left group-[.active]:scale-y-100" />

      {/* Tooltip appearance */}
      <div className="absolute left-[72px] px-2 py-1.5 bg-foreground text-background text-[11px] font-bold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 whitespace-nowrap z-50 shadow-m3-2">
        {label}
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-transparent border-r-foreground" />
      </div>
    </NavLink>
  );
};
