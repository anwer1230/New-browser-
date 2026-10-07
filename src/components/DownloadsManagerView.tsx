import React, { useState, useMemo } from 'react';
import {
  Download,
  Trash2,
  Play,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Pause,
  RotateCw,
  X,
  Search,
  ExternalLink,
  Plus,
  ArrowRight,
  HardDrive,
  AlertCircle,
  FileDown,
  Sparkles,
} from 'lucide-react';

export type DownloadFileType = 'video' | 'document' | 'audio' | 'image' | 'page' | 'other';

export interface ManagedDownloadItem {
  id: string;
  title: string;
  filename: string;
  url: string;
  downloadUrl: string;
  fileSize: number; // in bytes
  fileType: DownloadFileType;
  status: 'downloading' | 'completed' | 'paused' | 'failed';
  progress: number; // 0 to 100
  downloadSpeed?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  remainingSeconds?: number;
  downloadedAt: string;
  poster?: string;
}

interface DownloadsManagerViewProps {
  downloads: ManagedDownloadItem[];
  onDeleteRecord: (id: string) => void;
  onClearAllRecords: () => void;
  onPauseDownload: (id: string) => void;
  onResumeDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onStartNewDownload: (url: string, filename?: string) => void;
  onOpenItem: (item: ManagedDownloadItem) => void;
  onClose: () => void;
  darkMode?: boolean;
}

