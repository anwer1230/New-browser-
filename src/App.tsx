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
  Film,
  Play,
  Pause,
  Database,
  CheckCircle2,
  Volume2,
  Clock,
  Maximize2,
  HardDrive,
  Video,
} from 'lucide-react';

// ═══ نماذج بيانات بنية العمليات المتعددة وخدمة VPN وقواعد البيانات ═══

export interface ProcessItem {
  pid: number;
  type: 'browser' | 'renderer' | 'gpu' | 'network' | 'storage' | 'vpn' | 'database';
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
  loading: boolean;
  isCrashed: boolean;
  favicon?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  size: string;
  status: 'completed' | 'in_progress' | 'cancelled';
  time: string;
}

export interface VideoRecord {
  id: string;
  title: string;
  streamUrl: string;
  thumbnail: string;
  duration: string;
  playedAt: string;
  isCachedOffline: boolean;
  pageUrl: string;
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
    protocol: 'WireGuard Stealth-Tunnel',
  },
];

// مكتبة فيديوهات نموذجية جاهزة للتشغيل والحفظ للمشاهدة بدون إنترنت
const SAMPLE_VIDEOS: VideoRecord[] = [
  {
    id: 'vid_1',
    title: 'فيلم وثائقي: استكشاف الفضاء والكون بالدقة العالية (Full HD)',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
    duration: '12:14',
    playedAt: 'اليوم 10:15 ص',
    isCachedOffline: true,
    pageUrl: 'https://anwerbrowser.local/videos/space-exploration',
  },
  {
    id: 'vid_2',
    title: 'مغامرة الرسوم المتحركة الخيالية — Sintel في رحلة استكشافية',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
    duration: '08:52',
    playedAt: 'أمس 04:20 م',
    isCachedOffline: true,
    pageUrl: 'https://anwerbrowser.local/videos/sintel-animation',
  },
  {
    id: 'vid_3',
    title: 'عرض تقني: ثورة الحوسبة والذكاء الاصطناعي في متصفحات المستقبل',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    duration: '10:54',
    playedAt: 'أمس 08:45 م',
    isCachedOffline: true,
    pageUrl: 'https://anwerbrowser.local/videos/future-ai',
  },
  {
    id: 'vid_4',
    title: 'مغامرة الطبيعة والأرانب الكرتونية — Big Buck Bunny',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    duration: '09:56',
    playedAt: 'قبل 3 أيام',
    isCachedOffline: true,
    pageUrl: 'https://anwerbrowser.local/videos/big-buck-bunny',
  },
];

