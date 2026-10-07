import React from 'react';
import { Download, Smartphone, X, CheckCircle, ShieldCheck, Film, HardDrive, Loader2 } from 'lucide-react';

interface VideoDownloadPermissionModalProps {
  isOpen: boolean;
  videoUrl: string;
  videoTitle: string;
  poster?: string;
  onClose: () => void;
  onConfirmDownload: () => void;
  isDownloading: boolean;
  downloadProgress?: number;
}

export const VideoDownloadPermissionModal: React.FC<VideoDownloadPermissionModalProps> = ({
  isOpen,
  videoUrl,
  videoTitle,
  poster,
  onClose,
  onConfirmDownload,
  isDownloading,
  downloadProgress,
}) => {
  if (!isOpen) return null;

  const displayTitle = videoTitle || 'فيديو تم تشغيله';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white text-[#202124] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A73E8] to-[#1557B0] text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[16px]">إذن تحميل الفيديو للجهاز</h3>
              <p className="text-[12px] text-blue-100">تنزيل الملف الفعلي إلى مجلد Downloads</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-[14px] text-[#3C4043] leading-relaxed">
            هل توافق على منح الإذن لتحميل هذا الفيديو وحفظه في <strong>مجلد التنزيلات (Downloads)</strong> على هاتفك / جهازك؟
          </p>

          {/* Video Metadata Card */}
          <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] flex items-start gap-3">
            {poster ? (
              <img
                src={poster}
                alt={displayTitle}
                className="w-18 h-14 rounded-lg object-cover bg-black/10 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center shrink-0">
                <Film className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[13.5px] text-[#202124] line-clamp-2">
                {displayTitle}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#5F6368]">
                <span className="flex items-center gap-1 font-mono text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  MP4 High Quality
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  مجلد التنزيلات
                </span>
              </div>
            </div>
          </div>

          {/* Safety & Storage Confirmation Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[12px] text-blue-900 leading-normal">
            <ShieldCheck className="w-4 h-4 text-[#1A73E8] shrink-0 mt-0.5" />
            <div>
              سيتم تنزيل ملف الفيديو مباشرة عبر مدير تنزيلات المتصفح ليصبح متاحاً للتشغيل على هاتفك دون اتصال بالإنترنت في أي وقت.
            </div>
          </div>

          {/* Downloading Progress Indicator */}
          {isDownloading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[12px] text-[#1A73E8] font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  جاري التنزيل إلى مجلد التنزيلات بالجهاز...
                </span>
                {typeof downloadProgress === 'number' && (
                  <span>{Math.round(downloadProgress)}%</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A73E8] transition-all duration-300 rounded-full"
                  style={{
                    width:
                      typeof downloadProgress === 'number'
                        ? `${Math.max(15, downloadProgress)}%`
                        : '80%',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E8EAED] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#5F6368] hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onConfirmDownload}
            disabled={isDownloading}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#1A73E8] text-white hover:bg-blue-700 active:scale-95 transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري الحفظ للتنزيلات...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>موافقة وتنزيل الفيديو</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
