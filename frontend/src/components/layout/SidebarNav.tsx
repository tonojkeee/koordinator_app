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
      iconClassName: 'text-amber-400'
    },
  ];

  return (
    <nav className="hidden md:flex flex-col w-[68px] bg-teams-sidebar items-center py-3 space-y-1 text-[#b8b8b8] shrink-0 z-50 fixed inset-y-0 left-0 shadow-xl">
      <div className="mb-3">
        <div className="w-10 h-10 bg-[#464775] rounded-xl flex items-center justify-center shadow-md">
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
            className="ring-2 ring-[#464775] w-8 h-8"
          />
        }
      />

      <button
        onClick={() => logout()}
        className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 hover:text-white hover:bg-[#3D3D3D] text-[#b8b8b8] mt-1"
        title={t('common.logout')}
      >
        <LogOut size={22} strokeWidth={1.5} />
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
        `group relative flex flex-col items-center justify-center w-[58px] h-[58px] rounded-lg transition-all duration-200 mb-1 ${isActive
          ? 'text-[#5B5FC7] bg-white shadow-md'
          : 'hover:text-white hover:bg-[#3D3D3D]'
        }`
      }
      title={label}
    >
      {customIcon ? customIcon : Icon && <Icon size={26} strokeWidth={1.5} className={iconClassName} />}

      <span className="text-[10px] font-medium mt-0.5 max-w-full truncate px-1 opacity-90">
          {/* Label is hidden in classic Teams rail but often useful. We'll keep it small or hide it depending on preference.
              Let's keep it very subtle or hide it if we want strict Teams look. Teams has labels. */}
          {/* {label} */}
      </span>

      {badge !== undefined && badge > 0 && (
        <div className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#C4314B] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-[#2D2D2D]">
          {badge > 99 ? '99+' : badge}
        </div>
      )}

      {warningBadge !== undefined && warningBadge > 0 && (
        <div className="absolute bottom-1 right-1 min-w-[18px] h-[18px] bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm ring-2 ring-[#2D2D2D]">
          {warningBadge > 99 ? '99+' : warningBadge}
        </div>
      )}
    </NavLink>
  );
};
