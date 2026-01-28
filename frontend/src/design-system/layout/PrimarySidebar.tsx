import React from 'react';
import {
  MessageSquare,
  Mail,
  CheckSquare,
  Layout,
  Archive,
  ShieldCheck,
  Database,
  Settings,
  Hexagon
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { SidebarItem } from './SidebarItem';
import { Avatar } from '../components/Avatar';

const modules = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={24} /> },
  { id: 'email', label: 'Email', icon: <Mail size={24} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={24} /> },
  { id: 'board', label: 'Board', icon: <Layout size={24} /> },
  { id: 'archive', label: 'Archive', icon: <Archive size={24} /> },
  { id: 'zsspd', label: 'ZSSPD', icon: <Database size={24} /> },
  { id: 'admin', label: 'Admin', icon: <ShieldCheck size={24} /> },
];

export const PrimarySidebar: React.FC = () => {
  const { activeModule, setActiveModule } = useUIStore();

  return (
    <aside className="flex flex-col items-center w-16 h-screen bg-white border-r border-slate-200 py-4 z-40">
      {/* App Logo */}
      <div className="flex items-center justify-center w-12 h-12 mb-6 text-blue-600">
        <Hexagon size={32} fill="currentColor" fillOpacity={0.1} strokeWidth={2.5} />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        {modules.map((module) => (
          <SidebarItem
            key={module.id}
            icon={module.icon}
            label={module.label}
            isActive={activeModule === module.id}
            onClick={() => setActiveModule(module.id)}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-4 mt-auto pt-4 border-t border-slate-100">
        <SidebarItem
          icon={<Settings size={24} />}
          label="Settings"
          isActive={activeModule === 'settings'}
          onClick={() => setActiveModule('settings')}
        />

        <button className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-100 transition-all">
          <Avatar
            name="System User"
            size="sm"
            status="online"
          />
        </button>
      </div>
    </aside>
  );
};
