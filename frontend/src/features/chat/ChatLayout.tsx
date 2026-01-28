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
        <div className="flex w-full h-full bg-background overflow-hidden">
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-[68px] z-20 w-80 bg-surface-1 border-r border-border transform transition-transform duration-500 shadow-m3-1
                md:relative md:translate-x-0 md:left-0 md:w-[320px] md:flex-shrink-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <ChannelSidebar onCloseMobile={() => setIsMobileOpen(false)} />
            </aside>

            <main className="flex-1 flex flex-col h-full min-w-0 bg-surface text-foreground relative overflow-hidden transition-all duration-300">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="md:hidden absolute top-3 left-3 z-10 p-2 bg-surface/90 backdrop-blur rounded-xl shadow-m3-1 border border-border text-muted-foreground hover:bg-surface-2 hover:text-primary active:scale-95 transition-all"
                >
                    <Menu size={20} strokeWidth={2.5} />
                </button>

                <Outlet />
            </main>
        </div>
    );
};

export default ChatLayout;
