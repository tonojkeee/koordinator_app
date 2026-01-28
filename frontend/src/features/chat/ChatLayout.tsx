import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ChannelSidebar from './ChannelSidebar';
import { useNotificationsChannel } from '../../hooks/useNotificationsChannel';
import { useUIStore } from '../../stores/useUIStore';
import { SecondarySidebar } from '../../design-system';
import { useTranslation } from 'react-i18next';

const ChatLayout: React.FC = () => {
    const { t } = useTranslation();
    const setSecondaryNavContent = useUIStore(state => state.setSecondaryNavContent);
    const setActiveModule = useUIStore(state => state.setActiveModule);

    // Auto-connect to notifications channel to receive system messages
    useNotificationsChannel(() => {
        // System messages from notifications channel are handled by global WebSocket
    });

    useEffect(() => {
        setActiveModule('chat');

        // Set the secondary sidebar content for Chat
        setSecondaryNavContent(<ChannelSidebar />);

        // Cleanup on unmount
        return () => {
            setSecondaryNavContent(null);
        };
    }, [setSecondaryNavContent, setActiveModule]);

    return (
        <div className="flex w-full h-full bg-background overflow-hidden">
            <main className="flex-1 flex flex-col h-full min-w-0 bg-surface text-foreground relative overflow-hidden transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
};

export default ChatLayout;
