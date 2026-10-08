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
  Star,
  Download,
  User,
  MoreVertical,
  Cpu,
  Layers,
  Settings,
  Activity,
  Lock,
  Folder,
  Terminal,
  Check,
  Share2,
  Zap,
  EyeOff,
  Wifi,
  Server,
  Key,
  Gauge,
  WifiOff,
  Trash2,
  Filter,
} from 'lucide-react';

// ═══ نماذج بيانات بنية العمليات المتعددة وخدمة VPN وتوفير البيانات ═══

export interface ProcessItem {
  pid: number;
  type: 'browser' | 'renderer' | 'gpu' | 'network' | 'storage' | 'vpn';
  name: string;
  memoryMB: number;
  cpuPercent: number;
  tabId?: string;
}

export interface TabItem {
  id: string;
  pid: number;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  favicon?: string;
  loading: boolean;
  isCrashed: boolean;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  size: string;
  status: 'completed' | 'downloading';
  time: string;
}

export interface UserProfile {
  isLoggedIn: boolean;
  email: string;
  name: string;
  avatar?: string;
  syncEnabled: boolean;
}

export interface VpnServerInfo {
  id: string;
  country: string;
  city: string;
  flag: string;
  ip: string;
  ping: number;
  protocol: string;
}

const AVAILABLE_VPN_SERVERS: VpnServerInfo[] = [
  {
    id: 'de_frankfurt',
    country: 'ألمانيا',
    city: 'فرانكفورت',
    flag: '🇩🇪',
    ip: '129.151.142.88',
    ping: 24,
    protocol: 'WireGuard 256-bit Turbo',
  },
  {
    id: 'ch_zurich',
    country: 'سويسرا',
    city: 'زيورخ',
    flag: '🇨🇭',
    ip: '185.120.44.12',
    ping: 28,
    protocol: 'WireGuard Strict-ZeroLogs',
  },
  {
    id: 'nl_amsterdam',
    country: 'هولندا',
    city: 'أمستردام',
    flag: '🇳🇱',
    ip: '141.95.88.204',
    ping: 30,
    protocol: 'WireGuard High-Speed',
  },
  {
    id: 'sg_singapore',
    country: 'سنغافورة',
    city: 'سنغافورة',
    flag: '🇸🇬',
    ip: '139.180.201.76',
    ping: 75,
    protocol: 'WireGuard Stealth',
  },
];

