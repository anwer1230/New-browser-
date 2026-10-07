import React, { useState } from 'react';
import {
  History,
  X,
  Search,
  Film,
  Globe,
  Play,
  Download,
  Trash2,
  Database,
  CheckCircle2,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface WatchHistoryEntry {
  id: string;
  videoId: string;
  title: string;
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  progressSeconds: number;
  quality?: string;
  offlineReady?: boolean;
  offlineStreamUrl?: string;
  lastWatchedAt: string;
}

export interface BrowseHistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: string;
}

interface ComprehensiveHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  watchHistory: WatchHistoryEntry[];
  browseHistory: BrowseHistoryEntry[];
  onPlayVideo: (videoUrl: string, title: string) => void;
  onOpenPage: (url: string) => void;
  onRequestDownload: (videoUrl: string, title: string) => void;
  onDeleteWatchItem: (id: string) => void;
  onDeleteBrowseItem: (id: string) => void;
  onClearAllHistory: () => void;
  onOpenDatabasesModal: () => void;
}

export const ComprehensiveHistoryDrawer: React.FC<ComprehensiveHistoryDrawerProps> = ({
  isOpen,
  onClose,
  watchHistory,
  browseHistory,
  onPlayVideo,
  onOpenPage,
  onRequestDownload,
  onDeleteWatchItem,
  onDeleteBrowseItem,
  onClearAllHistory,
  onOpenDatabasesModal,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'web'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const q = searchQuery.trim().toLowerCase();

  const filteredVideos = watchHistory.filter(
    (v) =>
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.videoUrl.toLowerCase().includes(q)
  );

  const filteredWeb = browseHistory.filter(
    (w) =>
      !q ||
      w.title.toLowerCase().includes(q) ||
      w.url.toLowerCase().includes(q)
  );

  type CombinedItem =
    | { type: 'video'; data: WatchHistoryEntry; timestamp: string }
    | { type: 'web'; data: BrowseHistoryEntry; timestamp: string };

  const allItems: CombinedItem[] = [
    ...filteredVideos.map((v) => ({
      type: 'video' as const,
      data: v,
      timestamp: v.lastWatchedAt || '',
    })),
    ...filteredWeb.map((w) => ({
      type: 'web' as const,
      data: w,
      timestamp: w.visitedAt || '',
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const formatTimestamp = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl h-[86vh] bg-white text-[#202124] rounded-t-[24px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
        dir="rtl"
      >
        {/* Handle */}
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2 shrink-0" />

        {/* الهيدر */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#202124]">
                  السجل الشامل (المشاهدة والتصفح)
                </h3>
                <button
                  type="button"
                  onClick={onOpenDatabasesModal}
                  className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                  title="عرض حالة القواعد الخمس"
                >
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>5 قواعد نشطة ⚡</span>
                </button>
              </div>
              <p className="text-[11.5px] text-[#5F6368]">
                أي فيديو شاهدته محفوظ تلقائياً ويمكنك تشغيله حتى بدون إنترنت 💾
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5F6368] hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* شريط التبويبات الثلاثة */}
        <div className="px-5 pt-2 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'all'
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>الكل ({allItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'videos'
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>سجل المشاهدة ({watchHistory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('web')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeTab === 'web'
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>سجل التصفح ({browseHistory.length})</span>
            </button>
          </div>

          {(watchHistory.length > 0 || browseHistory.length > 0) && (
            <button
              type="button"
              onClick={onClearAllHistory}
              className="text-xs text-red-600 hover:text-red-700 font-medium pb-2 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          )}
        </div>

        {/* شريط البحث */}
        <div className="px-5 py-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-[#F1F3F4]">
            <Search className="w-4 h-4 text-[#5F6368] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في سجل المشاهدة والمواقع التي زرتها..."
              className="w-full bg-transparent text-sm text-[#202124] placeholder-[#5F6368] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#5F6368] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* قائمة السجل */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5">
          {activeTab === 'videos' ? (
            filteredVideos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
                <Film className="w-14 h-14 stroke-1 mb-3 text-blue-500" />
                <div className="text-sm font-semibold text-gray-700">
                  لا توجد مقاطع فيديو في سجل المشاهدة
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  عند تشغيل أي فيديو في المتصفح سيتم حفظه تلقائياً هنا ليصبح جاهزاً للتشغيل حتى بدون إنترنت!
                </p>
              </div>
            ) : (
              filteredVideos.map((video) => renderVideoCard(video))
            )
          ) : activeTab === 'web' ? (
            filteredWeb.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
                <Globe className="w-14 h-14 stroke-1 mb-3 text-gray-400" />
                <div className="text-sm font-semibold text-gray-700">
                  لا توجد صفحات في سجل التصفح
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  كل صفحة تزورها ستظهر هنا للرجوع إليها سريعاً.
                </p>
              </div>
            ) : (
              filteredWeb.map((page) => renderWebCard(page))
            )
          ) : allItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16">
              <History className="w-14 h-14 stroke-1 mb-3 text-gray-400" />
              <div className="text-sm font-semibold text-gray-700">السجل فارغ تماماً</div>
              <p className="text-xs text-gray-400 mt-1">
                تصفح المواقع أو شاهد الفيديوهات لترى سجلك الشامل هنا.
              </p>
            </div>
          ) : (
            allItems.map((item) =>
              item.type === 'video'
                ? renderVideoCard(item.data)
                : renderWebCard(item.data)
            )
          )}
        </div>
      </div>
    </div>
  );

  function renderVideoCard(video: WatchHistoryEntry) {
    const streamTarget = video.offlineStreamUrl || video.videoUrl;
    return (
      <div
        key={video.id}
        className="p-3.5 rounded-[14px] bg-[#F8F9FA] border border-[#E8EAED] hover:border-[#1A73E8] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-16 h-12 rounded-lg object-cover bg-black/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center shrink-0">
              <Film className="w-6 h-6" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[13.5px] text-[#202124] truncate">
                {video.title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold flex items-center gap-1 shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>محفوظ بدون إنترنت 💾</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#5F6368] mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(video.lastWatchedAt)}
              </span>
              <span>• المدة: {video.duration} ثانية</span>
              {video.progressSeconds > 0 && (
                <span className="text-[#1A73E8] font-medium">
                  • تمت مشاهدة {video.progressSeconds}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* أزرار التشغيل والتنزيل والحذف */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-gray-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPlayVideo(streamTarget, video.title);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1A73E8] text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="تشغيل الفيديو (يعمل حتى بدون اتصال بالإنترنت)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>تشغيل بدون إنترنت</span>
          </button>

          <button
            type="button"
            onClick={() => onRequestDownload(video.videoUrl, video.title)}
            className="p-1.5 rounded-lg text-[#1A73E8] hover:bg-blue-50 transition cursor-pointer"
            title="تحميل للجهاز"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteWatchItem(video.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="حذف من السجل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  function renderWebCard(page: BrowseHistoryEntry) {
    return (
      <div
        key={page.id}
        onClick={() => {
          onClose();
          onOpenPage(page.url);
        }}
        className="p-3 rounded-[12px] bg-[#F8F9FA] border border-[#E8EAED] hover:border-[#1A73E8] transition-colors flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-gray-100 text-[#5F6368] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-[#202124] truncate">
              {page.title}
            </div>
            <div className="text-[11px] text-[#5F6368] truncate" dir="ltr">
              {page.url}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] text-[#5F6368]">
            {formatTimestamp(page.visitedAt)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBrowseItem(page.id);
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
};
