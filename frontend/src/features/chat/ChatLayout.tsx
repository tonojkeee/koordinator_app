import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ChannelSidebar from './ChannelSidebar';
import { Menu } from 'lucide-react';
import { useNotificationsChannel } from '../../hooks/useNotificationsChannel';

const ChatLayout: React.FC = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Auto-connect to notifications channel to receive system messages
    useNotificationsChannel(() => {
        // System messages from notifications channel are handled by global WebSocket
        // This connection ensures real-time delivery even if user is not viewing channel
    });

    return (
        <div className="flex w-full h-full bg-[#F5F5F7]">
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-[68px] z-20 w-80 bg-[#F5F5F7] border-r border-slate-200 transform transition-transform duration-300
                md:relative md:translate-x-0 md:left-0 md:w-80 md:flex-shrink-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <ChannelSidebar onCloseMobile={() => setIsMobileOpen(false)} />
            </aside>

            <main className="flex-1 flex flex-col h-full min-w-0 bg-white relative shadow-sm overflow-hidden">
                <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="md:hidden absolute top-3 left-3 z-10 p-2 bg-white/80 backdrop-blur rounded-md shadow-sm border border-slate-200 text-slate-600 hover:bg-white"
                >
                    <Menu size={20} />
                </button>

                <Outlet />
            </main>
        </div>
    );
};

export default ChatLayout;
