import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, FileUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import CompanyEmployees from './CompanyEmployees';
import api from '../../api/client';
import type { User, Unit } from '../../types';
import SendDocumentModal from '../board/components/SendDocumentModal';
import { useAuthStore } from '../../store/useAuthStore';
import { AxiosError } from 'axios';
import { Header, Button } from '../../design-system';

const CompanyPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((state) => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('all');

    // --- Data Fetching ---
    const { data: units, isLoading: unitsLoading } = useQuery<Unit[]>({
        queryKey: ['units'],
        queryFn: async () => {
            const res = await api.get('/auth/units');
            return res.data;
        },
    });

    const { data: users, isLoading: usersLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/auth/users');
            return res.data;
        },
    });

    const isLoading = unitsLoading || usersLoading;

    // --- Filtering ---
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const query = searchQuery.toLowerCase();
        
        return users.filter((user) => {
            // Text search filter
            const matchesSearch = 
                user.username.toLowerCase().includes(query) ||
                (user.full_name?.toLowerCase().includes(query)) ||
                (user.unit_name?.toLowerCase().includes(query)) ||
                (user.rank?.toLowerCase().includes(query)) ||
                (user.position?.toLowerCase().includes(query));
            
            // Unit filter
            const matchesUnit = selectedUnitId === 'all' || 
                (selectedUnitId === 'none' && !user.unit_id) ||
                user.unit_id?.toString() === selectedUnitId;
            
            return matchesSearch && matchesUnit;
        });
    }, [users, searchQuery, selectedUnitId]);

    // --- Mutations ---
    const startDMMutation = useMutation({
        mutationFn: async (userId: number) => {
            const res = await api.post(`/chat/direct/${userId}`);
            return res.data;
        },
        onSuccess: (channel) => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            navigate(`/chat/${channel.id}`);
        },
        onError: (error: unknown) => {
            console.error('Failed to start DM:', error);
            const err = error as AxiosError<{ detail: string }>;
            alert(t('common.error') + ': ' + (err.response?.data?.detail || err.message));
        }
    });

    // --- Handlers ---
    const handleStartDM = (userId: number) => {
        startDMMutation.mutate(userId);
    };

    const toggleUserSelection = (userId: number) => {
        if (currentUser?.id === userId) return;
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Unit filter options
    const unitOptions = [
        { value: 'all', label: t('company.all_units') },
        { value: 'none', label: t('company.no_unit') },
        ...(units || []).map(unit => ({
            value: unit.id.toString(),
            label: unit.name
        }))
    ];

    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden animate-fade-in">
            {/* Header with Design System */}
            <Header
                title={t('company.subtitle')}
                subtitle={t('company.title')}
                icon={<Users size={20} strokeWidth={2} />}
                iconColor="indigo"
                searchPlaceholder={t('users.searchPlaceholder')}
                searchValue={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onSearchClear={() => setSearchQuery('')}
                actions={
                    <div className="flex items-center gap-3">
                        {/* Unit Filter - Enhanced */}
                        <div className="relative group">
                            <select
                                value={selectedUnitId}
                                onChange={(e) => setSelectedUnitId(e.target.value)}
                                className="h-10 px-4 pr-10 bg-surface border border-border rounded-xl text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all shadow-sm cursor-pointer appearance-none uppercase tracking-widest min-w-[200px]"
                            >
                                {unitOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Send Document Button */}
                        {selectedUserIds.length > 0 && (
                            <Button
                                variant="primary"
                                size="md"
                                icon={<FileUp size={18} />}
                                onClick={() => setIsSendModalOpen(true)}
                                className="shadow-m3-2 font-black uppercase tracking-widest text-xs px-6 scale-105"
                            >
                                {t('board.send_document')} ({selectedUserIds.length})
                            </Button>
                        )}
                    </div>
                }
                sticky={true}
            />

            {/* Content - Employee List with smooth transition */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 custom-scrollbar">
                <div
                    key={selectedUnitId}
                    className="h-full w-full animate-slide-up"
                >
                    <CompanyEmployees
                        users={filteredUsers}
                        isLoading={isLoading}
                        selectedUserIds={selectedUserIds}
                        onToggleSelection={toggleUserSelection}
                        onStartDM={handleStartDM}
                        isDMPending={startDMMutation.isPending}
                        pendingDMUserId={startDMMutation.variables}
                        currentUser={currentUser}
                    />
                </div>
            </div>

            <SendDocumentModal
                isOpen={isSendModalOpen}
                onClose={() => {
                    setIsSendModalOpen(false);
                    setSelectedUserIds([]);
                }}
                recipientIds={selectedUserIds}
                recipientNames={users?.filter(u => selectedUserIds.includes(u.id)).map(u => u.full_name || u.username) || []}
            />
        </div>
    );
};

export default CompanyPage;