export const DownloadsManagerView: React.FC<DownloadsManagerViewProps> = ({
  downloads,
  onDeleteRecord,
  onClearAllRecords,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onStartNewDownload,
  onOpenItem,
  onClose,
  darkMode = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'video' | 'document' | 'page'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newDownloadUrl, setNewDownloadUrl] = useState<string>('');
  const [newDownloadFilename, setNewDownloadFilename] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Separate active downloads and completed downloads
  const activeDownloads = useMemo(
    () => downloads.filter((d) => d.status === 'downloading' || d.status === 'paused'),
    [downloads]
  );

  const completedDownloads = useMemo(
    () => downloads.filter((d) => d.status === 'completed' || d.status === 'failed'),
    [downloads]
  );

  // Filtered lists based on search & category tab
  const filteredCompleted = useMemo(() => {
    return completedDownloads.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'video') return item.fileType === 'video';
      if (activeFilter === 'document') return item.fileType === 'document';
      if (activeFilter === 'page') return item.fileType === 'page';
      return true;
    });
  }, [completedDownloads, searchQuery, activeFilter]);

  // Compute total downloaded size
  const totalDownloadedBytes = useMemo(() => {
    return downloads
      .filter((d) => d.status === 'completed')
      .reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  }, [downloads]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (type: DownloadFileType) => {
    switch (type) {
      case 'video':
        return <Film className="w-5 h-5 text-rose-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'page':
        return <FileDown className="w-5 h-5 text-indigo-500" />;
      case 'document':
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleCreateDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = newDownloadUrl.trim();
    if (!url) return;
    onStartNewDownload(url, newDownloadFilename.trim() || undefined);
    setNewDownloadUrl('');
    setNewDownloadFilename('');
    setIsAddModalOpen(false);
  };

  return (
    <div
      className={`h-full w-full flex flex-col select-none ${
        darkMode ? 'bg-[#202124] text-[#E8EAED]' : 'bg-[#F8F9FA] text-[#202124]'
      }`}
      dir="rtl"
    >
      {/* ─── Top Header (Browser Style) ─── */}
      <header
        className={`px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
          darkMode ? 'bg-[#292A2D] border-[#3C4043]' : 'bg-white border-[#E8EAED]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="العودة للمتصفح"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">مدير التنزيلات</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                إدارة ومتابعة كافة الملفات والفيديوهات المحملة بالجهاز
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Start New Download Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            title="تنزيل من رابط مباشر"
          >
            <Plus className="w-4 h-4" />
            <span>تنزيل رابط جديد</span>
          </button>

          {/* Clear All Records Button */}
          {completedDownloads.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition cursor-pointer"
              title="حذف جميع سجلات التنزيل"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجلات</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Search & Category Filter Toolbar ─── */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          darkMode ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'
        }`}
      >
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            الكل ({downloads.length})
          </button>

          {activeDownloads.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'active'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>جاري التحميل ({activeDownloads.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveFilter('video')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            فيديوهات
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('document')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'document'
                ? 'bg-blue-600 text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            مستندات وملفات
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('page')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeFilter === 'page'
                ? 'bg-blue-600 text-white'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
            }`}
          >
            صفحات ومقالات
          </button>
        </div>

        {/* Search Input & Storage Badge */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`flex-1 sm:w-64 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              darkMode ? 'bg-[#202124] border-[#5F6368]' : 'bg-[#F1F3F4] border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث في الملفات والتنزيلات..."
              className="bg-transparent focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500 font-medium whitespace-nowrap">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            <span>الحجم: {formatBytes(totalDownloadedBytes)}</span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Area (Scrollable) ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* ═══════════════════════════════════════════════════════════
            القسم الأول: التحميلات الحالية (Active Downloads)
        ═══════════════════════════════════════════════════════════ */}
        {activeDownloads.length > 0 && activeFilter !== 'page' && activeFilter !== 'document' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>التحميلات الحالية النشطة ({activeDownloads.length})</span>
              </h2>
              <span className="text-xs text-gray-400">تحديث فوري للسرعة والنسبة</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activeDownloads.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border shadow-sm transition ${
                    darkMode
                      ? 'bg-[#292A2D] border-[#3C4043]'
                      : 'bg-white border-[#E8EAED]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 shrink-0">
                        {getFileIcon(item.fileType)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate">{item.title}</h3>
                        <p className="text-xs text-gray-400 truncate dir-ltr text-right">
                          {item.filename}
                        </p>
                      </div>
                    </div>

                    {/* Active Controls: Pause / Resume / Cancel */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === 'downloading' ? (
                        <button
                          type="button"
                          onClick={() => onPauseDownload(item.id)}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 cursor-pointer"
                          title="إيقاف مؤقت"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onResumeDownload(item.id)}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-emerald-600 cursor-pointer"
                          title="استئناف التنزيل"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onCancelDownload(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 cursor-pointer"
                        title="إلغاء التنزيل"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2 overflow-hidden my-2.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === 'paused'
                          ? 'bg-gray-400'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.max(4, item.progress)}%` }}
                    />
                  </div>

                  {/* Progress Metrics: Speed, Size, Time Remaining */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-3">
                      <span>{item.progress}% مكتمل</span>
                      {item.downloadSpeed && item.status === 'downloading' && (
                        <span>• {item.downloadSpeed}</span>
                      )}
                      {item.status === 'paused' && (
                        <span className="text-amber-500 font-bold">• متوقف مؤقتاً</span>
                      )}
                    </div>
                    <div>
                      {item.downloadedBytes && item.totalBytes ? (
                        <span>
                          {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
                        </span>
                      ) : (
                        <span>{formatBytes(item.fileSize)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            القسم الثاني: الملفات المحملة مسبقاً (Completed Downloads)
        ═══════════════════════════════════════════════════════════ */}
        {activeFilter !== 'active' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>الملفات التي تم تحميلها مسبقاً ({filteredCompleted.length})</span>
              </h2>
              {filteredCompleted.length > 0 && (
                <span className="text-xs text-gray-400">انقر للتشغيل أو الحفظ</span>
              )}
            </div>

            {filteredCompleted.length === 0 ? (
              <div
                className={`py-16 px-4 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3 ${
                  darkMode ? 'border-[#3C4043] bg-[#242528]' : 'border-[#DADCE0] bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-base font-bold mb-1">لا توجد ملفات مكتملة حالياً</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    يمكنك تنزيل مقاطع الفيديو والصفحات والمستندات بنقرة واحدة أثناء تصفحك للمواقع
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تنزيل رابط الآن</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCompleted.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition group hover:shadow-md flex flex-col justify-between ${
                      darkMode
                        ? 'bg-[#292A2D] border-[#3C4043] hover:border-[#5F6368]'
                        : 'bg-white border-[#E8EAED] hover:border-[#1A73E8]/40'
                    }`}
                  >
                    <div>
                      {/* Thumbnail or Icon + Info */}
                      <div className="flex items-start gap-3 mb-3">
                        {item.poster ? (
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-black shrink-0 relative group">
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 shrink-0">
                            {getFileIcon(item.fileType)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3
                            onClick={() => onOpenItem(item)}
                            className="text-sm font-bold truncate cursor-pointer hover:text-blue-500 transition"
                            title={item.title}
                          >
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-400 truncate dir-ltr text-right">
                            {item.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                            <span>{formatBytes(item.fileSize)}</span>
                            <span>•</span>
                            <span>
                              {new Date(item.downloadedAt).toLocaleDateString('ar-SA', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>تشغيل / فتح</span>
                        </button>

                        <a
                          href={item.downloadUrl || item.url}
                          download={item.filename}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold transition cursor-pointer"
                          title="حفظ الملف مجدداً بالجهاز"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">حفظ</span>
                        </a>
                      </div>

                      {/* Delete Record Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="حذف هذا السجل من القائمة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ─── Modal: Add New Download by URL ─── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 ${
              darkMode ? 'bg-[#292A2D] text-[#E8EAED]' : 'bg-white text-[#202124]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 font-bold text-base">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>بدء تنزيل رابط جديد</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDownloadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  رابط الملف أو الفيديو (URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/video.mp4 أو أي رابط"
                  value={newDownloadUrl}
                  onChange={(e) => setNewDownloadUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    darkMode
                      ? 'bg-[#202124] border-[#5F6368] focus:border-blue-400'
                      : 'bg-white border-[#DADCE0] focus:border-blue-600'
                  }`}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  اسم الملف اختياري (Filename)
                </label>
                <input
                  type="text"
                  placeholder="مثال: my_video.mp4"
                  value={newDownloadFilename}
                  onChange={(e) => setNewDownloadFilename(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none ${
                    darkMode
                      ? 'bg-[#202124] border-[#5F6368] focus:border-blue-400'
                      : 'bg-white border-[#DADCE0] focus:border-blue-600'
                  }`}
                />
              </div>

              {/* Sample Quick Preset Links */}
              <div className="pt-2">
                <span className="block text-[11px] text-gray-400 mb-1.5 font-medium">
                  أو اختر تجربة عينة تنزيل سريعة:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewDownloadUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
                      setNewDownloadFilename('TearsOfSteel_HD.mp4');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                  >
                    🎬 وثائقي Tears of Steel (MP4)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDownloadUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
                      setNewDownloadFilename('Flower_Nature.mp4');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[11px] font-bold hover:bg-emerald-100 transition cursor-pointer"
                  >
                    🌸 فيديو طبيعة Flower (MP4)
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  بدء التنزيل الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Confirm Clear All Records ─── */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-3.5 ${
              darkMode ? 'bg-[#292A2D] text-[#E8EAED]' : 'bg-white text-[#202124]'
            }`}
          >
            <div className="flex items-center gap-2.5 text-red-600 font-bold text-base">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>تأكيد مسح كافة سجلات التنزيل</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              هل أنت متأكد من مسح جميع سجلات التنزيل؟ لن يتم حذف الملفات المحفوظة فعلياً في مجلد
              التنزيلات بجهازك، وإنما سيتم تنظيف قائمة السجلات داخل المتصفح.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllRecords();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                نعم، مسح السجلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
