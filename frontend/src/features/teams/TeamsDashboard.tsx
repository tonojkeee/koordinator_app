import React from 'react';
import { Card, Avatar } from '../../design-system';
import { MoreHorizontal, Video, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TeamsDashboard = () => {
    const { t } = useTranslation();
    
    return (
        <div className="p-6 grid grid-cols-12 gap-6 h-full overflow-y-auto bg-slate-50">
            <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><MessageSquare size={20} /></span>
                        {t('teams.dashboard.digital_solutions') || 'Digital Solutions Team'}
                    </h1>
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-100 pb-4 mb-4">
                        <span className="text-indigo-600 border-b-2 border-indigo-600 pb-4 -mb-4 px-2 cursor-pointer">{t('teams.dashboard.posts')}</span>
                        <span className="hover:text-slate-700 px-2 cursor-pointer">{t('teams.dashboard.files')}</span>
                        <span className="hover:text-slate-700 px-2 cursor-pointer">{t('teams.dashboard.tasks')}</span>
                        <span className="hover:text-slate-700 px-2 cursor-pointer">{t('teams.dashboard.wiki')}</span>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between border border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                <Video size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900">{t('teams.dashboard.sprint_review_time') || 'Sprint Review at 2:00 PM'}</h3>
                                <p className="text-xs text-indigo-700">{t('teams.dashboard.dont_forget_updates') || "Don't forget to bring your updates."}</p>
                            </div>
                        </div>
                        <button className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
                            {t('teams.dashboard.join_meeting')}
                        </button>
                    </div>
                </div>
                
                <PostCard 
                    author="Michael Ivanov" 
                    time="10:42 AM" 
                    content={t('teams.dashboard.mock_post_1') || "Design mockups updated. Take a look! 🎨"}
                    isPrimary
                    reactions={[{ emoji: '👍', count: 5 }, { emoji: '🤩', count: 5 }]}
                />
                
                <PostCard 
                    author="Natalia Orlovac" 
                    time="10:50 AM" 
                    content={t('teams.dashboard.mock_post_2') || "Great, I'll review the new mockups! This looks fantastic."}
                    reactions={[{ emoji: '👍', count: 2 }, { emoji: '✅', count: 1 }]}
                />

                <PostCard 
                    author="Alexey Smirnov" 
                    time="11:15 AM" 
                    content={t('teams.dashboard.mock_post_3') || "Reminder: Client presentation tomorrow at 3 PM. Be prepared!"}
                />
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
                <Widget title={t('teams.dashboard.sprint_review_meeting') || "Sprint Review Meeting"}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">{t('chat.today')} • 2:00 PM - 3:00 PM</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <Avatar key={i} name={`User ${i}`} size="sm" className="ring-2 ring-white" />
                                ))}
                            </div>
                            <span className="text-sm font-bold text-slate-700 ml-2">5 {t('teams.dashboard.meeting_participants')}</span>
                        </div>
                    </div>
                </Widget>

                <Widget title={t('teams.dashboard.prepare_meeting')}>
                    <div className="space-y-2">
                        <CheckItem label={t('teams.dashboard.review_mockups')} checked />
                        <CheckItem label={t('teams.dashboard.finalize_report')} checked />
                        <CheckItem label={t('teams.dashboard.discuss_feedback')} checked />
                    </div>
                </Widget>

                <Widget title={t('teams.dashboard.shared_files')}>
                    <div className="space-y-3">
                        <FileItem name="Project Timeline v2.pdf" type="pdf" />
                        <FileItem name="Design Mockups.pptx" type="pptx" />
                        <FileItem name="Client Presentation Deck.pptx" type="pptx" />
                    </div>
                </Widget>

                <Widget title={t('teams.dashboard.members')}>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                         {[1,2,3,4].map(i => (
                            <div key={i} className="flex flex-col items-center min-w-[60px]">
                                <Avatar name={`Member ${i}`} size="md" status="online" />
                                <span className="text-[10px] font-medium text-slate-600 mt-1 truncate w-full text-center">{t('users.employee')} {i}</span>
                            </div>
                        ))}
                    </div>
                </Widget>
            </div>
        </div>
    );
};

const Widget = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card className="p-4 border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">{title}</h3>
            <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={16} />
            </button>
        </div>
        {children}
    </Card>
);

const PostCard = ({ author, time, content, reactions, isPrimary, image }: { 
    author: string; 
    time: string; 
    content: string; 
    reactions?: { emoji: string; count: number }[]; 
    isPrimary?: boolean; 
    image?: string 
}) => (
    <Card className={`p-4 border-slate-200 shadow-sm ${isPrimary ? 'bg-white' : 'bg-white/50'}`}>
        <div className="flex gap-3">
            <Avatar name={author} size="md" />
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <h4 className="font-bold text-slate-900">{author}</h4>
                    <span className="text-xs text-slate-400">{time}</span>
                </div>
                <div className="mt-1 text-slate-700 text-sm leading-relaxed">
                    {content}
                </div>
                {image && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-100">
                        <img src={image} alt="Post attachment" className="w-full h-auto" />
                    </div>
                )}
                {reactions && (
                    <div className="flex gap-2 mt-3">
                        {reactions.map((r, i) => (
                            <div key={i} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full text-xs font-medium text-slate-600">
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </Card>
);

const CheckItem = ({ label, checked }: { label: string, checked?: boolean }) => (
    <div className="flex items-center gap-3 group cursor-pointer">
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
            {checked && <CheckSquare size={12} fill="currentColor" className="text-white" />}
        </div>
        <span className={`text-sm ${checked ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{label}</span>
    </div>
);

const FileItem = ({ name, type }: { name: string, type: string }) => {
    const color = type === 'pdf' ? 'text-rose-500' : 'text-amber-600';
    return (
        <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
            <FileText size={20} className={color} />
            <span className="text-sm text-slate-700 group-hover:text-indigo-600 font-medium truncate">{name}</span>
        </div>
    );
};