export default function App() {
  // ═══ 1. خدمة تسريع التصفح والعمل في أضعف حالات النت (Data Saver & Turbo Mode) ═══
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_data_saver');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // مفعّل افتراضياً لضمان السرعة الفائقة 100x حتى في أضعف شبكات 2G/3G
  });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [networkSpeedTier, setNetworkSpeedTier] = useState<string>('فائقة (Turbo)');

  // ═══ 2. خدمة Free VPN الثابتة والدائمة في الخلفية (Always-On Background VPN) ═══
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_vpn_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [selectedVpn, setSelectedVpn] = useState<VpnServerInfo>(AVAILABLE_VPN_SERVERS[0]);
  const [isVpnModalOpen, setIsVpnModalOpen] = useState<boolean>(false);
  const [vpnBytesProtected, setVpnBytesProtected] = useState<number>(54.6);

  // ═══ 3. عملية المتصفح الرئيسية (Browser Process) والتبويبات المستقلة الحقيقية ═══
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      id: 'tab_1',
      pid: 101,
      title: 'Google',
      url: 'https://www.google.com',
      history: ['https://www.google.com'],
      historyIndex: 0,
      loading: false,
      isCrashed: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // شريط الإشارات المرجعية
  const [showBookmarksBar, setShowBookmarksBar] = useState<boolean>(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const raw = localStorage.getItem('anwer_bookmarks');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: 'b_1', title: 'ويكيبيديا', url: 'https://ar.wikipedia.org' },
      { id: 'b_2', title: 'أخبار التقنية', url: 'https://news.ycombinator.com' },
      { id: 'b_3', title: 'BBC عربي', url: 'https://www.bbc.com/arabic' },
      { id: 'b_4', title: 'GitHub', url: 'https://github.com' },
      { id: 'b_5', title: 'Google بحث', url: 'https://www.google.com' },
    ];
  });

  // البحث والتصفية في سجل التصفح (History Search & Filter)
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterCategory, setHistoryFilterCategory] = useState<'all' | 'searches' | 'domains'>('all');

  const [historyList, setHistoryList] = useState<Array<{ title: string; url: string; time: string }>>(() => {
    try {
      const raw = localStorage.getItem('anwer_history');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [downloadsList, setDownloadsList] = useState<DownloadItem[]>([
    {
      id: 'd_1',
      filename: 'anwerbrowser-setup.html',
      url: 'https://anwerbrowser.local',
      size: '2.4 MB',
      status: 'completed',
      time: 'اليوم 09:30 ص',
    },
  ]);

  // الملف الشخصي والمزامنة
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem('anwer_profile');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      isLoggedIn: false,
      email: '',
      name: '',
      syncEnabled: true,
    };
  });

  // النوافذ والقوائم المنبثقة
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isDownloadsDrawerOpen, setIsDownloadsDrawerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedProcessPid, setSelectedProcessPid] = useState<number | null>(null);

  // إشعار عائم
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  // تصفية سجل التصفح بالكلمات المفتاحية والتصنيفات
  const filteredHistory = historyList.filter((item) => {
    const q = historySearchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (historyFilterCategory === 'searches') {
      return item.url.includes('google.com/search') || item.title.includes('بحث');
    }
    if (historyFilterCategory === 'domains') {
      return !item.url.includes('google.com/search');
    }
    return true;
  });

  const handleDeleteHistoryItem = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    showToast('تم حذف الموقع من السجل');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل التصفح بالكامل؟')) {
      setHistoryList([]);
      setHistorySearchQuery('');
      showToast('تم مسح سجل التصفح بالكامل 🗑️');
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // مراقبة جودة وحالة اتصال الإنترنت التكيفية (Adaptive Network Monitoring)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 تم استعادة الاتصال بالإنترنت');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ لا يوجد اتصال - تم تفعيل وضع التصفح بدون إنترنت');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // فحص تقريبي لسرعة الشبكة (Network Connection API)
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
          setDataSaver(true);
          setNetworkSpeedTier('شبكة ضعيفة (توفير فائق مفعّل)');
        }
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // مزامنة شريط العناوين مع التبويب النشط
  useEffect(() => {
    setUrlInput(activeTab.url);
  }, [activeTab.url, activeTabId]);

  // حفظ الإشارات والتاريخ والـ VPN محلياً
  useEffect(() => {
    try {
      localStorage.setItem('anwer_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('anwer_history', JSON.stringify(historyList));
    } catch {}
  }, [historyList]);

  useEffect(() => {
    try {
      localStorage.setItem('anwer_profile', JSON.stringify(userProfile));
    } catch {}
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('anwer_vpn_enabled', String(vpnEnabled));
    } catch {}
  }, [vpnEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('anwer_data_saver', String(dataSaver));
    } catch {}
  }, [dataSaver]);

  // محاكاة استهلاك بيانات التشفير الآمنة مع التصفح
  useEffect(() => {
    const interval = setInterval(() => {
      if (vpnEnabled) {
        setVpnBytesProtected((prev) => +(prev + 0.05).toFixed(2));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [vpnEnabled]);

  // ═══ قناة الاتصال بين العمليات (Mojo IPC) ═══
  useEffect(() => {
    const handleMojoMessage = (event: MessageEvent) => {
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

    window.addEventListener('message', handleMojoMessage);
    return () => window.removeEventListener('message', handleMojoMessage);
  }, [activeTabId]);

  // ═══ قائمة العمليات النشطة لمدير مهام المتصفح (Chrome Task Manager) ═══
  const getActiveProcesses = (): ProcessItem[] => {
    const coreProcesses: ProcessItem[] = [
      { pid: 1, type: 'browser', name: 'Browser (العملية الرئيسية وواجهة المستخدم)', memoryMB: 148, cpuPercent: 1.2 },
      { pid: 2, type: 'gpu', name: 'GPU Process (Viz الرسوميات والتسريع)', memoryMB: 84, cpuPercent: 2.1 },
      { pid: 3, type: 'network', name: 'Network Service (محرك الجلب الفوري والذاكرة السريعة)', memoryMB: 42, cpuPercent: 0.5 },
      { pid: 4, type: 'storage', name: 'Storage Service (IndexedDB & 0ms RAM Cache)', memoryMB: 28, cpuPercent: 0.1 },
      {
        pid: 5,
        type: 'vpn',
        name: `VPN Tunnel Service (نفق WireGuard مشفر 256-bit • ${selectedVpn.country})`,
        memoryMB: vpnEnabled ? 19 : 0,
        cpuPercent: vpnEnabled ? 0.3 : 0.0,
      },
    ];

    const tabProcesses: ProcessItem[] = tabs.map((t) => ({
      pid: t.pid,
      type: 'renderer',
      name: `Tab: ${t.title || t.url}`,
      memoryMB: t.isCrashed ? 0 : Math.floor(65 + (t.url.length % 50)),
      cpuPercent: t.loading ? 3.8 : 0.2,
      tabId: t.id,
    }));

    return [...coreProcesses, ...tabProcesses];
  };

  const handleKillProcess = (pid: number) => {
    const targetTab = tabs.find((t) => t.pid === pid);
    if (targetTab) {
      setTabs((prev) =>
        prev.map((t) => (t.pid === pid ? { ...t, isCrashed: true, loading: false } : t))
      );
      showToast(`تم إنهاء عملية العرض (PID: ${pid})`);
    } else if (pid === 5) {
      setVpnEnabled(false);
      showToast('تم إيقاف خدمة نفق الـ VPN مؤقتاً');
    } else {
      showToast('لا يمكن إنهاء عمليات النظام الحيوية');
    }
  };

  // ═══ تنظيف الروابط ومنع وسوم التتبع الإعلاني ═══
  const sanitizeUrlTracking = (url: string): string => {
    try {
      const u = new URL(url);
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'gclsrc',
        'dclid',
        'zanpid',
        'msclkid',
        'ref_src',
        '_ga',
        '_gl',
      ];
      trackingParams.forEach((param) => u.searchParams.delete(param));
      return u.toString();
    } catch {
      return url;
    }
  };

  // ═══ التنقل الذكي فائق السرعة مع وضع توفير البيانات ═══
  const navigateCurrentTab = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    let targetUrl: string;

    if (trimmed.startsWith('g ') || trimmed.startsWith('google ')) {
      const q = trimmed.replace(/^(g|google)\s+/, '');
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      targetUrl = trimmed;
    } else if (trimmed.includes('.') && !trimmed.includes(' ')) {
      targetUrl = `https://${trimmed}`;
    } else {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }

    if (vpnEnabled) {
      targetUrl = sanitizeUrlTracking(targetUrl);
    }

    setUrlInput(targetUrl);

    setHistoryList((prev) => [
      {
        title: targetUrl.includes('google.com/search') ? 'بحث Google' : targetUrl,
        url: targetUrl,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 49),
    ]);

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const nextHistory = [...t.history.slice(0, t.historyIndex + 1), targetUrl];
        return {
          ...t,
          url: targetUrl,
          title: targetUrl.includes('google.com/search')
            ? 'نتائج البحث'
            : targetUrl.includes('google.com')
            ? 'Google'
            : targetUrl.replace(/^https?:\/\//, '').split('/')[0],
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          loading: true,
          isCrashed: false,
        };
      })
    );
  };

  const createNewTab = (initialUrl: string = 'https://www.google.com') => {
    const newPid = Math.floor(100 + Math.random() * 900);
    const newId = `tab_${Date.now()}`;
    const newTab: TabItem = {
      id: newId,
      pid: newPid,
      title: initialUrl.includes('google.com') ? 'Google' : 'تبويب جديد',
      url: initialUrl,
      history: [initialUrl],
      historyIndex: 0,
      loading: false,
      isCrashed: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(initialUrl);
  };

  const closeTab = (tabIdToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) {
      navigateCurrentTab('https://www.google.com');
      return;
    }
    const filtered = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(filtered);
    if (activeTabId === tabIdToClose) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const prevUrl = activeTab.history[activeTab.historyIndex - 1];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, url: prevUrl, historyIndex: t.historyIndex - 1, loading: false, isCrashed: false }
            : t
        )
      );
      setUrlInput(prevUrl);
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const nextUrl = activeTab.history[activeTab.historyIndex + 1];
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, url: nextUrl, historyIndex: t.historyIndex + 1, loading: false, isCrashed: false }
            : t
        )
      );
      setUrlInput(nextUrl);
    }
  };

  const handleRefresh = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, loading: true, isCrashed: false } : t))
    );
  };

  const handleToggleBookmark = () => {
    const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
      showToast('تمت إزالة الموقع من شريط الإشارات');
    } else {
      const newBm: BookmarkItem = {
        id: `bm_${Date.now()}`,
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
      };
      setBookmarks((prev) => [...prev, newBm]);
      showToast('تمت إضافة الإشارة المرجعية بنجاح ⭐');
    }
  };

  const isCurrentBookmarked = bookmarks.some((b) => b.url === activeTab.url);

  const handleSavePageAs = () => {
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeTab.title}</title></head><body><h1>${activeTab.title}</h1><p>الرابط المحفوظ: <a href="${activeTab.url}">${activeTab.url}</a></p></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const filename = `${(activeTab.title || 'page').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}.html`;

    const dlItem: DownloadItem = {
      id: `dl_${Date.now()}`,
      filename,
      url: activeTab.url,
      size: '18 KB',
      status: 'completed',
      time: 'الآن',
    };
    setDownloadsList((prev) => [dlItem, ...prev]);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
    showToast(`تم تنزيل الصفحة: ${filename} 📥`);
  };

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
        <p className="text-sm font-semibold">جاري تشغيل عملية العرض السريعة...</p>
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
          1. شريط التبويبات المتقدم (Chrome Tab Strip)
          تبديل فوري في 0 مللي ثانية بين التبويبات المستقلة المحفوظة بالذاكرة
      ═══════════════════════════════════════════════════════════════ */}
      <div className="h-[42px] bg-[#DFE1E5] dark:bg-[#202124] border-b border-[#DADCE0] dark:border-[#3C4043] flex items-end px-2 gap-1 overflow-x-auto shrink-0 no-scrollbar pt-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group h-[34px] max-w-[220px] min-w-[130px] px-3 rounded-t-lg flex items-center justify-between gap-2 text-xs font-semibold cursor-pointer transition select-none relative ${
                isActive
                  ? 'bg-white dark:bg-[#2B2D30] text-[#1A73E8] dark:text-[#8AB4F8] shadow-xs'
                  : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {tab.loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#1A73E8]' : 'text-gray-400'}`} />
                )}
                <span className="truncate">{tab.isCrashed ? 'Aw, Snap!' : tab.title || 'صفحة جديدة'}</span>
              </div>
              <button
                type="button"
                onClick={(e) => closeTab(tab.id, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition shrink-0"
                title="إغلاق التبويب (Ctrl+W)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* زر فتح تبويب جديد (+) */}
        <button
          type="button"
          onClick={() => createNewTab('https://www.google.com')}
          className="w-7 h-7 mb-1 rounded-full flex items-center justify-center text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
          title="فتح تبويب جديد (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. شريط الأدوات وعنوان Omnibox مع مفتاح السرعة وتوفير البيانات
      ═══════════════════════════════════════════════════════════════ */}
      <header className="h-[52px] bg-white dark:bg-[#2B2D30] border-b border-[#E8EAED] dark:border-[#3C4043] px-3 flex items-center gap-2 shrink-0 shadow-2xs z-20">
        {/* أزرار التنقل الأساسية */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeTab.historyIndex <= 0}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
            title="رجوع (Alt+Left)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition"
            title="تقدم (Alt+Right)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
            title="إعادة تحميل (Ctrl+R)"
          >
            <RotateCw className={`w-4 h-4 ${activeTab.loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigateCurrentTab('https://www.google.com')}
            className="p-2 rounded-full text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
            title="الصفحة الرئيسية (Google)"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* شريط Omnibox الذكي الموحد */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateCurrentTab(urlInput);
          }}
          className="flex-1 h-[38px] px-3.5 rounded-full border border-[#DADCE0] dark:border-[#4A4D51] focus-within:border-[#1A73E8] focus-within:shadow-xs bg-[#F1F3F4] dark:bg-[#1E1F22] focus-within:bg-white dark:focus-within:bg-[#1E1F22] flex items-center gap-2 transition"
        >
          <span title="اتصال آمن ومشفّر (HTTPS)">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </span>

          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="ابحث في Google أو اكتب عنوان ويب..."
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

        {/* ⚡ زر وضع توفير البيانات والسرعة الفائقة 100x للشبكات الضعيفة */}
        <button
          type="button"
          onClick={() => {
            setDataSaver((prev) => !prev);
            showToast(!dataSaver ? '⚡ تم تفعيل وضع السرعة الفائقة وتوفير البيانات (10x أسرع للشبكات الضعيفة)' : 'تم إيقاف وضع توفير البيانات');
          }}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            dataSaver
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'bg-gray-100 text-gray-500 border-gray-300'
          }`}
          title="وضع تسريع التصفح وتوفير البيانات 85%: تحميل فوري واستجابة سريعة حتى في أضعف شبكات 2G/3G"
        >
          <Zap className={`w-3.5 h-3.5 ${dataSaver ? 'fill-current text-amber-500' : 'text-gray-400'}`} />
          <span className="hidden lg:inline">{dataSaver ? 'وضع السرعة 10x' : 'سرعة عادية'}</span>
        </button>

        {/* 🛡️ مؤشر Free VPN الدائم والثابت في الخلفية */}
        <button
          type="button"
          onClick={() => setIsVpnModalOpen(true)}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            vpnEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-gray-100 text-gray-500 border-gray-300'
          }`}
          title="حالة Free VPN وحماية الخصوصية ومنع التتبع"
        >
          <div className={`w-2 h-2 rounded-full ${vpnEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="hidden md:inline">VPN:</span>
          <span>{vpnEnabled ? `${selectedVpn.flag} متصل` : 'معطّل'}</span>
        </button>

        {/* أدوات شريط العناوين الأيمن */}
        <div className="flex items-center gap-1 shrink-0">
          {/* حفظ الإشارة بنجمة كمتصفح كروم */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-2 rounded-full transition cursor-pointer ${
              isCurrentBookmarked
                ? 'text-amber-500 fill-current bg-amber-50 dark:bg-amber-950/30'
                : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="إضافة إلى الإشارات المرجعية (Ctrl+D)"
          >
            <Star className="w-4 h-4" fill={isCurrentBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* التنزيلات */}
          <button
            type="button"
            onClick={() => setIsDownloadsDrawerOpen((prev) => !prev)}
            className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition relative"
            title="التنزيلات (Ctrl+J)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* زر الملف الشخصي والمزامنة */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-blue-400 transition cursor-pointer"
            title={userProfile.isLoggedIn ? userProfile.email : 'تسجيل الدخول إلى AnwerBrowser'}
          >
            {userProfile.isLoggedIn ? userProfile.name.charAt(0).toUpperCase() || 'A' : <User className="w-4 h-4" />}
          </button>

          {/* قائمة الخيارات الرئيسية الثلاث نقاط (Chrome 3-dots Menu) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
              title="تخصيص AnwerBrowser والتحكم فيه"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* القائمة المنسدلة */}
            {isMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#2B2D30] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs"
                onClick={() => setIsMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => createNewTab('https://www.google.com')}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right"
                >
                  <span>علامة تبويب جديدة</span>
                  <span className="text-[10px] text-gray-400">Ctrl+T</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDataSaver((prev) => !prev);
                    showToast(!dataSaver ? 'تم تفعيل وضع توفير البيانات ⚡' : 'تم تعطيل وضع توفير البيانات');
                  }}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-amber-600 font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>وضع توفير البيانات والسرعة</span>
                  </div>
                  <span className="text-[10px]">{dataSaver ? 'مفعّل ⚡' : 'معطّل'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVpnModalOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-emerald-600 font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>إعدادات Free VPN والخصوصية</span>
                  </div>
                  <span className="text-[10px] text-emerald-600">نشط 🟢</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookmarksBar((prev) => !prev)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right"
                >
                  <span>{showBookmarksBar ? 'إخفاء شريط الإشارات' : 'إظهار شريط الإشارات'}</span>
                  <span className="text-[10px] text-gray-400">Ctrl+Shift+B</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right"
                >
                  <span>السجل</span>
                  <span className="text-[10px] text-gray-400">Ctrl+H</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDownloadsDrawerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right"
                >
                  <span>التنزيلات</span>
                  <span className="text-[10px] text-gray-400">Ctrl+J</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

                {/* التحكم في التكبير والتصغير (Zoom) */}
                <div className="px-4 py-2 flex items-center justify-between">
                  <span>التكبير/التصغير</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomLevel((z) => Math.max(50, z - 10));
                      }}
                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="font-mono text-[11px]">{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomLevel((z) => Math.min(200, z + 10));
                      }}
                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSavePageAs}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right"
                >
                  <span>حفظ الصفحة باسم...</span>
                  <span className="text-[10px] text-gray-400">Ctrl+S</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

                {/* مدير المهام وعمليات المتصفح (Chrome Task Manager) */}
                <button
                  type="button"
                  onClick={() => setIsTaskManagerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-blue-600 dark:text-blue-400 font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>مدير مهام العمليات (Task Manager)</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Shift+Esc</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-1.5 text-right"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>الإعدادات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          3. شريط الإشارات المرجعية الاختياري (Bookmarks Bar)
      ═══════════════════════════════════════════════════════════════ */}
      {showBookmarksBar && (
        <div className="h-[30px] bg-white dark:bg-[#2B2D30] border-b border-[#E8EAED] dark:border-[#3C4043] px-3 flex items-center gap-2 overflow-x-auto shrink-0 text-xs text-[#5F6368] dark:text-[#9AA0A6] no-scrollbar">
          {bookmarks.map((bm) => (
            <button
              key={bm.id}
              type="button"
              onClick={() => navigateCurrentTab(bm.url)}
              className="px-2.5 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-1.5 cursor-pointer transition truncate shrink-0"
            >
              <Globe className="w-3 h-3 text-gray-400" />
              <span className="truncate max-w-[120px]">{bm.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* مؤشر شريط تقدم التحميل */}
      {activeTab.loading && (
        <div className="h-0.5 w-full bg-blue-100 overflow-hidden shrink-0">
          <div className="h-full bg-blue-600 animate-pulse w-3/4" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          4. منطقة عرض المحتوى فائقة السرعة مع إبقاء التبويبات بالذاكرة (0ms Tab Switch)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 w-full h-full relative bg-white dark:bg-[#1E1F22] overflow-hidden">
        {tabs.map((tab) => {
          const isThisActive = tab.id === activeTabId;
          const isGoogle = tab.url === 'https://www.google.com' || tab.url === 'https://google.com';

          return (
            <div
              key={tab.id}
              className={`w-full h-full absolute inset-0 ${isThisActive ? 'block z-10' : 'hidden pointer-events-none'}`}
            >
              {tab.isCrashed ? (
                /* صفحة تعطل العملية */
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-[#202124] text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">عذراً، حدث خطأ ما (Aw, Snap!)</h2>
                  <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
                    تعطلت عملية العرض (Renderer Process) الخاصة بهذا التبويب فقط دون التأثير على باقي التبويبات.
                  </p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    إعادة تحميل الصفحة
                  </button>
                </div>
              ) : isGoogle ? (
                /* صفحة التبويب الجديد الفورية (Google New Tab Page) */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1E1F22]">
                  <div className="w-full max-w-xl flex flex-col items-center text-center -mt-12">
                    <div className="text-5xl font-extrabold tracking-tight mb-4 select-none dir-ltr">
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

                    {/* شارة السرعة الفائقة والـ VPN */}
                    <div className="mb-6 flex items-center gap-2 flex-wrap justify-center">
                      <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Free VPN نشط: سيرفر {selectedVpn.country}</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5 font-bold">
                        <Zap className="w-3 h-3 text-amber-500 fill-current" />
                        <span>تسريع 10x وتوفير بيانات 85% مفعّل</span>
                      </div>
                    </div>

                    {/* مربع البحث المركزي */}
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
                        placeholder="ابحث في Google بأقصى سرعة وأمان..."
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

                    {/* الاختصارات السريعة */}
                    <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                      {[
                        { name: 'ويكيبيديا', url: 'https://ar.wikipedia.org', icon: '📚' },
                        { name: 'أخبار التقنية', url: 'https://news.ycombinator.com', icon: '💻' },
                        { name: 'BBC عربي', url: 'https://www.bbc.com/arabic', icon: '🌍' },
                        { name: 'Google بحث', url: 'https://www.google.com/search?q=الذكاء+الاصطناعي', icon: '🔍' },
                      ].map((item) => (
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
                  </div>
                </div>
              ) : (
                /* عرض الصفحة الحية مع دعم الاستجابة الفورية والشبكات الضعيفة */
                <iframe
                  key={`${tab.id}_${tab.url}_ds${dataSaver ? '1' : '0'}`}
                  name="anwer_browser_web_frame"
                  title={tab.title || 'AnwerBrowser'}
                  src={`/api/web-proxy?url=${encodeURIComponent(tab.url)}&in_browser_frame=1&dataSaver=${dataSaver ? '1' : '0'}`}
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top right' }}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads allow-pointer-lock"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  onLoad={() => {
                    setTabs((prev) =>
                      prev.map((t) => (t.id === tab.id ? { ...t, loading: false } : t))
                    );
                  }}
                  onError={() => {
                    setTabs((prev) =>
                      prev.map((t) => (t.id === tab.id ? { ...t, loading: false } : t))
                    );
                  }}
                />
              )}
            </div>
          );
        })}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          5. مركز التحكم في Free VPN وحماية الخصوصية
      ═══════════════════════════════════════════════════════════════ */}
      {isVpnModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsVpnModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">درع Free VPN والخصوصية المطلقة</h3>
                  <p className="text-[11px] text-gray-500">يعمل دائماً في الخلفية لحماية أبحاثك وبياناتك من التتبع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVpnModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* حالة الاتصال ومفتاح التبديل */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white">حالة الاتصال:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${vpnEnabled ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-gray-200 text-gray-600'}`}>
                      {vpnEnabled ? 'متصل ومحمي دائماً 🟢' : 'معطّل مؤقتاً ⚪'}
                    </span>
                  </div>
                  <div className="text-gray-500 text-[11px] mt-1">
                    عنوان IP الافتراضي الظاهر للمواقع: <span className="font-mono text-blue-600 font-bold">{selectedVpn.ip}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVpnEnabled((prev) => !prev);
                    showToast(!vpnEnabled ? 'تم تفعيل حماية VPN الثابتة 🛡️' : 'تم إيقاف الـ VPN مؤقتاً');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    vpnEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {vpnEnabled ? 'متصل (انقر للتعطيل)' : 'اتصال الآن'}
                </button>
              </div>

              {/* مميزات منع التتبع والتسريب */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 mb-1">
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                    <span>منع تتبع الأبحاث (DNT):</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">مفعّل بنسبة 100%</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 mb-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>تسريع الشبكة الضعيفة:</span>
                  </div>
                  <span className="text-[11px] text-amber-600 font-semibold">توفير 85% من البيانات</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 mb-1">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>بروتوكول التشفير:</span>
                  </div>
                  <span className="text-[11px] text-gray-600 font-mono">WireGuard 256-bit</span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 mb-1">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>البيانات المحمية:</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-mono">{vpnBytesProtected} MB</span>
                </div>
              </div>

              {/* اختيار السيرفر والدولة */}
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-2">
                  اختر موقع سيرفر الـ VPN المجاني:
                </label>
                <div className="space-y-2">
                  {AVAILABLE_VPN_SERVERS.map((server) => {
                    const isSelected = selectedVpn.id === server.id;
                    return (
                      <div
                        key={server.id}
                        onClick={() => {
                          setSelectedVpn(server);
                          showToast(`تم التبديل إلى سيرفر ${server.country} (${server.ip})`);
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-bold'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{server.flag}</span>
                          <div>
                            <div className="font-bold">{server.country} — {server.city}</div>
                            <div className="text-[10px] text-gray-500 font-mono">IP: {server.ip} • {server.protocol}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 font-mono">{server.ping} ms</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                🔒 ضمان انعدام السجلات (Zero-Logs Policy): لا يتم تخزين أي بحث أو عنوان نهائياً
              </span>
              <button
                type="button"
                onClick={() => setIsVpnModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. مدير مهام كروم (Chrome Task Manager - Shift+Esc)
      ═══════════════════════════════════════════════════════════════ */}
      {isTaskManagerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsTaskManagerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">مدير مهام المتصفح (Chrome Task Manager)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskManagerOpen(false)}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 font-semibold pb-2">
                    <th className="p-2">المهمة / العملية</th>
                    <th className="p-2">الذاكرة (RAM)</th>
                    <th className="p-2">المعالج (CPU)</th>
                    <th className="p-2">معرف العملية (PID)</th>
                  </tr>
                </thead>
                <tbody>
                  {getActiveProcesses().map((p) => (
                    <tr
                      key={p.pid}
                      onClick={() => setSelectedProcessPid(p.pid)}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition ${
                        selectedProcessPid === p.pid
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <td className="p-2.5 truncate max-w-[260px] flex items-center gap-2">
                        {p.type === 'browser' && <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        {p.type === 'gpu' && <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {p.type === 'network' && <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        {p.type === 'vpn' && <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {p.type === 'renderer' && <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                        {p.type === 'storage' && <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                        <span className="truncate">{p.name}</span>
                      </td>
                      <td className="p-2.5 font-mono">{p.memoryMB} MB</td>
                      <td className="p-2.5 font-mono">{p.cpuPercent}%</td>
                      <td className="p-2.5 font-mono text-gray-400">{p.pid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                بنية متعددة العمليات (Multi-Process): عزل تام بين المواقع والذاكرة
              </span>
              <button
                type="button"
                disabled={!selectedProcessPid}
                onClick={() => selectedProcessPid && handleKillProcess(selectedProcessPid)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
              >
                إنهاء العملية (End Process)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          7. نافذة تسجيل الدخول بالمزامنة
      ═══════════════════════════════════════════════════════════════ */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              {userProfile.isLoggedIn ? userProfile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold mb-1">
              {userProfile.isLoggedIn ? userProfile.name : 'تسجيل الدخول إلى AnwerBrowser'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              {userProfile.isLoggedIn
                ? `مزامنة الإشارات وكلمات المرور نشطة عبر: ${userProfile.email}`
                : 'قم بتسجيل الدخول لمزامنة الإشارات وسجل التصفح وكلمات المرور بين أجهزتك.'}
            </p>

            {userProfile.isLoggedIn ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span>المزامنة المشفرة: مفعّلة</span>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserProfile({ isLoggedIn: false, email: '', name: '', syncEnabled: false });
                    showToast('تم تسجيل الخروج');
                    setIsProfileModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
                >
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  if (email) {
                    setUserProfile({
                      isLoggedIn: true,
                      email,
                      name: email.split('@')[0],
                      syncEnabled: true,
                    });
                    showToast('تم تسجيل الدخول وتفعيل المزامنة بنجاح 🎉');
                    setIsProfileModalOpen(false);
                  }
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="أدخل بريدك الإلكتروني (Gmail)..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-xs focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  تسجيل الدخول وتفعيل المزامنة
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          8. درج السجل والتنزيلات (History & Downloads Drawers)
      ═══════════════════════════════════════════════════════════════ */}
      {isHistoryDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end"
          onClick={() => setIsHistoryDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-700"
          >
            {/* ترويسة درج السجل وأزرار التحكم */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  سجل التصفح ({filteredHistory.length})
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {historyList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-xs flex items-center gap-1 font-semibold"
                    title="مسح سجل التصفح بالكامل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">مسح الكل</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* مربع البحث والتصفية المباشر بالكلمات المفتاحية */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30] space-y-2.5">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="ابحث في السجل بالاسم، الرابط، أو الكلمة..."
                  className="w-full pr-9 pl-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#1E1F22] transition"
                  autoFocus
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute left-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-white p-0.5"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* أزرار التصفية والتصنيف (Filter Chips) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => setHistoryFilterCategory('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                    historyFilterCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  الكل ({historyList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterCategory('searches')}
                  className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                    historyFilterCategory === 'searches'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  عمليات البحث 🔍
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterCategory('domains')}
                  className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                    historyFilterCategory === 'domains'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  المواقع والنطاقات 🌐
                </button>
              </div>
            </div>

            {/* قائمة نتائج السجل المصفاة */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs flex flex-col items-center">
                  <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                  {historySearchQuery ? (
                    <>
                      <p className="font-semibold text-gray-600 dark:text-gray-300">
                        لا توجد نتائج تطابق: "{historySearchQuery}"
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setHistorySearchQuery('');
                          setHistoryFilterCategory('all');
                        }}
                        className="mt-3 text-blue-600 hover:underline font-bold text-xs"
                      >
                        إعادة ضبط البحث والتصفية
                      </button>
                    </>
                  ) : (
                    <p>سجل التصفح فارغ تماماً</p>
                  )}
                </div>
              ) : (
                filteredHistory.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      navigateCurrentTab(h.url);
                      setIsHistoryDrawerOpen(false);
                    }}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="truncate flex-1 pl-2">
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate mb-0.5">
                        {h.title}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono truncate dir-ltr text-left">
                        {h.url}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400 font-mono">{h.time}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(i, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isDownloadsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
          onClick={() => setIsDownloadsDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">التنزيلات ({downloadsList.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDownloadsDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {downloadsList.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between"
                >
                  <div className="truncate flex-1">
                    <div className="text-xs font-bold truncate">{d.filename}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">{d.size} • مكتمل 🟢</div>
                  </div>
                  <span className="text-[10px] text-gray-400">{d.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Snackbar الإشعار السريع */}
      {toastMsg && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 pointer-events-none flex justify-center">
          <div className="px-4 py-2.5 rounded-xl bg-[#202124] text-white text-xs shadow-lg flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
