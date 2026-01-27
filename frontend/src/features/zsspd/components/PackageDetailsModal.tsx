import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    FileText,
    AtSign,
    Clock,
    CheckCircle2,
    ExternalLink,
    Download
} from 'lucide-react';
import type { ZsspdPackage } from '../types';
import { ZsspdStatus } from '../types';
import { useAuthStore } from '../../../store/useAuthStore';

interface PackageDetailsModalProps {
    package: ZsspdPackage;
    onClose: () => void;
}

const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({ package: pkg, onClose }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const isOperator = user?.role === 'operator' || user?.role === 'admin';

    const getStatusIcon = (status: ZsspdStatus) => {
        switch (status) {
            case ZsspdStatus.DRAFT: return <Clock className="w-5 h-5 text-slate-400" />;
            case ZsspdStatus.READY: return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
            case ZsspdStatus.SENT: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            default: return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status: ZsspdStatus) => {
        switch (status) {
            case ZsspdStatus.SENT: return 'bg-green-50 text-green-700 border-green-100';
            case ZsspdStatus.READY: return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl border border-[#E0E0E0] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E0E0E0] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-md border ${getStatusColor(pkg.status)}`}>
                            {getStatusIcon(pkg.status)}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#242424] tracking-tight">
                                {t('zsspd.package_details_title')}
                            </h2>
                            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wide mt-0.5">
                                {pkg.outgoing_number || t('zsspd.no_number')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#F5F5F5] rounded-md text-[#616161] transition-colors">
                        <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wide ml-1">{t('zsspd.subject')}</label>
                            <div className="p-3 bg-[#F5F5F5] rounded-md border border-[#E0E0E0]">
                                <span className="text-sm font-semibold text-[#242424]">{pkg.subject || t('zsspd.no_subject')}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wide ml-1">{t('zsspd.status')}</label>
                            <div className={`p-3 rounded-md border flex items-center gap-2 ${getStatusColor(pkg.status)} shadow-sm`}>
                                {getStatusIcon(pkg.status)}
                                <span className="text-sm font-bold capitalize">{t(`zsspd.statuses.${pkg.status}`)}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wide ml-1">{t('zsspd.recipient')}</label>
                            <div className="p-3 bg-[#F5F5F5] rounded-md border border-[#E0E0E0] flex items-center gap-2">
                                <div className="p-1 bg-[#EEF2FF] rounded">
                                    <AtSign className="w-3.5 h-3.5 text-[#5B5FC7]" strokeWidth={1.5} />
                                </div>
                                <span className="text-sm font-semibold text-[#242424] truncate">{pkg.external_recipient}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wide ml-1">{t('zsspd.date')}</label>
                            <div className="p-3 bg-[#F5F5F5] rounded-md border border-[#E0E0E0] flex items-center gap-2">
                                <div className="p-1 bg-white rounded border border-[#E0E0E0]">
                                    <Clock className="w-3.5 h-3.5 text-[#616161]" strokeWidth={1.5} />
                                </div>
                                <span className="text-sm font-semibold text-[#242424]">
                                    {new Date(pkg.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-[#616161] uppercase tracking-wide ml-1 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                            {t('zsspd.files')} ({pkg.files?.length || 0})
                        </h3>
                        <div className="bg-white rounded-lg border border-[#E0E0E0] overflow-hidden">
                            {pkg.files && pkg.files.length > 0 ? (
                                <div className="divide-y divide-[#E0E0E0]">
                                    {pkg.files.map((file) => (
                                        <div key={file.id} className="p-3 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-[#F0F0F0] rounded-md text-[#616161] group-hover:text-[#5B5FC7] transition-colors">
                                                    <FileText className="w-5 h-5" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="text-sm font-semibold text-[#242424] truncate">{file.filename}</span>
                                                    <span className="text-[10px] font-medium text-[#888888] uppercase tracking-tight">
                                                        {(file.file_size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="p-2 hover:bg-[#EEF2FF] rounded-md text-[#888888] hover:text-[#5B5FC7] transition-all active:scale-95 border border-transparent hover:border-[#E0E7FF] opacity-0 group-hover:opacity-100">
                                                <Download className="w-4 h-4" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[#BDBDBD]">
                                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" strokeWidth={1} />
                                    <p className="text-sm font-medium">{t('zsspd.package_no_files')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#F5F5F5] border-t border-[#E0E0E0] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white hover:bg-[#FAFAFA] text-[#616161] rounded-md font-bold uppercase tracking-wide text-xs transition-all border border-[#E0E0E0] shadow-sm active:scale-[0.98]"
                    >
                        {t('common.close')}
                    </button>
                    {pkg.status === ZsspdStatus.READY && isOperator && (
                        <button
                            className="flex-[2] px-4 py-2.5 bg-[#5B5FC7] hover:bg-[#4f52b2] text-white rounded-md font-bold uppercase tracking-wide text-xs transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2} />
                            {t('zsspd.export_for_expeditionist')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PackageDetailsModal;
