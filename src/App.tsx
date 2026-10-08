/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Home,
  Star,
  Search,
  Plus,
  X,
  Lock,
  MoreVertical,
  Settings,
  History,
  Download,
  Bookmark,
  ExternalLink,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  Film,
  Folder,
  Check,
  ChevronDown,
  Printer,
  Sparkles,
  Shield,
  Layers,
  HelpCircle,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';

import { ChromeNewTabPage, ShortcutItem } from './components/ChromeNewTabPage.tsx';
import { ChromeSERP } from './components/ChromeSERP.tsx';
import { ChromeSettingsPage } from './components/ChromeSettingsPage.tsx';
import { ChromeBookmarksPage, BookmarkEntry } from './components/ChromeBookmarksPage.tsx';
import { ComprehensiveHistoryDrawer, BrowseHistoryEntry, WatchHistoryEntry } from './components/ComprehensiveHistoryDrawer.tsx';
import { DownloadsManagerView, ManagedDownloadItem } from './components/DownloadsManagerView.tsx';

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  streamUrl: string;
  thumbnail: string;
  duration: string;
  views: string;
  date: string;
  isCachedOffline?: boolean;
  langTier?: 'ar' | 'en' | 'orig';
  langBadge?: string;
}

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  history: string[];
  historyIndex: number;
  zoomLevel: number;
}

const DEFAULT_BOOKMARKS: BookmarkEntry[] = [
  { id: 'bm_google', title: 'Google', url: 'https://www.google.com', favicon: 'https://www.google.com/favicon.ico' },
  { id: 'bm_yt', title: 'YouTube', url: 'https://www.youtube.com', favicon: 'https://www.youtube.com/favicon.ico' },
  { id: 'bm_gmail', title: 'Gmail', url: 'https://mail.google.com', favicon: 'https://mail.google.com/favicon.ico' },
  { id: 'bm_maps', title: 'خرائط Google', url: 'https://maps.google.com', favicon: 'https://maps.google.com/favicon.ico' },
  { id: 'bm_wiki', title: 'ويكيبيديا', url: 'https://ar.wikipedia.org', favicon: 'https://ar.wikipedia.org/favicon.ico' },
  { id: 'bm_opensub', title: 'OpenSubtitles', url: 'https://www.opensubtitles.org', favicon: 'https://www.opensubtitles.org/favicon.ico' },
  { id: 'bm_subdl', title: 'SubDL', url: 'https://subdl.com', favicon: 'https://subdl.com/favicon.ico' },
  { id: 'bm_elcinema', title: 'السينما.كوم', url: 'https://elcinema.com', favicon: 'https://elcinema.com/favicon.ico' },
];

