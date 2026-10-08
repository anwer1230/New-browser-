/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Shield,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Home,
  Bookmark,
  History,
  ExternalLink,
  Plus,
  X,
  Search,
} from 'lucide-react';

interface TabItem {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
}

export default function App() {
  // ═══ تبويبات مستقلة حقيقية مثل Google Chrome ═══
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      id: 'tab_1',
      title: 'Google',
      url: 'https://www.google.com',
      history: ['https://www.google.com'],
      historyIndex: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
  const [loading, setLoading] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; url: string }>>(() => {
    try {
      const raw = localStorage.getItem('anwer_bookmarks');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // مزامنة شريط العنوان مع التبويب النشط
  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTab.url, activeTabId]);

  // حفظ العلامات
  useEffect(() => {
    try {
      localStorage.setItem('anwer_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  // الاستماع للروابط التي ينقر عليها المستخدم داخل الصفحة للتنقل المباشر وتحديث العنوان
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'HYBRID_BROWSER_NAVIGATE' && typeof data.url === 'string') {
        navigateCurrentTab(data.url);
      } else if (data.type === 'HYBRID_BROWSER_PAGE_META' && data.title) {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId ? { ...t, title: String(data.title) } : t
          )
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId]);

  // ═══ التنقل المباشر في التبويب الحالي ═══
  const navigateCurrentTab = (targetInput: string) => {
    let clean = targetInput.trim();
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        clean = `https://${clean}`;
      } else {
        clean = `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
      }
    }

    setUrlInput(clean);
    setLoading(true);

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const nextHistory = [...t.history.slice(0, t.historyIndex + 1), clean];
        const pageTitle = clean.includes('google.com/search')
          ? 'نتائج البحث'
          : clean.includes('google.com')
          ? 'Google'
          : clean.replace(/^https?:\/\//, '').split('/')[0];

        return {
          ...t,
          url: clean,
          title: pageTitle,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
        };
      })
    );
  };

  // ═══ إضافة تبويب جديد مستقل ═══
  const createNewTab = (initialUrl: string = 'https://www.google.com') => {
    const newId = `tab_${Date.now()}`;
    const newTab: TabItem = {
      id: newId,
      title: initialUrl.includes('google.com') ? 'Google' : 'تبويب جديد',
      url: initialUrl,
      history: [initialUrl],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(initialUrl);
    setLoading(true);
  };

  // ═══ إغلاق تبويب ═══
  const closeTab = (idToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) {
      // إذا كان التبويب الوحيد، نعيد توجيهه إلى Google
      navigateCurrentTab('https://www.google.com');
      return;
    }
    const filtered = tabs.filter((t) => t.id !== idToClose);
    setTabs(filtered);
    if (activeTabId === idToClose) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevUrl = activeTab.history[activeTab.historyIndex - 1];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: prevUrl,
                historyIndex: t.historyIndex - 1,
              }
            : t
        )
      );
      setUrlInput(prevUrl);
      setLoading(true);
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextUrl = activeTab.history[activeTab.historyIndex + 1];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: nextUrl,
                historyIndex: t.historyIndex + 1,
              }
            : t
        )
      );
      setUrlInput(nextUrl);
      setLoading(true);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = `/api/web-proxy?url=${encodeURIComponent(activeTab.url)}&in_browser_frame=1&t=${Date.now()}`;
    }
  };

  const handleHome = () => {
    navigateCurrentTab('https://www.google.com');
  };

  const handleToggleBookmark = () => {
    const exists = bookmarks.some((b) => b.url === activeTab.url);
    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
    } else {
      setBookmarks((prev) => [
        ...prev,
        { title: activeTab.title || activeTab.url, url: activeTab.url },
      ]);
    }
  };

  const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);

  // قاطع التكرار الذاتي: حماية ضد التضمين المتداخل داخل iframe المتصفح
  const isInsideBrowserViewport =
    typeof window !== 'undefined' &&
    (window.name === 'anwer_browser_web_frame' ||
      window.location.search.includes('in_browser_frame=1') ||
      (window.self !== window.top &&
        (window.location.pathname.startsWith('/api/') ||
          window.location.search.includes('url='))));

  if (isInsideBrowserViewport) {
    return (
      <div
        className="w-full h-full min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-white dark:bg-[#202124] text-center text-[#202124] dark:text-white"
        dir="rtl"
        style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
      >
        <div className="w-10 h-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-semibold">جاري تحميل الصفحة في المتصفح...</p>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] w-full flex flex-col bg-[#F8F9FA] dark:bg-[#1E1F22] text-[#202124] dark:text-[#E8EAED] overflow-hidden select-none"
      dir="rtl"
      style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. شريط التبويبات المستقلة الحقيقية مثل Google Chrome
      ═══════════════════════════════════════════════════════════════ */}
      <div className="h-[40px] bg-[#E8EAED] dark:bg-[#2B2D30] border-b border-[#DADCE0] dark:border-[#1E1F22] flex items-end px-2 gap-1 overflow-x-auto shrink-0 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group h-[32px] max-w-[220px] min-w-[120px] px-3 rounded-t-lg flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer transition select-none ${
                isActive
                  ? 'bg-white dark:bg-[#1E1F22] text-[#1A73E8] dark:text-[#8AB4F8] shadow-xs'
                  : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#1A73E8]' : 'text-gray-400'}`} />
                <span className="truncate">{tab.title || 'صفحة ويب'}</span>
              </div>
              <button
                type="button"
                onClick={(e) => closeTab(tab.id, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition shrink-0"
                title="إغلاق التبويب"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* زر إضافة تبويب مستقل جديد (+) */}
        <button
          type="button"
          onClick={() => createNewTab('https://www.google.com')}
          className="w-7 h-7 mb-1 rounded-full flex items-center justify-center text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
          title="فتح تبويب جديد"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. شريط العناوين والتنقل الموحّد الفردي
      ═══════════════════════════════════════════════════════════════ */}
      <header className="h-[52px] bg-white dark:bg-[#1E1F22] border-b border-[#E8EAED] dark:border-[#2B2D30] px-3 flex items-center gap-2 shrink-0 shadow-2xs z-20">
        {/* أزرار التنقل الأساسية */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeTab.historyIndex <= 0}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
            title="رجوع للخلف"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
            title="تقدم للأمام"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
            title="إعادة تحميل"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleHome}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
            title="الصفحة الرئيسية (Google)"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* شريط العنوان الحقيقي Omnibox */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateCurrentTab(urlInput);
          }}
          className="flex-1 h-[38px] px-3 rounded-full border border-[#DADCE0] dark:border-[#3C4043] focus-within:border-[#1A73E8] focus-within:shadow-xs bg-[#F1F3F4] dark:bg-[#2B2D30] focus-within:bg-white dark:focus-within:bg-[#2B2D30] flex items-center gap-2 transition"
        >
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="ابحث في Google أو اكتب عنوان موقع ويب"
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#202124] dark:text-[#E8EAED] focus:outline-none dir-ltr text-left font-mono truncate"
          />
          <button
            type="submit"
            className="h-6 px-3 rounded-full bg-[#1A73E8] hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer shrink-0 transition"
          >
            <span>انتقال</span>
            <ArrowLeft className="w-3 h-3" />
          </button>
        </form>

        {/* إجراءات سريعة */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-2 rounded-full transition cursor-pointer ${
              isBookmarked
                ? 'text-[#1A73E8] fill-current bg-blue-50 dark:bg-blue-950/40'
                : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="حفظ في المحفوظات"
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
            title="فتح في نافذة مستقلة ↗"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* مؤشر شريط التحميل */}
      {loading && (
        <div className="h-0.5 w-full bg-blue-100 overflow-hidden shrink-0">
          <div className="h-full bg-blue-600 animate-pulse w-3/4" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. مساحة عرض الموقع مباشرة داخل المتصفح (100% Direct Browsing)
          يتم عرض الصفحة الحية أو نتائج البحث مباشرة داخل التبويب بالضبط كما في كروم
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full h-full relative bg-white dark:bg-[#1E1F22] overflow-hidden">
        <iframe
          ref={iframeRef}
          key={`${activeTab.id}_${activeTab.url}`}
          name="anwer_browser_web_frame"
          title={activeTab.title || 'AnwerBrowser'}
          src={`/api/web-proxy?url=${encodeURIComponent(activeTab.url)}&in_browser_frame=1`}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads allow-pointer-lock"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </main>
    </div>
  );
}
