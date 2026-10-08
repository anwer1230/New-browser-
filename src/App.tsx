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
  BookOpen,
  Volume2,
  Film,
  Sparkles,
  Share2,
  CheckCircle2,
  Layers,
  Clock,
  Compass,
} from 'lucide-react';

interface TabItem {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  loading: boolean;
  pageData?: {
    title: string;
    content_ar: string;
    raw_snippet?: string;
    extracted_links?: Array<{ title: string; url: string }>;
    web_results?: any[];
    discovered_videos?: any[];
  } | null;
}

interface SavedBookmark {
  url: string;
  title: string;
  date: string;
}

export default function App() {
  // ═══ إدارة التبويبات المستقلة الحقيقية (Independent Tabs) ═══
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      id: 'tab_1',
      title: 'Google',
      url: 'https://www.google.com',
      history: ['https://www.google.com'],
      historyIndex: 0,
      loading: false,
      pageData: null,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReaderMode, setIsReaderMode] = useState<boolean>(false);
  const [isLiveFrameMode, setIsLiveFrameMode] = useState<boolean>(false);

  // أدراج المحفوظات والسجل
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>(() => {
    try {
      const raw = localStorage.getItem('anwer_bookmarks');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [browseHistory, setBrowseHistory] = useState<SavedBookmark[]>(() => {
    try {
      const raw = localStorage.getItem('anwer_history');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // مزامنة حقل العنوان مع التبويب النشط
  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTab.url, activeTabId]);

  // حفظ العلامات في التخزين المحلي
  useEffect(() => {
    try {
      localStorage.setItem('anwer_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('anwer_history', JSON.stringify(browseHistory));
    } catch {}
  }, [browseHistory]);

  const quickLinks = [
    { name: 'ويكيبيديا', url: 'https://ar.wikipedia.org', icon: '📚' },
    { name: 'أخبار التقنية', url: 'https://news.ycombinator.com', icon: '💻' },
    { name: 'BBC عربي', url: 'https://www.bbc.com/arabic', icon: '🌍' },
    { name: 'يوتيوب', url: 'https://www.youtube.com', icon: '▶️' },
    { name: 'الطقس اليوم', url: 'https://www.google.com/search?q=طقس+اليوم', icon: '☀️' },
    { name: 'Google بحث', url: 'https://www.google.com', icon: '🔍' },
    { name: 'ترجمة فورية', url: 'https://translate.google.com', icon: '🌐' },
    { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  ];

  // ═══ إضافة تبويب جديد مستقل ═══
  const createNewTab = (initialUrl: string = 'https://www.google.com') => {
    const newId = `tab_${Date.now()}`;
    const newTab: TabItem = {
      id: newId,
      title: initialUrl.includes('google.com') ? 'Google' : 'تبويب جديد',
      url: initialUrl,
      history: [initialUrl],
      historyIndex: 0,
      loading: false,
      pageData: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(initialUrl);
    if (initialUrl !== 'https://www.google.com') {
      fetchDirectPageForTab(newId, initialUrl);
    }
  };

  // ═══ إغلاق تبويب ═══
  const closeTab = (idToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) {
      // إذا كان التبويب الأخير، نعيده إلى الرئيسية
      setTabs([
        {
          id: `tab_${Date.now()}`,
          title: 'Google',
          url: 'https://www.google.com',
          history: ['https://www.google.com'],
          historyIndex: 0,
          loading: false,
          pageData: null,
        },
      ]);
      return;
    }
    const filtered = tabs.filter((t) => t.id !== idToClose);
    setTabs(filtered);
    if (activeTabId === idToClose) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  // ═══ جلب محتوى الموقع مباشرة في التبويب ═══
  const fetchDirectPageForTab = async (tabId: string, targetUrl: string) => {
    if (targetUrl === 'https://www.google.com' || targetUrl === 'https://google.com') {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, loading: false, pageData: null } : t))
      );
      return;
    }

    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, loading: true } : t))
    );

    // إضافة إلى سجل التصفح
    setBrowseHistory((prev) => [
      { url: targetUrl, title: targetUrl, date: new Date().toLocaleTimeString('ar-SA') },
      ...prev.filter((h) => h.url !== targetUrl).slice(0, 49),
    ]);

    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: targetUrl, translateToArabic: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  loading: false,
                  title: data.title || targetUrl,
                  pageData: data,
                }
              : t
          )
        );
      } else {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  loading: false,
                  pageData: {
                    title: targetUrl,
                    content_ar: `محتوى الموقع متاح للتصفح المباشر: ${targetUrl}`,
                    extracted_links: [],
                  },
                }
              : t
          )
        );
      }
    } catch {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? {
                ...t,
                loading: false,
                pageData: {
                  title: targetUrl,
                  content_ar: `محتوى الموقع متاح للتصفح المباشر: ${targetUrl}`,
                  extracted_links: [],
                },
              }
            : t
        )
      );
    }
  };

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

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const nextHistory = [...t.history.slice(0, t.historyIndex + 1), clean];
        return {
          ...t,
          url: clean,
          title: clean.includes('google.com') ? 'Google' : clean,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          loading: true,
        };
      })
    );

    fetchDirectPageForTab(activeTabId, clean);
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
      fetchDirectPageForTab(activeTabId, prevUrl);
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
      fetchDirectPageForTab(activeTabId, nextUrl);
    }
  };

  const handleRefresh = () => {
    fetchDirectPageForTab(activeTabId, activeTab.url);
    showToast('جاري تحديث الصفحة...');
  };

  const handleHome = () => {
    navigateCurrentTab('https://www.google.com');
  };

  const handleToggleBookmark = () => {
    const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
      showToast('تمت إزالة الموقع من المحفوظات');
    } else {
      setBookmarks((prev) => [
        {
          url: activeTab.url,
          title: activeTab.title || activeTab.url,
          date: new Date().toLocaleDateString('ar-SA'),
        },
        ...prev,
      ]);
      showToast('تم حفظ الصفحة في المحفوظات بنجاح 💾');
    }
  };

  const handlePlayTts = (text: string) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
      showToast('🔊 جاري القراءة الصوتية...');
    }
  };

  const isCurrentBookmarked = bookmarks.some((b) => b.url === activeTab.url);
  const isGoogleHome =
    activeTab.url === 'https://www.google.com' ||
    activeTab.url === 'https://google.com' ||
    !activeTab.url;

  return (
    <div
      className="h-[100dvh] w-full flex flex-col bg-[#F8F9FA] dark:bg-[#1E1F22] text-[#202124] dark:text-[#E8EAED] overflow-hidden select-none"
      dir="rtl"
      style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. شريط التبويبات المستقلة الحقيقية مثل Google Chrome
      ═══════════════════════════════════════════════════════════════ */}
      <div className="h-[42px] bg-[#E8EAED] dark:bg-[#2B2D30] border-b border-[#DADCE0] dark:border-[#1E1F22] flex items-center px-2 gap-1 overflow-x-auto shrink-0 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group h-[34px] max-w-[200px] min-w-[120px] px-3 rounded-t-lg flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer transition select-none ${
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
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
          title="فتح تبويب جديد"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. شريط العناوين والتنقل الموحّد الفردي
      ═══════════════════════════════════════════════════════════════ */}
      <header className="h-[54px] bg-white dark:bg-[#1E1F22] border-b border-[#E8EAED] dark:border-[#2B2D30] px-3 flex items-center gap-2 shrink-0 shadow-2xs z-20">
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
            <RotateCw className={`w-4 h-4 ${activeTab.loading ? 'animate-spin text-blue-600' : ''}`} />
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
          className="flex-1 h-[38px] px-3 rounded-full border border-[#DADCE0] dark:border-[#3C4043] focus-within:border-[#1A73E8] focus-within:shadow-xs bg-white dark:bg-[#2B2D30] flex items-center gap-2 transition"
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
            className="h-6 px-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer shrink-0 transition"
          >
            <span>انتقال</span>
            <ArrowLeft className="w-3 h-3" />
          </button>
        </form>

        {/* إجراءات سريعة */}
        <div className="flex items-center gap-1 shrink-0">
          {/* حفظ في المحفوظات */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-2 rounded-full transition cursor-pointer ${
              isCurrentBookmarked
                ? 'text-[#1A73E8] fill-current bg-blue-50 dark:bg-blue-950/40'
                : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="حفظ في المحفوظات"
          >
            <Bookmark className="w-4 h-4" fill={isCurrentBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* استماع صوتي للمقال */}
          {activeTab.pageData?.content_ar && (
            <button
              type="button"
              onClick={() => handlePlayTts(activeTab.pageData?.content_ar || '')}
              className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
              title="قراءة صوتية لمحتوى الصفحة"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
            </button>
          )}

          {/* تبديل وضع القراءة */}
          <button
            type="button"
            onClick={() => setIsReaderMode((prev) => !prev)}
            className={`p-2 rounded-full transition cursor-pointer ${
              isReaderMode
                ? 'bg-blue-600 text-white'
                : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="وضع القراءة المركز"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* تبديل عرض الويب التفاعلي المباشر */}
          {!isGoogleHome && (
            <button
              type="button"
              onClick={() => setIsLiveFrameMode((prev) => !prev)}
              className={`p-2 rounded-full transition cursor-pointer ${
                isLiveFrameMode
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={isLiveFrameMode ? 'العودة إلى المحرك المباشر' : 'تفعيل إطار الويب الحي'}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {/* فتح في تبويب خارجي مستقل للمواقع المقيدة */}
          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
            title="فتح في نافذة متصفح مستقلة ↗"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* مؤشر شريط التحميل */}
      {activeTab.loading && (
        <div className="h-0.5 w-full bg-blue-100 overflow-hidden shrink-0">
          <div className="h-full bg-blue-600 animate-pulse w-2/3" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. مساحة التصفح المباشر الحقيقية (Real Direct Browsing Area)
          لا وجود لأي رسائل تأكيد أو بطاقات إيقاف! التصفح مفتوح ومباشر دائماً!
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-auto bg-white dark:bg-[#1E1F22] relative">
        {isGoogleHome ? (
          /* ═══ الصفحة الرئيسية المباشرة Google / AnwerBrowser ═══ */
          <div className="w-full h-full min-h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1E1F22]">
            <div className="w-full max-w-xl flex flex-col items-center text-center -mt-10">
              <div className="text-5xl font-extrabold tracking-tight mb-6 select-none dir-ltr">
                <span className="text-[#4285F4]">A</span>
                <span className="text-[#EA4335]">n</span>
                <span className="text-[#FBBC05]">w</span>
                <span className="text-[#4285F4]">e</span>
                <span className="text-[#34A853]">r</span>
                <span className="text-[#EA4335]">B</span>
                <span className="text-[#4285F4]">r</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#34A853]">w</span>
                <span className="text-[#EA4335]">s</span>
                <span className="text-[#4285F4]">e</span>
                <span className="text-[#34A853]">r</span>
              </div>

              {/* مربع البحث التفاعلي في Google */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigateCurrentTab(
                      `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`
                    );
                  }
                }}
                className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-gray-700 shadow-xs focus-within:shadow-md focus-within:border-blue-500 flex items-center gap-3 bg-white dark:bg-[#2B2D30] transition mb-6"
              >
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في Google أو اكتب عنوان موقع ويب..."
                  className="flex-1 bg-transparent text-sm text-[#202124] dark:text-[#E8EAED] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition"
                >
                  بحث
                </button>
              </form>

              {/* بطاقات الاختصارات السريعة */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-lg mb-8">
                {quickLinks.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => navigateCurrentTab(item.url)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 flex items-center justify-center text-xl shadow-xs transition">
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>متصفح مباشر وتبويبات مستقلة حقيقية: المواقع تفتح دائماً بكامل محتواها.</span>
              </div>
            </div>
          </div>
        ) : isLiveFrameMode ? (
          /* ═══ وضع إطار الويب الحي المباشر (Live Proxy Frame) ═══ */
          <iframe
            key={`${activeTab.id}_${activeTab.url}`}
            title={activeTab.title || 'AnwerBrowser Live View'}
            src={`/api/web-proxy?url=${encodeURIComponent(activeTab.url)}&in_browser_frame=1`}
            className="w-full h-full border-0 bg-white dark:bg-[#1E1F22]"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads allow-pointer-lock"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          />
        ) : (
          /* ═══ التصفح المباشر الكامل التفاعلي (Direct In-App Webpage) ═══ */
          <div className="w-full h-full overflow-y-auto bg-[#F8F9FA] dark:bg-[#1E1F22] p-4 sm:p-6">
            <div className={`max-w-4xl mx-auto space-y-5 ${isReaderMode ? 'max-w-2xl' : ''}`}>
              {/* شريط معلومات الموقع وأدوات التنقل */}
              {!isReaderMode && (
                <div className="bg-white dark:bg-[#2B2D30] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                        {activeTab.pageData?.title || activeTab.title || activeTab.url}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono dir-ltr">{activeTab.url}</span>
                        <span className="text-emerald-600 font-semibold">• تصفح مباشر 🟢</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLiveFrameMode(true)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>عرض الإطار الحي</span>
                    </button>
                    <a
                      href={activeTab.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-xs"
                    >
                      <span>فتح مباشر ↗</span>
                    </a>
                  </div>
                </div>
              )}

              {/* اكتشاف الفيديوهات وتشغيلها المباشر */}
              {Array.isArray(activeTab.pageData?.discovered_videos) &&
                activeTab.pageData.discovered_videos.length > 0 && (
                  <div className="bg-white dark:bg-[#2B2D30] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <Film className="w-4 h-4 text-rose-500" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        فيديوهات تم اكتشافها في الصفحة:
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeTab.pageData.discovered_videos.slice(0, 2).map((vid: any) => (
                        <div
                          key={vid.id}
                          className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black"
                        >
                          {vid.stream_url ? (
                            <video
                              src={vid.stream_url}
                              poster={vid.thumbnail}
                              controls
                              className="w-full h-44 object-cover"
                            />
                          ) : null}
                          <div className="p-2.5 bg-white dark:bg-[#2B2D30]">
                            <p className="text-xs font-bold line-clamp-1">{vid.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* نص ومحتوى الموقع المترجم والمنسق */}
              <div className="bg-white dark:bg-[#2B2D30] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      محتوى الصفحة المقروء والمترجم:
                    </h3>
                  </div>
                  {activeTab.pageData?.content_ar && (
                    <button
                      type="button"
                      onClick={() => handlePlayTts(activeTab.pageData?.content_ar || '')}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>قراءة صوتية</span>
                    </button>
                  )}
                </div>

                <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line space-y-3 font-sans">
                  {activeTab.pageData?.content_ar ||
                    activeTab.pageData?.raw_snippet ||
                    `جاري عرض محتوى الموقع: ${activeTab.url}`}
                </div>
              </div>

              {/* الروابط التفاعلية التابعة للموقع (اضغط للانتقال المباشر في التبويب) */}
              {Array.isArray(activeTab.pageData?.extracted_links) &&
                activeTab.pageData.extracted_links.length > 0 && (
                  <div className="bg-white dark:bg-[#2B2D30] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        صفحات ومقالات تابعة للموقع (اضغط للتنقل المباشر):
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {activeTab.pageData.extracted_links.map((link: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => navigateCurrentTab(link.url)}
                          className="p-3 rounded-xl border border-gray-200 dark:border-gray-700/60 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-right transition cursor-pointer flex flex-col justify-between"
                        >
                          <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">
                            {link.title}
                          </span>
                          <span className="text-[10px] text-blue-600 font-mono truncate dir-ltr text-left">
                            {link.url}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          4. الشريط السفلي الموحّد للمتصفح
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="h-[52px] bg-[#F8F9FA] dark:bg-[#1E1F22] border-t border-[#E8EAED] dark:border-[#2B2D30] flex items-center justify-evenly shrink-0 z-20">
        <button
          type="button"
          onClick={handleBack}
          disabled={activeTab.historyIndex <= 0}
          className="p-3 text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 rounded-full cursor-pointer transition"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleForward}
          disabled={activeTab.historyIndex >= activeTab.history.length - 1}
          className="p-3 text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 rounded-full cursor-pointer transition"
          title="تقدم"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleHome}
          className="p-3 text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 rounded-full cursor-pointer transition"
          title="الرئيسية (Google)"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setIsBookmarksOpen(true)}
          className="p-3 text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 rounded-full cursor-pointer transition relative"
          title="المحفوظات"
        >
          <Bookmark className="w-5 h-5" />
          {bookmarks.length > 0 && (
            <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setIsHistoryOpen(true)}
          className="p-3 text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 rounded-full cursor-pointer transition"
          title="سجل التصفح"
        >
          <History className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => createNewTab('https://www.google.com')}
          className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition shadow-xs flex items-center gap-1 px-3 text-xs font-bold"
          title="تبويب جديد"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">تبويب جديد</span>
        </button>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════
          5. درج المحفوظات (Bookmarks Drawer)
      ═══════════════════════════════════════════════════════════════ */}
      {isBookmarksOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
          onClick={() => setIsBookmarksOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">المحفوظات ({bookmarks.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookmarksOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {bookmarks.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">لا توجد مواقع محفوظة بعد</div>
              ) : (
                bookmarks.map((b, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      navigateCurrentTab(b.url);
                      setIsBookmarksOpen(false);
                    }}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold truncate">{b.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate dir-ltr text-left">
                        {b.url}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookmarks((prev) => prev.filter((item) => item.url !== b.url));
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. درج سجل التصفح (History Drawer)
      ═══════════════════════════════════════════════════════════════ */}
      {isHistoryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">سجل التصفح ({browseHistory.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {browseHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">السجل فارغ</div>
              ) : (
                browseHistory.map((h, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      navigateCurrentTab(h.url);
                      setIsHistoryOpen(false);
                    }}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold truncate">{h.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate dir-ltr text-left">
                        {h.url}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400">{h.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Snackbar الإشعار السريع */}
      {toastMsg && (
        <div className="fixed bottom-16 right-4 left-4 sm:left-auto sm:right-6 z-50 pointer-events-none flex justify-center">
          <div className="px-4 py-2.5 rounded-xl bg-[#202124] text-white text-xs shadow-lg flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