export default function App() {
  // ─── إدارة التبويبات ───
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'tab_1',
      title: 'علامة تبويب جديدة',
      url: 'chrome://newtab',
      history: ['chrome://newtab'],
      historyIndex: 0,
      zoomLevel: 100,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  // ─── شريط العنوان والإدخال ───
  const [omniboxInput, setOmniboxInput] = useState('');
  const [isOmniboxFocused, setIsOmniboxFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubtitleMode, setIsSubtitleMode] = useState(false);

  // ─── إعدادات المظهر والواجهة ───
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chrome_dark_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showBookmarksBar, setShowBookmarksBar] = useState(true);
  const [isChromeMenuOpen, setIsChromeMenuOpen] = useState(false);
  const [isSiteInfoOpen, setIsSiteInfoOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isFindInPageOpen, setIsFindInPageOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');

  // ─── الإشارات والسجل والتنزيلات ───
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(() => {
    try {
      const saved = localStorage.getItem('chrome_bookmarks');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });

  const [browseHistory, setBrowseHistory] = useState<BrowseHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('chrome_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>([]);
  const [downloads, setDownloads] = useState<ManagedDownloadItem[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isDownloadsDrawerOpen, setIsDownloadsDrawerOpen] = useState(false);

  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // مزامنة حالة شريط العنوان مع الرابط النشط
  useEffect(() => {
    if (activeTab) {
      if (activeTab.url === 'chrome://newtab') {
        setOmniboxInput('');
      } else if (activeTab.url.startsWith('chrome://search?q=')) {
        const q = decodeURIComponent(activeTab.url.replace('chrome://search?q=', ''));
        setOmniboxInput(q);
      } else {
        setOmniboxInput(activeTab.url);
      }
    }
  }, [activeTab]);

  // حفظ الإشارات
  useEffect(() => {
    try {
      localStorage.setItem('chrome_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  // جلب اقتراحات بحث Google الحية عند الكتابة
  useEffect(() => {
    if (!omniboxInput.trim() || !isOmniboxFocused || omniboxInput.startsWith('http://') || omniboxInput.startsWith('https://')) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/google/suggest?q=${encodeURIComponent(omniboxInput.trim())}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            setSuggestions(data.slice(0, 6));
          }
        }
      } catch {
        // Fallback اقتراحات ذكية
        setSuggestions([
          `${omniboxInput} ترجمة عربية`,
          `${omniboxInput} فيلم مترجم`,
          `${omniboxInput} تحميل srt`,
          `${omniboxInput} على ويكيبيديا`,
        ]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [omniboxInput, isOmniboxFocused]);

  // التنقل إلى رابط أو بحث
  const navigateTo = useCallback((target: string) => {
    let clean = target.trim();
    if (!clean) return;

    let finalUrl = clean;

    // معالجة الروابط وعمليات بحث Google
    if (clean.startsWith('chrome://')) {
      finalUrl = clean;
    } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
      finalUrl = clean;
    } else if (clean.includes('.') && !clean.includes(' ') && !clean.startsWith('?')) {
      finalUrl = `https://${clean}`;
    } else {
      // بحث Google مباشر
      if (isSubtitleMode) {
        finalUrl = `chrome://search?q=${encodeURIComponent(clean + ' ترجمة عربية')}`;
      } else {
        finalUrl = `chrome://search?q=${encodeURIComponent(clean)}`;
      }
    }

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === activeTabId) {
          const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), finalUrl];
          let pageTitle = 'جاري التحميل...';
          if (finalUrl === 'chrome://newtab') pageTitle = 'علامة تبويب جديدة';
          else if (finalUrl.startsWith('chrome://search?q=')) pageTitle = `${decodeURIComponent(finalUrl.replace('chrome://search?q=', ''))} - بحث Google`;
          else if (finalUrl === 'chrome://settings') pageTitle = 'الإعدادات';
          else if (finalUrl === 'chrome://bookmarks') pageTitle = 'الإشارات المرجعية';
          else if (finalUrl === 'chrome://history') pageTitle = 'السجل';
          else if (finalUrl === 'chrome://downloads') pageTitle = 'التنزيلات';
          else {
            try { pageTitle = new URL(finalUrl).hostname; } catch { pageTitle = finalUrl; }
          }

          return {
            ...tab,
            url: finalUrl,
            title: pageTitle,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isLoading: false,
          };
        }
        return tab;
      })
    );

    // إضافة إلى سجل التصفح
    if (!finalUrl.startsWith('chrome://newtab')) {
      const entry: BrowseHistoryEntry = {
        id: `h_${Date.now()}`,
        url: finalUrl,
        title: finalUrl,
        visitedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setBrowseHistory((prev) => {
        const next = [entry, ...prev.slice(0, 99)];
        try { localStorage.setItem('chrome_history', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    setIsOmniboxFocused(false);
    setSuggestions([]);
  }, [activeTabId, isSubtitleMode]);

  // إضافة تبويب جديد
  const handleNewTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'علامة تبويب جديدة',
      url: 'chrome://newtab',
      history: ['chrome://newtab'],
      historyIndex: 0,
      zoomLevel: 100,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  // إغلاق تبويب
  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // إعادة تعيين التبويب الأخير لصفحة جديدة
      setTabs([
        {
          id: 'tab_1',
          title: 'علامة تبويب جديدة',
          url: 'chrome://newtab',
          history: ['chrome://newtab'],
          historyIndex: 0,
          zoomLevel: 100,
        },
      ]);
      setActiveTabId('tab_1');
      return;
    }

    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      const nextIndex = Math.max(0, index - 1);
      setActiveTabId(newTabs[nextIndex].id);
    }
  };

  // التنقل للخلف والأمام
  const handleGoBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const newIndex = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[newIndex];
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, url: prevUrl, historyIndex: newIndex } : t))
    );
  };

  const handleGoForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const newIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[newIndex];
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, url: nextUrl, historyIndex: newIndex } : t))
    );
  };

  const handleReload = () => {
    if (!activeTab) return;
    const current = activeTab.url;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, isLoading: true } : t))
    );
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, isLoading: false } : t))
      );
    }, 400);
  };

  // الإشارات المرجعية
  const isCurrentBookmarked = useMemo(() => {
    if (!activeTab) return false;
    return bookmarks.some((b) => b.url === activeTab.url);
  }, [bookmarks, activeTab]);

  const handleToggleBookmark = () => {
    if (!activeTab || activeTab.url === 'chrome://newtab') return;
    if (isCurrentBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
    } else {
      const newBm: BookmarkEntry = {
        id: `bm_${Date.now()}`,
        title: activeTab.title,
        url: activeTab.url,
      };
      setBookmarks((prev) => [...prev, newBm]);
      setIsBookmarkModalOpen(true);
      setTimeout(() => setIsBookmarkModalOpen(false), 2500);
    }
  };

  // التكبير والتصغير
  const handleZoom = (delta: number) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTab.id) {
          const next = Math.min(200, Math.max(50, t.zoomLevel + delta));
          return { ...t, zoomLevel: next };
        }
        return t;
      })
    );
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none ${isDarkMode ? 'dark bg-[#202124] text-[#E8EAED]' : 'bg-[#DEE1E6] text-[#202124]'}`} dir="rtl">
      {/* ═══════════════════════════════════════════════════════════════
          1. شريط التبويبات القياسي لـ Google Chrome (Chrome Tab Strip)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-end px-2 pt-2 gap-1 h-10 shrink-0 bg-[#DEE1E6] dark:bg-[#1F1F1F]">
        <div className="flex items-end gap-1 flex-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group relative flex items-center gap-2 px-3 h-8 rounded-t-lg cursor-pointer transition text-xs font-medium min-w-[140px] max-w-[220px] flex-1 ${
                  isActive
                    ? 'bg-white dark:bg-[#2B2A33] text-[#202124] dark:text-white shadow-xs'
                    : 'bg-[#DEE1E6] dark:bg-[#1F1F1F] text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#D0D4D9] dark:hover:bg-[#28272D]'
                }`}
              >
                {/* أيقونة التبويب أو مؤشر التحميل */}
                {tab.isLoading ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-[#1A73E8] shrink-0" />
                ) : (
                  <span className="shrink-0 text-sm">
                    {tab.url.startsWith('https://www.youtube') ? '▶️' : tab.url.startsWith('https://') ? '🌐' : '🔍'}
                  </span>
                )}

                {/* عنوان التبويب */}
                <span className="truncate flex-1">{tab.title}</span>

                {/* زر إغلاق التبويب */}
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/20 transition shrink-0"
                  title="إغلاق التبويب"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* زر فتح تبويب جديد (+) */}
        <button
          onClick={handleNewTab}
          className="w-7 h-7 mb-0.5 rounded-full flex items-center justify-center text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/10 dark:hover:bg-white/10 transition"
          title="علامة تبويب جديدة (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. شريط التنقل وشريط العناوين (Chrome Toolbar & Omnibox)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#2B2A33] border-b border-[#DADCE0] dark:border-[#3C4043] shrink-0 z-30">
        {/* أزرار التنقل (رجوع، تقدم، تحديث، الرئيسية) */}
        <div className="flex items-center gap-1 text-[#5F6368] dark:text-[#9AA0A6]">
          <button
            onClick={handleGoBack}
            disabled={!activeTab || activeTab.historyIndex <= 0}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleGoForward}
            disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="تقدم"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleReload}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
            title="إعادة تحميل هذه الصفحة"
          >
            <RotateCw className={`w-4 h-4 ${activeTab?.isLoading ? 'animate-spin text-[#1A73E8]' : ''}`} />
          </button>
          <button
            onClick={() => navigateTo('chrome://newtab')}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
            title="الصفحة الرئيسية لـ Chrome"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* ─── شريط العنوان القياسي لـ Chrome (Omnibox) ─── */}
        <div className="relative flex-1 max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(omniboxInput);
            }}
            className={`flex items-center h-8 px-3 rounded-full transition ${
              isOmniboxFocused
                ? 'bg-white dark:bg-[#202124] shadow-md border border-[#1A73E8]'
                : 'bg-[#F1F3F4] dark:bg-[#202124] hover:bg-[#E8EAED] dark:hover:bg-[#303134]'
            }`}
          >
            {/* قفل الأمان HTTPS أو أيقونة البحث */}
            <button
              type="button"
              onClick={() => setIsSiteInfoOpen((v) => !v)}
              className="text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1A73E8] mr-1 p-0.5"
              title="عرض معلومات الموقع"
            >
              {activeTab?.url.startsWith('https://') ? (
                <Lock className="w-3.5 h-3.5 text-[#137333]" />
              ) : (
                <Search className="w-3.5 h-3.5 text-[#5F6368]" />
              )}
            </button>

            {/* حقل الإدخال الذكي */}
            <input
              type="text"
              value={omniboxInput}
              onChange={(e) => setOmniboxInput(e.target.value)}
              onFocus={() => setIsOmniboxFocused(true)}
              onBlur={() => setTimeout(() => setIsOmniboxFocused(false), 200)}
              placeholder="ابحث في Google أو اكتب عنوان URL"
              className="flex-1 bg-transparent text-xs text-[#202124] dark:text-[#E8EAED] focus:outline-none px-2 direction-ltr text-right"
            />

            {/* زر تفعيل وضع الترجمة الذكية المباشرة */}
            <button
              type="button"
              onClick={() => setIsSubtitleMode((v) => !v)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition ml-1 flex items-center gap-1 ${
                isSubtitleMode
                  ? 'bg-[#1A73E8] text-white shadow-2xs'
                  : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title="تفعيل فلترة الترجمة العربية التلقائية"
            >
              <span>🇸🇦</span>
              <span className="hidden sm:inline">ترجمة عربية</span>
            </button>

            {/* زر الإشارات المرجعية (النجمة ⭐) */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition ${
                isCurrentBookmarked ? 'text-[#1A73E8]' : 'text-[#5F6368] dark:text-[#9AA0A6]'
              }`}
              title="إضافة هذه علامة التبويب إلى الإشارات"
            >
              <Star className={`w-3.5 h-3.5 ${isCurrentBookmarked ? 'fill-[#1A73E8]' : ''}`} />
            </button>
          </form>

          {/* قائمة الاقتراحات المنسدلة الحية لـ Google */}
          {isOmniboxFocused && suggestions.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white dark:bg-[#202124] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] overflow-hidden z-50 divide-y divide-gray-100 dark:divide-gray-800">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => navigateTo(s)}
                  className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-[#F1F3F4] dark:hover:bg-[#303134] cursor-pointer transition text-[#202124] dark:text-[#E8EAED]"
                >
                  <Search className="w-3.5 h-3.5 text-[#5F6368] shrink-0" />
                  <span className="flex-1 truncate">{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الإجراءات على الجانب الأيسر (الحساب وقائمة Chrome) */}
        <div className="flex items-center gap-1 text-[#5F6368] dark:text-[#9AA0A6]">
          {/* دائرة حساب Google */}
          <div
            onClick={() => navigateTo('chrome://settings')}
            className="w-7 h-7 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:shadow-xs transition"
            title="حساب Google"
          >
            A
          </div>

          {/* زر قائمة كروم الرئيسية (⋮) */}
          <button
            onClick={() => setIsChromeMenuOpen((v) => !v)}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
            title="تخصيص Google Chrome والتحكم فيه"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. شريط الإشارات المرجعية (Chrome Bookmarks Bar)
      ═══════════════════════════════════════════════════════════════ */}
      {showBookmarksBar && (
        <div className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-[#2B2A33] border-b border-[#DADCE0] dark:border-[#3C4043] text-xs shrink-0 overflow-x-auto no-scrollbar">
          {bookmarks.slice(0, 10).map((bm) => (
            <div
              key={bm.id}
              onClick={() => navigateTo(bm.url)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] cursor-pointer text-[#5F6368] dark:text-[#E8EAED] shrink-0 transition"
            >
              <Globe className="w-3 h-3 text-[#1A73E8]" />
              <span className="truncate max-w-[120px]">{bm.title}</span>
            </div>
          ))}

          <div
            onClick={() => navigateTo('chrome://bookmarks')}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] cursor-pointer text-[#1A73E8] mr-auto font-medium shrink-0"
          >
            <Folder className="w-3 h-3" />
            <span>جميع الإشارات</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          4. المحتوى الرئيسي لعلامة التبويب النشطة
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#202124]">
        {/* صفحة علامة التبويب الجديدة (Google New Tab) */}
        {activeTab?.url === 'chrome://newtab' && (
          <ChromeNewTabPage
            onSearch={(query) => navigateTo(query)}
            onNavigate={(url) => navigateTo(url)}
          />
        )}

        {/* صفحة نتائج بحث Google (Google SERP) */}
        {activeTab?.url.startsWith('chrome://search?q=') && (
          <div className="h-full overflow-y-auto">
            <ChromeSERP
              query={decodeURIComponent(activeTab.url.replace('chrome://search?q=', ''))}
              onSearch={(q) => navigateTo(q)}
              onNavigate={(url) => navigateTo(url)}
              onPlayVideo={(v) => {
                // فتح في تبويب جديد أو مشغل
                navigateTo(v.streamUrl);
              }}
              targetLanguage="ar"
              t={(s) => s}
            />
          </div>
        )}

        {/* صفحة الإعدادات (chrome://settings) */}
        {activeTab?.url === 'chrome://settings' && (
          <ChromeSettingsPage
            onNavigate={(url) => navigateTo(url)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => {
              setIsDarkMode((prev) => {
                const next = !prev;
                try { localStorage.setItem('chrome_dark_mode', String(next)); } catch {}
                return next;
              });
            }}
            showBookmarksBar={showBookmarksBar}
            onToggleBookmarksBar={() => setShowBookmarksBar((v) => !v)}
          />
        )}

        {/* صفحة الإشارات (chrome://bookmarks) */}
        {activeTab?.url === 'chrome://bookmarks' && (
          <ChromeBookmarksPage
            bookmarks={bookmarks}
            onNavigate={(url) => navigateTo(url)}
            onRemoveBookmark={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
            onAddBookmark={(title, url) => {
              setBookmarks((prev) => [...prev, { id: `bm_${Date.now()}`, title, url }]);
            }}
          />
        )}

        {/* صفحة السجل (chrome://history) */}
        {activeTab?.url === 'chrome://history' && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-[#DADCE0] dark:border-[#3C4043] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-[#1A73E8]" />
                <h1 className="text-xl font-bold">سجل التصفح</h1>
              </div>
              <button
                onClick={() => {
                  setBrowseHistory([]);
                  try { localStorage.removeItem('chrome_history'); } catch {}
                }}
                className="px-3 py-1.5 bg-[#EA4335] text-white text-xs font-medium rounded-md hover:bg-[#D93025] transition"
              >
                محو بيانات التصفح
              </button>
            </div>
            <div className="space-y-2">
              {browseHistory.length === 0 ? (
                <p className="text-sm text-[#70757A] text-center py-12">لا توجد صفحات في سجل التصفح حالياً.</p>
              ) : (
                browseHistory.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => navigateTo(h.url)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F1F3F4] dark:hover:bg-[#303134] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs text-[#70757A] shrink-0">{h.visitedAt}</span>
                      <span className="text-sm font-medium text-[#1A73E8] truncate">{h.title}</span>
                    </div>
                    <span className="text-xs text-[#70757A] truncate max-w-xs direction-ltr text-right">{h.url}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* صفحة التنزيلات (chrome://downloads) */}
        {activeTab?.url === 'chrome://downloads' && (
          <DownloadsManagerView
            downloads={downloads}
            onClose={() => navigateTo('chrome://newtab')}
            onOpenItem={(d: ManagedDownloadItem) => navigateTo(d.downloadUrl)}
            onDeleteRecord={(id: string) => setDownloads((prev) => prev.filter((d) => d.id !== id))}
            onClearAllRecords={() => setDownloads([])}
            onPauseDownload={(id: string) => {
              setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'paused' } : d)));
            }}
            onResumeDownload={(id: string) => {
              setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'downloading' } : d)));
            }}
            onCancelDownload={(id: string) => {
              setDownloads((prev) => prev.filter((d) => d.id !== id));
            }}
            onStartNewDownload={(url: string, filename?: string) => {
              const newD: ManagedDownloadItem = {
                id: `dl_${Date.now()}`,
                title: filename || url,
                filename: filename || 'download',
                url,
                downloadUrl: url,
                fileSize: 15 * 1024 * 1024,
                fileType: 'other',
                status: 'completed',
                progress: 100,
                downloadedAt: new Date().toLocaleDateString('ar-EG'),
              };
              setDownloads((prev) => [newD, ...prev]);
            }}
            darkMode={isDarkMode}
          />
        )}

        {/* عرض صفحات الويب الحقيقية (WebView iframe) */}
        {!activeTab?.url.startsWith('chrome://') && (
          <div className="w-full h-full relative">
            <iframe
              src={activeTab?.url}
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              title={activeTab?.title}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          5. قائمة Chrome الرئيسية المنسدلة (Chrome Menu)
      ═══════════════════════════════════════════════════════════════ */}
      {isChromeMenuOpen && (
        <div
          onClick={() => setIsChromeMenuOpen(false)}
          className="fixed inset-0 z-50 bg-transparent"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-12 left-4 w-64 bg-white dark:bg-[#292A2D] rounded-xl shadow-2xl border border-[#DADCE0] dark:border-[#3C4043] py-2 text-xs font-medium text-[#202124] dark:text-[#E8EAED] z-50 divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div className="py-1">
              <button
                onClick={() => {
                  handleNewTab();
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <span>علامة تبويب جديدة</span>
                <span className="text-gray-400">Ctrl+T</span>
              </button>
              <button
                onClick={() => {
                  handleNewTab();
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <span>نافذة جديدة</span>
                <span className="text-gray-400">Ctrl+N</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  navigateTo('chrome://history');
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[#5F6368]" />
                  <span>السجل</span>
                </div>
                <span className="text-gray-400">Ctrl+H</span>
              </button>
              <button
                onClick={() => {
                  navigateTo('chrome://downloads');
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-[#5F6368]" />
                  <span>قائمة التنزيلات</span>
                </div>
                <span className="text-gray-400">Ctrl+J</span>
              </button>
              <button
                onClick={() => {
                  navigateTo('chrome://bookmarks');
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-[#5F6368]" />
                  <span>الإشارات المرجعية</span>
                </div>
              </button>
            </div>

            {/* أدوات التكبير */}
            <div className="py-2 px-4 flex items-center justify-between">
              <span>التكبير/التصغير</span>
              <div className="flex items-center gap-2 bg-[#F1F3F4] dark:bg-[#3C4043] rounded-full px-2 py-0.5">
                <button onClick={() => handleZoom(-10)} className="hover:text-[#1A73E8]">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px]">{activeTab?.zoomLevel || 100}%</span>
                <button onClick={() => handleZoom(10)} className="hover:text-[#1A73E8]">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  navigateTo('chrome://settings');
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <Settings className="w-3.5 h-3.5 text-[#5F6368]" />
                <span>الإعدادات</span>
              </button>
              <button
                onClick={() => {
                  window.open('https://support.google.com/chrome', '_blank');
                  setIsChromeMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] text-right"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#5F6368]" />
                <span>مساعدة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد حفظ الإشارة */}
      {isBookmarkModalOpen && (
        <div className="fixed bottom-6 right-6 bg-[#202124] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs z-50 animate-bounce">
          <Check className="w-4 h-4 text-[#34A853]" />
          <span>تمت إضافة الصفحة إلى الإشارات المرجعية بنجاح</span>
        </div>
      )}
    </div>
  );
}
