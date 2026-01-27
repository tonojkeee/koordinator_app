import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    Archive,
    Plus
} from 'lucide-react';
import OutgoingTab from './components/OutgoingTab';
import { Header, Button } from '../../design-system';

const ZsspdPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'archive'>('outgoing');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const tabs = [
        { id: 'outgoing', label: t('zsspd.outgoing'), icon: ArrowUpRight },
        { id: 'incoming', label: t('zsspd.incoming'), icon: ArrowDownLeft },
        { id: 'archive', label: t('zsspd.archive'), icon: Archive },
    ] as const;

    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F5] overflow-hidden animate-in">
            {/* Header with Design System */}
            <Header
                title={activeTab === 'outgoing' ? t('zsspd.outgoing') : activeTab === 'incoming' ? t('zsspd.incoming') : t('zsspd.archive')}
                subtitle={t('zsspd.title')}
                icon={<Package size={20} />}
                iconColor="indigo"
                tabs={tabs.map(tab => ({
                    id: tab.id,
                    label: tab.label,
                    icon: <tab.icon size={16} strokeWidth={1.5} />
                }))}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as 'outgoing' | 'incoming' | 'archive')}
                actions={
                    activeTab === 'outgoing' && (
                        <Button
                            variant="primary"
                            size="md"
                            icon={<Plus size={18} />}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <span className="hidden sm:inline">{t('zsspd.new_package')}</span>
                        </Button>
                    )
                }
                sticky={true}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4 custom-scrollbar">
                <div className="w-full">
                    {activeTab === 'outgoing' && (
                        <OutgoingTab
                            isModalOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                        />
                    )}
                    {activeTab === 'incoming' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-[#E0E0E0] shadow-sm">
                            <ArrowDownLeft className="w-16 h-16 text-[#E0E0E0] mb-4" strokeWidth={1} />
                            <h3 className="text-lg font-bold text-[#888888]">
                                {t('zsspd.no_incoming_packages')}
                            </h3>
                        </div>
                    )}
                    {activeTab === 'archive' && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-[#E0E0E0] shadow-sm">
                            <Archive className="w-16 h-16 text-[#E0E0E0] mb-4" strokeWidth={1} />
                            <h3 className="text-lg font-bold text-[#888888]">
                                {t('zsspd.archive_empty')}
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ZsspdPage;