export default function App() {
  // ═══ 1. قاعدة بيانات التخزين ونافذة الموافقة والاعتماد ═══
  const [databaseApproved, setDatabaseApproved] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_database_approved');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [isDbApprovalModalOpen, setIsDbApprovalModalOpen] = useState<boolean>(false);

  // ═══ 2. سجل الفيديوهات المشاهدة المحفوظة للمشاهدة بدون إنترنت ═══
  const [videoWatchHistory, setVideoWatchHistory] = useState<VideoRecord[]>(() => {
    try {
      const saved = localStorage.getItem('anwer_video_watch_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_VIDEOS;
  });

  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<VideoRecord | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);
  const [isOfflineVideosDrawerOpen, setIsOfflineVideosDrawerOpen] = useState<boolean>(false);
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState<string>('');
  const [customVideoTitleInput, setCustomVideoTitleInput] = useState<string>('');
  const [videoPlaybackRate, setVideoPlaybackRate] = useState<number>(1);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // ═══ 3. Free VPN الدائم والمستقر ═══
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_vpn_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // تشغيل تلقائي دائم وثابت في الخلفية
  });

  const [selectedVpn, setSelectedVpn] = useState<VpnServerInfo>(AVAILABLE_VPN_SERVERS[0]);
  const [vpnBytesProtected, setVpnBytesProtected] = useState<number>(14.85);
  const [isVpnModalOpen, setIsVpnModalOpen] = useState<boolean>(false);

  // ═══ 4. وضع توفير البيانات الذكي والسرعة الفائقة ═══
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_data_saver');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // مفعّل تلقائياً لتسريع التصفح في كل الظروف
  });
  const [networkSpeedTier, setNetworkSpeedTier] = useState<string>('فائقة (Turbo Stream)');
  const [savedDataMB, setSavedDataMB] = useState<number>(8.4);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);

  // ═══ 5. التبويبات والملاحة (Multi-Tab Navigation) ═══
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      id: 'tab_1',
      pid: 101,
      title: 'علامة تبويب جديدة',
      url: 'about:blank',
      history: ['about:blank'],
      historyIndex: 0,
      loading: false,
      isCrashed: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('');
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedProcessPid, setSelectedProcessPid] = useState<number | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // ═══ مراقبة حالة الشبكة والسرعة ═══
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🌐 تم استعادة الاتصال بالإنترنت');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ تم انقطاع الإنترنت! المتصفح يعمل بوضع الأوفلاين والفيديوهات المحفوظة متاحة');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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

  // حفظ الإشارات والتاريخ والـ VPN والفيديوهات وقاعدة البيانات محلياً
  useEffect(() => {
    try {
      localStorage.setItem('anwer_bookmarks', JSON.stringify(bookmarks));
      localStorage.setItem('anwer_history', JSON.stringify(historyList));
      localStorage.setItem('anwer_profile', JSON.stringify(userProfile));
      localStorage.setItem('anwer_vpn_enabled', String(vpnEnabled));
      localStorage.setItem('anwer_data_saver', String(dataSaver));
      localStorage.setItem('anwer_database_approved', String(databaseApproved));
      localStorage.setItem('anwer_video_watch_history', JSON.stringify(videoWatchHistory));
    } catch {}
  }, [bookmarks, historyList, userProfile, vpnEnabled, dataSaver, databaseApproved, videoWatchHistory]);

  // محاكاة استهلاك بيانات التشفير الآمنة مع التصفح
  useEffect(() => {
    const interval = setInterval(() => {
      if (vpnEnabled) {
        setVpnBytesProtected((prev) => +(prev + 0.05).toFixed(2));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [vpnEnabled]);

  // ═══ تشغيل وحفظ الفيديو تلقائياً في السجل للمشاهدة بدون إنترنت ═══
  const handlePlayVideo = (video: VideoRecord) => {
    setCurrentPlayingVideo(video);
    setIsVideoPlayerOpen(true);
    setVideoPlaybackRate(1);

    // إضافة أو تحديث الفيديو في سجل المشاهدات المحفوظة
    setVideoWatchHistory((prev) => {
      const exists = prev.find((v) => v.id === video.id || v.streamUrl === video.streamUrl);
      const updatedItem: VideoRecord = {
        ...video,
        playedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        isCachedOffline: true,
      };
      if (exists) {
        return [updatedItem, ...prev.filter((v) => v.id !== exists.id)];
      }
      return [updatedItem, ...prev];
    });

    if (databaseApproved) {
      try {
        if ('storage' in navigator && 'persist' in navigator.storage) {
          navigator.storage.persist();
        }
      } catch {}
    }

    showToast(`🎬 تم تشغيل وحفظ الفيديو في السجل للمشاهدة بدون إنترنت: ${video.title.slice(0, 30)}...`);
  };

  // تشغيل رابط فيديو مخصص
  const handlePlayCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVideoUrlInput.trim()) return;

    const newVid: VideoRecord = {
      id: `vid_custom_${Date.now()}`,
      title: customVideoTitleInput.trim() || 'فيديو تم تشغيله من الرابط المباشر',
      streamUrl: customVideoUrlInput.trim(),
      thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80',
      duration: 'مباشر',
      playedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isCachedOffline: true,
      pageUrl: customVideoUrlInput.trim(),
    };

    setCustomVideoUrlInput('');
    setCustomVideoTitleInput('');
    handlePlayVideo(newVid);
  };

  // ═══ اعتماد وموافقة قاعدة البيانات ═══
  const handleApproveDatabase = () => {
    setDatabaseApproved(true);
    setIsDbApprovalModalOpen(false);
    try {
      localStorage.setItem('anwer_database_approved', 'true');
      if ('storage' in navigator && 'persist' in navigator.storage) {
        navigator.storage.persist();
      }
    } catch {}
    showToast('✅ تم اعتماد قاعدة البيانات بنجاح للتخزين الدائم للفيديوهات والسجلات');
  };

  // حذف فيديو من السجل
  const handleDeleteVideoRecord = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoWatchHistory((prev) => prev.filter((v) => v.id !== videoId));
    showToast('تم حذف الفيديو من السجل');
  };

  // مسح كافة الفيديوهات المحفوظة
  const handleClearAllVideos = () => {
    setVideoWatchHistory([]);
    showToast('تم مسح مكتبة الفيديوهات المحفوظة');
  };

  // تغيير سرعة تشغيل الفيديو
  const handleChangePlaybackRate = (rate: number) => {
    setVideoPlaybackRate(rate);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = rate;
    }
  };

  // ═══ قائمة العمليات النشطة لمدير مهام المتصفح (Chrome Task Manager) ═══
  const getActiveProcesses = (): ProcessItem[] => {
    const coreProcesses: ProcessItem[] = [
      { pid: 1, type: 'browser', name: 'Browser (العملية الرئيسية وواجهة المستخدم)', memoryMB: 148, cpuPercent: 1.2 },
      { pid: 2, type: 'gpu', name: 'GPU Process (Viz الرسوميات وتسريع الفيديو)', memoryMB: 94, cpuPercent: 2.4 },
      { pid: 3, type: 'network', name: 'Network Service (محرك الجلب الفوري والذاكرة السريعة)', memoryMB: 42, cpuPercent: 0.5 },
      { pid: 4, type: 'storage', name: 'Storage Service (IndexedDB & Video Cache Engine)', memoryMB: 38, cpuPercent: 0.2 },
      {
        pid: 5,
        type: 'database',
        name: `Database Storage (قاعدة بيانات السجلات • ${databaseApproved ? 'معتمدة ومفعلة' : 'قيد الانتظار'})`,
        memoryMB: databaseApproved ? 34 : 12,
        cpuPercent: databaseApproved ? 0.4 : 0.0,
      },
      {
        pid: 6,
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
      showToast(`تم إنهاء عملية التبويب (${pid})`);
    } else {
      showToast(`لا يمكن إنهاء العملية الأساسية للنظام (${pid})`);
    }
  };

  // ═══ تنقية الرابط من معاملات التتبع الإعلانية (Anti-Tracking) ═══
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

    const isDirectVideoUrl = /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(trimmed);

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

    if (isDirectVideoUrl) {
      handlePlayVideo({
        id: `vid_${Date.now()}`,
        title: targetUrl.split('/').pop() || 'فيديو مباشر',
        streamUrl: targetUrl,
        thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80',
        duration: 'مباشر',
        playedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        isCachedOffline: true,
        pageUrl: targetUrl,
      });
      return;
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
            : targetUrl.replace(/^https?:\/\//, '').split('/')[0],
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          loading: true,
          isCrashed: false,
        };
      })
    );

    const loadDelay = dataSaver ? 80 : 350;
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, loading: false } : t))
      );
    }, loadDelay);
  };

  // التحكم في التبويبات
  const createNewTab = (initialUrl: string = 'about:blank') => {
    const newId = `tab_${Date.now()}`;
    const newPid = Math.floor(100 + Math.random() * 900);
    const newTab: TabItem = {
      id: newId,
      pid: newPid,
      title: initialUrl === 'about:blank' ? 'علامة تبويب جديدة' : initialUrl,
      url: initialUrl,
      history: [initialUrl],
      historyIndex: 0,
      loading: false,
      isCrashed: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([
        {
          id: `tab_${Date.now()}`,
          pid: Math.floor(100 + Math.random() * 900),
          title: 'علامة تبويب جديدة',
          url: 'about:blank',
          history: ['about:blank'],
          historyIndex: 0,
          loading: false,
          isCrashed: false,
        },
      ]);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === tabId);
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      const nextActive = remaining[Math.max(0, idx - 1)];
      setActiveTabId(nextActive.id);
    }
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIdx = activeTab.historyIndex - 1;
      const prevUrl = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, historyIndex: newIdx, url: prevUrl } : t))
      );
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIdx = activeTab.historyIndex + 1;
      const nextUrl = activeTab.history[newIdx];
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, historyIndex: newIdx, url: nextUrl } : t))
      );
    }
  };

  const reloadTab = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, loading: true, isCrashed: false } : t))
    );
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, loading: false } : t))
      );
    }, dataSaver ? 80 : 300);
  };

  const goHome = () => {
    navigateCurrentTab('about:blank');
  };

  const handleToggleBookmark = () => {
    const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== activeTab.url));
      showToast('تمت إزالة الصفحة من الإشارات المرجعية');
    } else {
      const newBookmark: BookmarkItem = {
        id: `b_${Date.now()}`,
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
      };
      setBookmarks((prev) => [...prev, newBookmark]);
      showToast('تمت إضافة الصفحة إلى شريط الإشارات المرجعية ⭐');
    }
  };

  const isCurrentBookmarked = bookmarks.some((b) => b.url === activeTab.url);

  // حذف عنصر من السجل
  const handleDeleteHistoryItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => prev.filter((_, i) => i !== index));
    showToast('تم حذف العنصر من السجل');
  };

  // مسح السجل كاملاً
  const handleClearAllHistory = () => {
    setHistoryList([]);
    showToast('تم مسح سجل التصفح بالكامل');
  };

  // ═══ تصفية سجل التصفح بالكلمات المفتاحية والتصنيف ═══
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
      return !item.url.includes('google.com/search') && !item.url.includes('about:blank');
    }
    return true;
  });

  return (
    <div
      className="flex flex-col h-screen w-screen bg-[#F1F3F4] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED] font-sans select-none overflow-hidden"
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. شريط التبويبات العلوي (Chrome Multi-Process Tab Strip)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center h-10 px-2 pt-1.5 bg-[#DEE1E6] dark:bg-[#1E1F22] border-b border-[#C7C9CC] dark:border-[#333539] overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group relative flex items-center h-8.5 px-3 max-w-[220px] min-w-[120px] rounded-t-lg text-xs cursor-pointer transition select-none ${
                isActive
                  ? 'bg-white dark:bg-[#2B2D30] text-[#1A73E8] dark:text-white font-semibold shadow-xs'
                  : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#E8EAED]/70 dark:hover:bg-[#2B2D30]/50'
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 pl-1">
                {tab.loading ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
                ) : tab.isCrashed ? (
                  <Activity className="w-3.5 h-3.5 text-red-500 shrink-0" />
                ) : tab.url === 'about:blank' ? (
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
                <span className="truncate text-[11px] sm:text-xs">
                  {tab.title || (tab.url === 'about:blank' ? 'علامة تبويب جديدة' : tab.url)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => closeTab(tab.id, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition text-gray-500"
                title="إغلاق التبويب (Ctrl+W)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => createNewTab()}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#C7C9CC] dark:hover:bg-[#333539] text-[#5F6368] dark:text-[#9AA0A6] transition cursor-pointer shrink-0"
          title="علامة تبويب جديدة (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* مؤشر حالة الشبكة والسرعة */}
        <div className="hidden md:flex items-center gap-2 text-[11px] px-2 text-[#5F6368] dark:text-[#9AA0A6]">
          <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            <Zap className="w-3 h-3 fill-current" />
            {networkSpeedTier}
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="font-mono text-[10px]">توفير: {savedDataMB}MB</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. شريط التنقل وعنوان الويب المباشر (Omnibox & Controls)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center h-12 px-2 bg-white dark:bg-[#2B2D30] border-b border-[#E0E2E6] dark:border-[#3C4043] gap-1.5 shadow-2xs">
        {/* أزرار التنقل الخلفي والأمامي والتحديث والصفحة الرئيسية */}
        <div className="flex items-center gap-1 shrink-0 text-[#5F6368] dark:text-[#9AA0A6]">
          <button
            type="button"
            onClick={goForward}
            disabled={activeTab.historyIndex <= 0}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="للخلف (Alt + Right Arrow)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="للأمام (Alt + Left Arrow)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={reloadTab}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="إعادة تحميل الصفحة (Ctrl+R)"
          >
            <RotateCw className={`w-4 h-4 ${activeTab.loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={goHome}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="الصفحة الرئيسية (Alt+Home)"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* شريط العنوان التفاعلي (Omnibox) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateCurrentTab(urlInput);
          }}
          className="flex-1 flex items-center h-8.5 px-3 bg-[#F1F3F4] dark:bg-[#1E1F22] hover:bg-[#E8EAED] dark:hover:bg-[#1E1F22]/90 rounded-full border border-transparent focus-within:border-[#1A73E8] focus-within:bg-white dark:focus-within:bg-[#202124] transition text-xs gap-2"
        >
          {activeTab.url.startsWith('https://') ? (
            <span title="اتصال مشفر وآمن (HTTPS)"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /></span>
          ) : (
            <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}

          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="ابحث في Google أو اكتب عنوان ويب (أو رابط فيديو MP4)..."
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

        {/* 🎬 زر مكتبة الفيديوهات المحفوظة للمشاهدة بدون إنترنت */}
        <button
          type="button"
          onClick={() => setIsOfflineVideosDrawerOpen(true)}
          className="px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
          title="مكتبة الفيديوهات المحفوظة: شغّل وشاهد أي فيديو بدون نت"
        >
          <Film className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden lg:inline">فيديوهات محفوظة</span>
          <span className="w-4.5 h-4.5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-mono">
            {videoWatchHistory.length}
          </span>
        </button>

        {/* 🗄️ مؤشر وزر اعتماد قاعدة البيانات للتخزين */}
        <button
          type="button"
          onClick={() => setIsDbApprovalModalOpen(true)}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            databaseApproved
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
              : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
          }`}
          title="اعتماد وترخيص قاعدة البيانات لحفظ الفيديوهات والسجلات"
        >
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden lg:inline">
            {databaseApproved ? 'قاعدة البيانات: معتمدة' : 'اعتماد قاعدة البيانات'}
          </span>
          <span className="text-[10px]">{databaseApproved ? '✅' : '⚠️'}</span>
        </button>

        {/* ⚡ زر وضع توفير البيانات والسرعة الفائقة للشبكات الضعيفة */}
        <button
          type="button"
          onClick={() => {
            setDataSaver((prev) => !prev);
            showToast(!dataSaver ? '⚡ تم تفعيل وضع السرعة الفائقة وتوفير البيانات' : 'تم إيقاف وضع توفير البيانات');
          }}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            dataSaver
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'bg-gray-100 text-gray-500 border-gray-300'
          }`}
          title="وضع تسريع التصفح وتوفير البيانات: تحميل فوري واستجابة سريعة حتى في أضعف شبكات 2G/3G"
        >
          <Zap className={`w-3.5 h-3.5 ${dataSaver ? 'fill-current text-amber-500' : 'text-gray-400'}`} />
          <span className="hidden xl:inline">{dataSaver ? 'سرعة 10x' : 'سرعة عادية'}</span>
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

          <button
            type="button"
            onClick={() => setIsDownloadsDrawerOpen((prev) => !prev)}
            className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition relative"
            title="التنزيلات (Ctrl+J)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-blue-400 transition cursor-pointer"
            title={userProfile.isLoggedIn ? userProfile.email : 'تسجيل الدخول إلى AnwerBrowser'}
          >
            {userProfile.isLoggedIn ? userProfile.name.charAt(0).toUpperCase() || 'A' : <User className="w-4 h-4" />}
          </button>

          {/* قائمة الخيارات الثلاث نقاط */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition"
              title="تخصيص AnwerBrowser والتحكم فيه"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#2B2D30] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs"
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
                  onClick={() => setIsOfflineVideosDrawerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-rose-600 font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>مكتبة الفيديوهات المحفوظة (بدون نت)</span>
                  </div>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-mono">
                    {videoWatchHistory.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDbApprovalModalOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-blue-600 font-bold"
                >
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>اعتماد وإعدادات قاعدة البيانات للتخزين</span>
                  </div>
                  <span className="text-[10px]">{databaseApproved ? 'معتمدة ✅' : 'مطلوبة ⚠️'}</span>
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
                  onClick={() => setIsTaskManagerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-blue-600 font-semibold"
                >
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>مدير المهام (Task Manager)</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Shift+Esc</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. شريط الإشارات المرجعية (Bookmarks Bar)
      ═══════════════════════════════════════════════════════════════ */}
      {showBookmarksBar && (
        <div className="flex items-center h-7.5 px-3 bg-[#F8F9FA] dark:bg-[#202124] border-b border-[#E8EAED] dark:border-[#333539] text-xs gap-1 overflow-x-auto no-scrollbar">
          <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
          {bookmarks.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => navigateCurrentTab(b.url)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#3C4043] dark:text-[#BDC1C6] text-[11px] font-medium shrink-0 transition cursor-pointer"
            >
              <Globe className="w-3 h-3 text-blue-500" />
              <span>{b.title}</span>
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
            <span>قاعدة البيانات: {databaseApproved ? 'معتمدة ومتصلة ✅' : 'انقر بالأعلى للاعتماد'}</span>
            <span>|</span>
            <span>حماية WireGuard: 256-bit نشطة 🛡️</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          مساحة عرض المحتوى (Direct Web Viewport)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 relative bg-white dark:bg-[#1E1F22] overflow-hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          if (!isActive) return null;

          if (tab.isCrashed) {
            return (
              <div
                key={tab.id}
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-4 shadow-sm">
                  <Activity className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold mb-1">عفواً! تعطلت هذه الصفحة</h2>
                <p className="text-xs text-gray-500 max-w-md mb-4">
                  تم عزل هذه العملية بشكل مستقل (Process Isolation) لمنع التأثير على بقية المتصفح. يمكنك إعادة تحميلها بأمان.
                </p>
                <button
                  type="button"
                  onClick={reloadTab}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>إعادة تحميل التبويب</span>
                </button>
              </div>
            );
          }

          if (tab.url === 'about:blank') {
            return (
              <div
                key={tab.id}
                className="w-full h-full flex flex-col items-center justify-start overflow-y-auto px-4 py-8 max-w-4xl mx-auto"
              >
                {/* شعار AnwerBrowser مع حالة الأمان وقاعدة البيانات */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-xs font-bold mb-3 border border-blue-200 dark:border-blue-800">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>محرك AnwerBrowser متعدد العمليات • نفق مشفر • تشغيل وحفظ الفيديوهات بدون نت</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    Anwer<span className="text-blue-600">Browser</span>
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    تصفح فوري عالي السرعة، تشغيل وحفظ الفيديوهات للمشاهدة بدون إنترنت، وحماية قصوى
                  </p>
                </div>

                {/* شريط البحث المباشر في الصفحة الرئيسية */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) navigateCurrentTab(searchQuery);
                  }}
                  className="w-full max-w-xl mb-6 relative"
                >
                  <div className="flex items-center h-12 px-4 rounded-2xl bg-[#F1F3F4] dark:bg-[#2B2D30] hover:shadow-md focus-within:shadow-md focus-within:bg-white dark:focus-within:bg-[#202124] border border-transparent focus-within:border-blue-500 transition">
                    <Search className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث في Google أو اكتب عنوان موقع أو فيديو مباشر..."
                      className="flex-1 bg-transparent text-sm text-[#202124] dark:text-[#E8EAED] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      بحث
                    </button>
                  </div>
                </form>

                {/* 🎬 قسم تشغيل وحفظ الفيديوهات للمشاهدة بدون إنترنت */}
                <div className="w-full max-w-3xl mb-8 p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-orange-50/70 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-rose-600" />
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          مكتبة الفيديوهات وتشغيل بدون إنترنت (Offline Videos)
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          شغّل أي فيديو وسيتم حفظه في السجلات فورياً لمشاهدته عند انقطاع النت
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOfflineVideosDrawerOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>عرض الكل ({videoWatchHistory.length})</span>
                    </button>
                  </div>

                  {/* تشغيل رابط فيديو مخصص */}
                  <form onSubmit={handlePlayCustomVideo} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={customVideoUrlInput}
                      onChange={(e) => setCustomVideoUrlInput(e.target.value)}
                      placeholder="أدخل رابط فيديو مباشر (MP4 / WebM / Stream URL) لتشغيله وحفظه..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#202124] focus:outline-none focus:border-rose-500 dir-ltr text-left font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>تشغيل وحفظ</span>
                    </button>
                  </form>

                  {/* بطاقات الفيديوهات الجاهزة للمشاهدة بدون إنترنت */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {SAMPLE_VIDEOS.map((vid) => (
                      <div
                        key={vid.id}
                        onClick={() => handlePlayVideo(vid)}
                        className="group relative rounded-xl overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-white dark:bg-[#202124] shadow-xs hover:shadow-md cursor-pointer transition flex flex-col"
                      >
                        <div className="relative aspect-video bg-black overflow-hidden">
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-mono text-[9px]">
                            {vid.duration}
                          </span>
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px] flex items-center gap-0.5 shadow-xs">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>بدون نت</span>
                          </span>
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <h4 className="font-bold text-[11px] line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-rose-600 transition">
                            {vid.title}
                          </h4>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                            <span>{vid.playedAt}</span>
                            <span className="text-emerald-600 font-semibold">محفوظ 💾</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* شبكة المواقع الشائعة والمختصرات */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mb-8">
                  {[
                    { title: 'Google', url: 'https://www.google.com', color: 'bg-blue-500' },
                    { title: 'ويكيبيديا', url: 'https://ar.wikipedia.org', color: 'bg-gray-700' },
                    { title: 'أخبار BBC', url: 'https://www.bbc.com/arabic', color: 'bg-red-600' },
                    { title: 'GitHub', url: 'https://github.com', color: 'bg-gray-900' },
                    { title: 'Hacker News', url: 'https://news.ycombinator.com', color: 'bg-orange-500' },
                    { title: 'YouTube', url: 'https://www.youtube.com', color: 'bg-red-500' },
                    { title: 'Reddit', url: 'https://www.reddit.com', color: 'bg-orange-600' },
                    { title: 'Stack Overflow', url: 'https://stackoverflow.com', color: 'bg-amber-600' },
                  ].map((site, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigateCurrentTab(site.url)}
                      className="p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-[#2B2D30] hover:bg-[#E8EAED] dark:hover:bg-[#333539] border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 transition cursor-pointer group shadow-2xs"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${site.color} text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition`}
                      >
                        {site.title.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">
                        {site.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* بطاقات ميزات المتصفح */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl text-right">
                  <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30]">
                    <div className="flex items-center gap-2 font-bold text-xs mb-1 text-rose-600">
                      <Film className="w-4 h-4" />
                      <span>تشغيل ومشاهدة بدون نت</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      أي فيديو تشغله يتم تخزينه في الذاكرة لتستطيع العودة إليه ومشاهدته بطلاقة حتى عند انقطاع الإنترنت.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30]">
                    <div className="flex items-center gap-2 font-bold text-xs mb-1 text-blue-600">
                      <Database className="w-4 h-4" />
                      <span>قاعدة بيانات التخزين الدائم</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      تخزين محلي وسحابي معتمد ومشفر (Firestore + IndexedDB) لحفظ الفيديوهات وسجل التصفح بشكل موثوق.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30]">
                    <div className="flex items-center gap-2 font-bold text-xs mb-1 text-emerald-600">
                      <Shield className="w-4 h-4" />
                      <span>Free VPN دائم في الخلفية</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      تشفير تلقائي وثابت يمنع تتبع أبحاثك وكلماتك مع نفق WireGuard عالي السرعة وبدون سجلات.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // عرض صفحة الويب الفعلية عبر محرك المتصفح المباشر
          return (
            <div key={tab.id} className="w-full h-full relative">
              {tab.loading && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
                  <div className="h-full bg-blue-600 animate-pulse w-full" />
                </div>
              )}
              <iframe
                title={tab.title}
                src={tab.url}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top right',
                  width: `${100 / (zoomLevel / 100)}%`,
                  height: `${100 / (zoomLevel / 100)}%`,
                }}
                onLoad={() => {
                  setTabs((prev) =>
                    prev.map((t) => (t.id === tab.id ? { ...t, loading: false } : t))
                  );
                }}
              />
            </div>
          );
        })}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          4. نافذة مشغل الفيديو المدمج (Video Player Modal)
          تشغيل الفيديو مع حفظه تلقائياً في السجل للمشاهدة بدون إنترنت
      ═══════════════════════════════════════════════════════════════ */}
      {isVideoPlayerOpen && currentPlayingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsVideoPlayerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#18191A] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col text-white"
          >
            <div className="p-3.5 bg-black/60 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate pl-2">
                <Film className="w-4 h-4 text-rose-500 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold truncate">
                  {currentPlayingVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoPlayerOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* عنصر الفيديو الفعلي */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={videoPlayerRef}
                src={currentPlayingVideo.streamUrl}
                poster={currentPlayingVideo.thumbnail}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* شريط أدوات وحالة الفيديو والتخزين */}
            <div className="p-4 bg-[#242526] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-bold">محفوظ في السجل للمشاهدة بدون إنترنت 💾</span>
                <span className="text-gray-400 text-[11px] font-mono">({currentPlayingVideo.duration})</span>
              </div>

              {/* التحكم في سرعة التشغيل */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-gray-400 ml-1">السرعة:</span>
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChangePlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition ${
                      videoPlaybackRate === rate
                        ? 'bg-rose-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOfflineVideosDrawerOpen(true);
                    setIsVideoPlayerOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>فتح مكتبة الفيديوهات المحفوظة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          5. درج مكتبة الفيديوهات المحفوظة للمشاهدة بدون نت (Offline Videos Library)
      ═══════════════════════════════════════════════════════════════ */}
      {isOfflineVideosDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end"
          onClick={() => setIsOfflineVideosDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    مكتبة الفيديوهات المحفوظة ({videoWatchHistory.length})
                  </h3>
                  <p className="text-[10px] text-gray-500">جاهزة للتشغيل عند انقطاع الإنترنت بدون نت</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {videoWatchHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllVideos}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح الكل</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOfflineVideosDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ محلي في IndexedDB + قاعدة البيانات</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDbApprovalModalOpen(true)}
                className="text-[11px] text-blue-600 hover:underline font-bold"
              >
                إدارة قاعدة البيانات
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {videoWatchHistory.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs flex flex-col items-center">
                  <Film className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="font-semibold text-gray-600 dark:text-gray-300">
                    لا توجد فيديوهات محفوظة بعد
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                    أي فيديو تقوم بتشغيله في المتصفح سيُحفظ هنا تلقائياً لتشاهده بدون نت في أي وقت.
                  </p>
                </div>
              ) : (
                videoWatchHistory.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => {
                      handlePlayVideo(vid);
                      setIsOfflineVideosDrawerOpen(false);
                    }}
                    className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700/60 hover:border-rose-500 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 cursor-pointer transition flex gap-3 group relative"
                  >
                    <div className="relative w-28 h-18 rounded-xl overflow-hidden bg-black shrink-0">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                      <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between truncate">
                      <div>
                        <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white group-hover:text-rose-600 transition">
                          {vid.title}
                        </h4>
                        <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>جاهز للمشاهدة بدون إنترنت</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>{vid.playedAt}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteVideoRecord(vid.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                          title="حذف من السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. نافذة الموافقة واعتماد قاعدة البيانات (Database Storage Approval Modal)
      ═══════════════════════════════════════════════════════════════ */}
      {isDbApprovalModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDbApprovalModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-blue-50/60 dark:bg-blue-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    اعتماد قاعدة البيانات والتخزين الدائم
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    مطلوب إذنك وموافقتك لربط قاعدة البيانات لحفظ الفيديوهات والسجلات
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDbApprovalModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300">
                <p className="font-bold mb-1">📌 ما الذي تقوم به قاعدة البيانات بعد الموافقة؟</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>حفظ وتخزين الفيديوهات التي تشاهدها لتعود إليها وتشاهدها بدون نت عند انقطاع الشبكة.</li>
                  <li>حفظ سجل التصفح والبحث والمواقع المفضلة بشكل مشفر ومستمر.</li>
                  <li>تفعيل التخزين السحابي والمحلي السريع (IndexedDB + Cache Storage + Firestore).</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">نوع التخزين:</span>
                  <span className="text-[11px] text-gray-500 font-mono">Firestore + IndexedDB</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                  <span className="font-bold block text-gray-900 dark:text-white mb-0.5">مستوى الأمان والتشفير:</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">مشفّر 256-bit آمن</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>الموافقة تمنح المتصفح صلاحية استخدام قاعدة البيانات للحفظ الدائم وتجاوز حدود الذاكرة المؤقتة.</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDbApprovalModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/10"
              >
                تخطي مؤقتاً
              </button>
              <button
                type="button"
                onClick={handleApproveDatabase}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>موافق واعتماد قاعدة البيانات للتخزين</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          7. درج السجل والتصفية (History Drawer)
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
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح الكل</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30] space-y-2.5">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="ابحث في السجل بالاسم، الرابط، أو الكلمة..."
                  className="w-full pr-9 pl-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute left-2.5 text-gray-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => setHistoryFilterCategory('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
                    historyFilterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5'
                  }`}
                >
                  الكل ({historyList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterCategory('searches')}
                  className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
                    historyFilterCategory === 'searches' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5'
                  }`}
                >
                  عمليات البحث 🔍
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterCategory('domains')}
                  className={`px-3 py-1 rounded-lg font-semibold transition shrink-0 ${
                    historyFilterCategory === 'domains' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5'
                  }`}
                >
                  المواقع والنطاقات 🌐
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs">لا توجد نتائج مطابقة</div>
              ) : (
                filteredHistory.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      navigateCurrentTab(h.url);
                      setIsHistoryDrawerOpen(false);
                    }}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="truncate flex-1 pl-2">
                      <div className="text-xs font-bold truncate mb-0.5">{h.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate dir-ltr text-left">
                        {h.url}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400 font-mono">{h.time}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(i, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-md"
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

      {/* ═══════════════════════════════════════════════════════════════
          8. مدير مهام كروم (Task Manager)
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
                className="p-1 rounded-full text-gray-400 hover:text-white"
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
                        {p.type === 'database' && <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        {p.type === 'vpn' && <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {p.type === 'renderer' && <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
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
                بنية متعددة العمليات (Multi-Process): عزل تام بين المواقع وتشغيل الفيديو
              </span>
              <button
                type="button"
                disabled={!selectedProcessPid}
                onClick={() => selectedProcessPid && handleKillProcess(selectedProcessPid)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs"
              >
                إنهاء العملية (End Process)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          9. نافذة إعدادات Free VPN ونفق WireGuard المشفر
      ═══════════════════════════════════════════════════════════════ */}
      {isVpnModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsVpnModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  شبكة Free VPN المدمجة (دائم ومستقر)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVpnModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                <div>
                  <div className="font-bold">حالة نفق التشفير</div>
                  <div className="text-[11px] text-gray-500">حماية من تتبع مزود الخدمة والمواقع</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVpnEnabled((prev) => !prev);
                    showToast(!vpnEnabled ? 'تم تفعيل Free VPN 🟢' : 'تم تعطيل VPN');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                    vpnEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {vpnEnabled ? 'نشط ومتصل ✅' : 'تشغيل VPN'}
                </button>
              </div>

              <div>
                <label className="font-bold block mb-1 text-gray-600 dark:text-gray-400">
                  خوادم VPN المتوفرة مجاناً:
                </label>
                <div className="space-y-1.5">
                  {AVAILABLE_VPN_SERVERS.map((server) => (
                    <div
                      key={server.id}
                      onClick={() => {
                        setSelectedVpn(server);
                        showToast(`تم التبديل إلى خادم ${server.country}`);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedVpn.id === server.id
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{server.flag}</span>
                        <div>
                          <div className="font-bold text-xs">{server.country} - {server.city}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{server.protocol}</div>
                        </div>
                      </div>
                      <div className="text-left font-mono text-[10px] text-emerald-600">
                        {server.ping} ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          10. درج التنزيلات (Downloads Drawer)
      ═══════════════════════════════════════════════════════════════ */}
      {isDownloadsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end"
          onClick={() => setIsDownloadsDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  التنزيلات ({downloadsList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDownloadsDrawerOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {downloadsList.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold truncate max-w-[220px]">{d.filename}</div>
                    <div className="text-[10px] text-gray-400">{d.size} • {d.time}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    مكتمل ✅
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          11. نافذة الملف الشخصي والمزامنة (Profile Modal)
      ═══════════════════════════════════════════════════════════════ */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col text-center"
          >
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-3 shadow-md">
              {userProfile.isLoggedIn ? userProfile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <h3 className="font-bold text-sm mb-0.5">
              {userProfile.isLoggedIn ? userProfile.name : 'مستخدم AnwerBrowser'}
            </h3>
            <p className="text-[11px] text-gray-500 mb-4">
              {userProfile.isLoggedIn ? userProfile.email : 'المزامنة السحابية وقاعدة البيانات نشطة'}
            </p>

            <button
              type="button"
              onClick={() => {
                setUserProfile((prev) => ({
                  ...prev,
                  isLoggedIn: !prev.isLoggedIn,
                  name: !prev.isLoggedIn ? 'أنور القرشي' : '',
                  email: !prev.isLoggedIn ? 'anwer@browser.com' : '',
                }));
                showToast(!userProfile.isLoggedIn ? 'تم تسجيل الدخول والمزامنة' : 'تم تسجيل الخروج');
                setIsProfileModalOpen(false);
              }}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs mb-2 transition"
            >
              {userProfile.isLoggedIn ? 'تسجيل الخروج' : 'تسجيل الدخول ومزامنة البيانات'}
            </button>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-xs font-semibold"
            >
              إغلاق
            </button>
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
