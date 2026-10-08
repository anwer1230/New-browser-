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
  Mic,
  Camera,
  Bell,
  Sparkles,
  Image,
  Smartphone,
  Monitor,
  Music,
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
  channel?: string;
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
    title: 'THE BEST SONGS OF ALL TIME - Top Acoustic & Pop Hits',
    channel: 'Lewis Capaldi · YouTube',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    duration: '16:26',
    playedAt: '2026/07/06',
    isCachedOffline: true,
    pageUrl: 'https://youtube.com/watch?v=best-songs',
  },
  {
    id: 'vid_2',
    title: 'Top Hits Radio 2026 - Non Stop English Songs Playlist',
    channel: 'Vevo UK · YouTube',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    duration: '1:58:13',
    playedAt: 'أمس 04:20 م',
    isCachedOffline: true,
    pageUrl: 'https://youtube.com/watch?v=top-hits',
  },
  {
    id: 'vid_3',
    title: 'فيلم وثائقي: استكشاف الفضاء والكون بالدقة العالية (Full HD)',
    channel: 'Space Science · YouTube',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    duration: '10:54',
    playedAt: 'أمس 08:45 م',
    isCachedOffline: true,
    pageUrl: 'https://anwerbrowser.local/videos/space',
  },
  {
    id: 'vid_4',
    title: 'مغامرة الرسوم المتحركة الكرتونية — Big Buck Bunny',
    channel: 'Blender Studio · YouTube',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    duration: '09:56',
    playedAt: 'قبل 3 أيام',
    isCachedOffline: true,
    pageUrl: 'https://anwerbrowser.local/videos/big-buck-bunny',
  },
];

export default function App() {
  // ═══ 1. وضع العرض (Mobile View vs Desktop View) ═══
  const [isMobileMode, setIsMobileMode] = useState<boolean>(true); // وضع الهاتف الذكي الافتراضي لكروم
  const [isTabSwitcherOpen, setIsTabSwitcherOpen] = useState<boolean>(false);

  // ═══ 2. أوضاع بحث جوجل (Google SERP Modes) ═══
  const [activeSearchMode, setActiveSearchMode] = useState<
    'all' | 'ai' | 'videos' | 'images' | 'shorts' | 'news' | 'apps' | 'books' | 'pdf'
  >('all');
  const [isAiOverviewExpanded, setIsAiOverviewExpanded] = useState<boolean>(true);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [moreVideosCount, setMoreVideosCount] = useState<number>(3);
  const [moreAppsCount, setMoreAppsCount] = useState<number>(3);

  // ═══ 3. قاعدة بيانات التخزين ونافذة الموافقة والاعتماد ═══
  const [databaseApproved, setDatabaseApproved] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_database_approved');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });
  const [isDbApprovalModalOpen, setIsDbApprovalModalOpen] = useState<boolean>(false);

  // ═══ 4. سجل الفيديوهات المشاهدة المحفوظة للمشاهدة بدون إنترنت ═══
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

  // ═══ 5. Free VPN الدائم والمستقر في الخلفية ═══
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_vpn_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [selectedVpn, setSelectedVpn] = useState<VpnServerInfo>(AVAILABLE_VPN_SERVERS[0]);
  const [vpnBytesProtected, setVpnBytesProtected] = useState<number>(14.85);
  const [isVpnModalOpen, setIsVpnModalOpen] = useState<boolean>(false);

  // ═══ 6. وضع توفير البيانات الذكي والسرعة الفائقة ═══
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anwer_data_saver');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });
  const [networkSpeedTier, setNetworkSpeedTier] = useState<string>('فائقة (Turbo Stream)');
  const [savedDataMB, setSavedDataMB] = useState<number>(8.4);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);

  // ═══ 7. التبويبات والملاحة (Chrome Multi-Process Navigation) ═══
  const [tabs, setTabs] = useState<TabItem[]>([
    {
      id: 'tab_1',
      pid: 101,
      title: 'songs - بحث Google',
      url: 'https://www.google.com/search?q=songs',
      history: ['https://www.google.com/search?q=songs'],
      historyIndex: 0,
      loading: false,
      isCrashed: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('google.com/search?q=songs');
  const [searchQuery, setSearchQuery] = useState<string>('songs');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // شريط الإشارات المرجعية
  const [showBookmarksBar, setShowBookmarksBar] = useState<boolean>(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const raw = localStorage.getItem('anwer_bookmarks');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: 'b_1', title: 'Google بحث', url: 'https://www.google.com' },
      { id: 'b_2', title: 'YouTube أغاني', url: 'https://www.youtube.com' },
      { id: 'b_3', title: 'Spotify Web', url: 'https://open.spotify.com' },
      { id: 'b_4', title: 'ويكيبيديا', url: 'https://ar.wikipedia.org' },
    ];
  });

  // البحث والتصفية في سجل التصفح
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterCategory, setHistoryFilterCategory] = useState<'all' | 'searches' | 'domains'>('all');

  const [historyList, setHistoryList] = useState<Array<{ title: string; url: string; time: string }>>(() => {
    try {
      const raw = localStorage.getItem('anwer_history');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { title: 'songs - بحث Google', url: 'https://www.google.com/search?q=songs', time: '12:30 م' },
      { title: 'BEST SONGS OF ALL TIME - Spotify', url: 'https://open.spotify.com', time: '12:28 م' },
    ];
  });

  const [downloadsList, setDownloadsList] = useState<DownloadItem[]>([
    {
      id: 'd_1',
      filename: 'songs-playlist.m3u',
      url: 'https://anwerbrowser.local',
      size: '1.2 MB',
      status: 'completed',
      time: 'اليوم 12:20 م',
    },
  ]);

  // الملف الشخصي والمزامنة
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem('anwer_profile');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      isLoggedIn: true,
      email: 'anwer@gmail.com',
      name: 'أنور القرشي',
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

  // استخراج كلمة البحث الحالية من الرابط
  const getCurrentSearchQuery = (): string => {
    try {
      if (activeTab.url.includes('google.com/search')) {
        const u = new URL(activeTab.url);
        return u.searchParams.get('q') || searchQuery || 'songs';
      }
    } catch {}
    return searchQuery || 'songs';
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
      if (conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
        setDataSaver(true);
        setNetworkSpeedTier('شبكة ضعيفة (توفير فائق مفعّل)');
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // مزامنة شريط العناوين
  useEffect(() => {
    setUrlInput(activeTab.url.replace(/^https?:\/\//, ''));
  }, [activeTab.url, activeTabId]);

  // حفظ الإشارات والسجلات محلياً
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

  // استهلاك بيانات التشفير المحمية
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

    showToast(`🎬 تشغيل وحفظ الفيديو للمشاهدة بدون إنترنت: ${video.title.slice(0, 30)}...`);
  };

  // تشغيل رابط فيديو مخصص
  const handlePlayCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVideoUrlInput.trim()) return;

    const newVid: VideoRecord = {
      id: `vid_custom_${Date.now()}`,
      title: customVideoTitleInput.trim() || 'فيديو تم تشغيله من الرابط المباشر',
      streamUrl: customVideoUrlInput.trim(),
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      duration: 'مباشر',
      playedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isCachedOffline: true,
      pageUrl: customVideoUrlInput.trim(),
    };

    setCustomVideoUrlInput('');
    setCustomVideoTitleInput('');
    handlePlayVideo(newVid);
  };

  // اعتماد وموافقة قاعدة البيانات
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

  const handleDeleteVideoRecord = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoWatchHistory((prev) => prev.filter((v) => v.id !== videoId));
    showToast('تم حذف الفيديو من السجل');
  };

  const handleClearAllVideos = () => {
    setVideoWatchHistory([]);
    showToast('تم مسح مكتبة الفيديوهات المحفوظة');
  };

  const handleChangePlaybackRate = (rate: number) => {
    setVideoPlaybackRate(rate);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = rate;
    }
  };

  // البحث الصوتي الذكي (Voice Search)
  const handleVoiceSearch = () => {
    setIsVoiceListening(true);
    showToast('🎤 جاري الاستماع لصوتك... قل كلمة البحث');
    setTimeout(() => {
      setIsVoiceListening(false);
      navigateCurrentTab('songs');
      showToast('🔍 تم التعرف على الصوت: "songs"');
    }, 2500);
  };

  // ═══ قائمة العمليات النشطة لمدير مهام المتصفح (Chrome Task Manager) ═══
  const getActiveProcesses = (): ProcessItem[] => {
    const coreProcesses: ProcessItem[] = [
      { pid: 1, type: 'browser', name: 'Browser (العملية الرئيسية وواجهة Chrome)', memoryMB: 148, cpuPercent: 1.2 },
      { pid: 2, type: 'gpu', name: 'GPU Process (Viz الرسوميات وتسريع الفيديو)', memoryMB: 94, cpuPercent: 2.4 },
      { pid: 3, type: 'network', name: 'Network Service (Google SERP Engine & Fast Cache)', memoryMB: 42, cpuPercent: 0.5 },
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

  // تنقية الرابط من معاملات التتبع الإعلانية
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

  // ═══ التنقل الذكي فائق السرعة مع محرك بحث جوجل المدمج ═══
  const navigateCurrentTab = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    let targetUrl: string;
    let newTitle: string;
    const isDirectVideoUrl = /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(trimmed);

    if (trimmed.startsWith('g ') || trimmed.startsWith('google ')) {
      const q = trimmed.replace(/^(g|google)\s+/, '');
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      newTitle = `${q} - بحث Google`;
      setSearchQuery(q);
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      targetUrl = trimmed;
      newTitle = trimmed.replace(/^https?:\/\//, '').split('/')[0];
    } else if (trimmed.includes('.') && !trimmed.includes(' ')) {
      targetUrl = `https://${trimmed}`;
      newTitle = trimmed;
    } else {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
      newTitle = `${trimmed} - بحث Google`;
      setSearchQuery(trimmed);
    }

    if (vpnEnabled) {
      targetUrl = sanitizeUrlTracking(targetUrl);
    }

    if (isDirectVideoUrl) {
      handlePlayVideo({
        id: `vid_${Date.now()}`,
        title: targetUrl.split('/').pop() || 'فيديو مباشر',
        streamUrl: targetUrl,
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
        duration: 'مباشر',
        playedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        isCachedOffline: true,
        pageUrl: targetUrl,
      });
      return;
    }

    setUrlInput(targetUrl.replace(/^https?:\/\//, ''));

    setHistoryList((prev) => [
      {
        title: newTitle,
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
          title: newTitle,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          loading: true,
          isCrashed: false,
        };
      })
    );

    const loadDelay = dataSaver ? 60 : 250;
    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, loading: false } : t))
      );
    }, loadDelay);
  };

  // التحكم بالتبويبات
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
    setIsTabSwitcherOpen(false);
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
    }, dataSaver ? 60 : 250);
  };

  const goHome = () => {
    navigateCurrentTab('https://www.google.com/search?q=songs');
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

  const handleDeleteHistoryItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryList((prev) => prev.filter((_, i) => i !== index));
    showToast('تم حذف العنصر من السجل');
  };

  const handleClearAllHistory = () => {
    setHistoryList([]);
    showToast('تم مسح سجل التصفح بالكامل');
  };

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

  const currentSearchTerm = getCurrentSearchQuery();

  return (
    <div
      className="flex flex-col h-screen w-screen bg-[#F1F3F4] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED] font-sans select-none overflow-hidden"
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════════════
          أزرار التحكم العلوية والتبديل بين وضع الهاتف ووضع سطح المكتب
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between h-9 px-3 bg-[#1A73E8] text-white text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight">AnwerBrowser Chrome Engine</span>
          <span className="text-blue-200">|</span>
          <button
            type="button"
            onClick={() => setIsMobileMode((prev) => !prev)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 transition cursor-pointer font-bold"
            title="التبديل بين واجهة كروم للهاتف وواجهة سطح المكتب"
          >
            {isMobileMode ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span>{isMobileMode ? 'وضع هاتف كروم (Mobile UI)' : 'وضع سطح المكتب (Desktop UI)'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* مؤشر WireGuard VPN الدائم */}
          <button
            type="button"
            onClick={() => setIsVpnModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-200 hover:text-white"
          >
            <Shield className="w-3 h-3 text-emerald-300" />
            <span>VPN {selectedVpn.flag} نشط</span>
          </button>

          {/* مؤشر قاعدة البيانات */}
          <button
            type="button"
            onClick={() => setIsDbApprovalModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-100 hover:text-white"
          >
            <Database className="w-3 h-3 text-blue-200" />
            <span>قاعدة البيانات: معتمدة ✅</span>
          </button>

          {/* مكتبة الفيديوهات */}
          <button
            type="button"
            onClick={() => setIsOfflineVideosDrawerOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-200 hover:text-white"
          >
            <Film className="w-3 h-3 text-rose-300" />
            <span>الفيديوهات ({videoWatchHistory.length})</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          الحاوية الرئيسية: تصميم الهاتف الذكي (Mobile Chrome Frame)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`flex-1 flex flex-col overflow-hidden mx-auto transition-all ${
          isMobileMode
            ? 'w-full max-w-md my-1 rounded-3xl shadow-2xl border-4 border-[#2B2D30] bg-white dark:bg-[#202124]'
            : 'w-full h-full'
        }`}
      >
        {/* 1. أزرار النظام في هاتف كروم (Status Bar: Time, Wifi, Battery, VPN) */}
        {isMobileMode && (
          <div className="flex items-center justify-between h-6 px-4 bg-[#F8F9FA] dark:bg-[#1E1F22] text-[#5F6368] dark:text-[#9AA0A6] text-[11px] font-mono border-b border-gray-200 dark:border-gray-800 shrink-0">
            <span className="font-bold text-gray-800 dark:text-gray-200">12:30</span>
            <div className="flex items-center gap-2">
              <span title="VPN مشفر 256-bit نشط"><Key className="w-3 h-3 text-emerald-600" /></span>
              <Wifi className="w-3 h-3 text-blue-600" />
              <span className="font-bold">5G</span>
              <span className="text-[10px] font-bold">100%</span>
            </div>
          </div>
        )}

        {/* 2. الطبقة العليا: واجهة متصفح كروم (Chrome UI Top Bar) */}
        <div className="flex items-center h-12 px-2 bg-[#F8F9FA] dark:bg-[#1E1F22] border-b border-[#E0E2E6] dark:border-[#3C4043] gap-1.5 shrink-0">
          {/* زر الصفحة الرئيسية (🏠) */}
          <button
            type="button"
            onClick={goHome}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5F6368] dark:text-[#9AA0A6] transition cursor-pointer shrink-0"
            title="الصفحة الرئيسية (Home)"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* شريط العنوان (Omnibox) مع الرابط المباشر */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateCurrentTab(urlInput);
            }}
            className="flex-1 flex items-center h-9 px-3 bg-white dark:bg-[#2B2D30] rounded-full border border-gray-200 dark:border-gray-700 shadow-2xs text-xs gap-2 overflow-hidden"
          >
            <span title="اتصال مشفر وآمن (HTTPS)">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            </span>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="google.com/search?q=..."
              className="flex-1 bg-transparent text-xs text-[#202124] dark:text-[#E8EAED] focus:outline-none dir-ltr text-left font-mono truncate"
            />

            <button
              type="button"
              onClick={reloadTab}
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 transition"
              title="إعادة تحميل"
            >
              <RotateCw className={`w-3.5 h-3.5 ${activeTab.loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </form>

          {/* علامة التبويب (Tab): مربع يعرض رقم التبويبات المفتوحة [1] أو [N] كمتصفح كروم */}
          <button
            type="button"
            onClick={() => setIsTabSwitcherOpen((prev) => !prev)}
            className="w-7 h-7 rounded-lg border-2 border-[#5F6368] dark:border-[#9AA0A6] flex items-center justify-center font-bold text-xs text-[#5F6368] dark:text-[#9AA0A6] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
            title="التبويبات المفتوحة (Tab Switcher)"
          >
            <span>{tabs.length}</span>
          </button>

          {/* زر +: لفتح تبويب جديد فورياً */}
          <button
            type="button"
            onClick={() => createNewTab('https://www.google.com/search?q=songs')}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5F6368] dark:text-[#9AA0A6] transition cursor-pointer shrink-0"
            title="فتح تبويب جديد (+)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* قائمة النقاط الثلاث (⋮): قائمة إعدادات المتصفح */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5F6368] dark:text-[#9AA0A6] transition cursor-pointer"
              title="قائمة إعدادات كروم"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#2B2D30] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs text-right"
                onClick={() => setIsMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => createNewTab('https://www.google.com/search?q=songs')}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between"
                >
                  <span>علامة تبويب جديدة</span>
                  <span className="text-[10px] text-gray-400">Ctrl+T</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOfflineVideosDrawerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-rose-600 font-bold"
                >
                  <span>مكتبة الفيديوهات المحفوظة</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-mono">
                    {videoWatchHistory.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDbApprovalModalOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-blue-600 font-bold"
                >
                  <span>اعتماد قاعدة البيانات للتخزين</span>
                  <span className="text-[10px]">{databaseApproved ? 'معتمدة ✅' : 'مطلوبة ⚠️'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between"
                >
                  <span>السجل والبحث المباشر</span>
                  <span className="text-[10px] text-gray-400">Ctrl+H</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDownloadsDrawerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between"
                >
                  <span>التنزيلات</span>
                  <span className="text-[10px] text-gray-400">Ctrl+J</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaskManagerOpen(true)}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-purple-600 font-semibold"
                >
                  <span>مدير مهام المتصفح</span>
                  <span className="text-[10px] text-gray-400">Shift+Esc</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* شبكة التبويبات عند الضغط على مربع [1] (Tab Switcher Grid) */}
        {isTabSwitcherOpen && (
          <div className="p-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2 text-xs font-bold">
              <span>التبويبات المفتوحة ({tabs.length})</span>
              <button
                type="button"
                onClick={() => createNewTab('https://www.google.com/search?q=songs')}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تبويب جديد</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {tabs.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTabId(t.id);
                    setIsTabSwitcherOpen(false);
                  }}
                  className={`p-2 rounded-xl border text-xs cursor-pointer relative transition flex flex-col justify-between ${
                    t.id === activeTabId
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold truncate text-[11px]">{t.title}</span>
                    <button
                      type="button"
                      onClick={(e) => closeTab(t.id, e)}
                      className="p-0.5 rounded-full hover:bg-black/10 text-gray-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono truncate dir-ltr text-left">
                    {t.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            3. واجهة محرك بحث جوجل (Google SERP Engine)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#202124]">
          {/* أ) رأس الصفحة (Google Header) */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            {/* شعار Google بألوانه الرسمية */}
            <div
              onClick={() => navigateCurrentTab('https://www.google.com/search?q=songs')}
              className="cursor-pointer select-none font-bold text-xl tracking-tight flex items-center"
            >
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </div>

            <div className="flex items-center gap-3">
              {/* أيقونة الجرس (🔔): الإشعارات */}
              <button
                type="button"
                onClick={() => showToast('🔔 لا توجد إشعارات جديدة في حسابك')}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 relative cursor-pointer"
                title="إشعارات Google"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1" />
              </button>

              {/* صورة الحساب (Avatar): إدارة حساب Google */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-300 dark:ring-blue-800 cursor-pointer"
                title="حساب Google"
              >
                <span>A</span>
              </button>
            </div>
          </div>

          {/* ب) مربع البحث (Search Box) */}
          <div className="p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigateCurrentTab(searchQuery);
              }}
              className="flex items-center h-11 px-3.5 rounded-full bg-white dark:bg-[#303134] border border-gray-200 dark:border-transparent shadow-sm hover:shadow-md focus-within:shadow-md transition gap-2"
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في Google..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#202124] dark:text-white focus:outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="مسح"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* أيقونة الميكروفون (🎤): البحث الصوتي */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isVoiceListening ? 'text-red-500 animate-pulse bg-red-50' : 'text-[#4285F4] hover:bg-blue-50 dark:hover:bg-white/10'
                }`}
                title="البحث الصوتي (Microphone)"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* أيقونة عدسة Google (Google Lens 📷) */}
              <button
                type="button"
                onClick={() => showToast('📷 عدسة Google Lens: جاري فحص الصورة المرفقة')}
                className="p-1 text-[#EA4335] hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition cursor-pointer"
                title="عدسة Google Lens"
              >
                <Camera className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* ج) شريط التصنيفات (أوضاع البحث - Search Modes Carousel) */}
          <div className="px-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: 'الكل', icon: <Search className="w-3.5 h-3.5" /> },
              { id: 'ai', label: 'وضع AI', icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />, badge: 'جديد' },
              { id: 'videos', label: 'فيديوهات', icon: <Film className="w-3.5 h-3.5 text-rose-500" /> },
              { id: 'images', label: 'صور', icon: <Image className="w-3.5 h-3.5 text-blue-500" /> },
              { id: 'shorts', label: 'فيديوهات قصيرة', icon: <Play className="w-3.5 h-3.5 text-red-500" /> },
              { id: 'news', label: 'أخبار', icon: <Globe className="w-3.5 h-3.5 text-emerald-500" /> },
              { id: 'apps', label: 'تطبيقات', icon: <Smartphone className="w-3.5 h-3.5 text-indigo-500" /> },
              { id: 'books', label: 'كتب', icon: <Folder className="w-3.5 h-3.5 text-amber-500" /> },
              { id: 'pdf', label: 'PDF', icon: <Terminal className="w-3.5 h-3.5 text-gray-500" /> },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveSearchMode(mode.id as any)}
                className={`py-2 px-3 border-b-2 font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeSearchMode === mode.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {mode.icon}
                <span>{mode.label}</span>
                {mode.badge && (
                  <span className="px-1 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold">
                    {mode.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* د) محتوى الصفحة (النتائج المتخصصة والذكية) */}
          <div className="p-3 space-y-4">
            {/* 1. نظرة عامة بالذكاء الاصطناعي (AI Overview - Gemini Card) */}
            {(activeSearchMode === 'all' || activeSearchMode === 'ai') && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-300">
                      نظرة عامة مدعومة بالذكاء الاصطناعي (AI Overview)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiOverviewExpanded((p) => !p)}
                    className="text-[11px] text-purple-700 dark:text-purple-400 font-bold"
                  >
                    {isAiOverviewExpanded ? 'تصغير' : 'عرض'}
                  </button>
                </div>

                {isAiOverviewExpanded && (
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">
                    <p>
                      نتائج البحث عن <strong>&ldquo;{currentSearchTerm}&rdquo;</strong> تُظهر مزيجاً من أشهر الأغاني الكلاسيكية والحديثة عبر مختلف المنصات (Spotify و YouTube و Apple Music).
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <li>الأغاني الأكثر استماعاً حالياً: Lewis Capaldi، Harry Styles، The Weeknd.</li>
                      <li>تتوفر التطبيقات المخصصة للاستماع المباشر في قسم التطبيقات أدناه.</li>
                      <li>يمكنك تشغيل أي فيديو مباشرة داخل المتصفح وحفظه لمشاهدته بدون إنترنت.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 2. قسم الفيديوهات (Videos Section) */}
            {(activeSearchMode === 'all' || activeSearchMode === 'videos') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">فيديوهات</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('خيارات قسم الفيديوهات')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* بطاقات الفيديوهات (Video Cards) */}
                <div className="space-y-3">
                  {SAMPLE_VIDEOS.slice(0, moreVideosCount).map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => handlePlayVideo(vid)}
                      className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition cursor-pointer flex gap-3 group bg-white dark:bg-[#2B2D30]"
                    >
                      {/* الصورة المصغرة (Thumbnail) ومدة الفيديو وزر التشغيل */}
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-black shrink-0">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-white font-mono text-[9px]">
                          {vid.duration}
                        </span>
                      </div>

                      {/* تفاصيل الفيديو: العنوان، القناة، التاريخ */}
                      <div className="flex-1 flex flex-col justify-between truncate">
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition">
                            {vid.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {vid.channel || 'YouTube'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>{vid.playedAt}</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            تشغيل وحفظ أوفلاين
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* زر "المزيد من الفيديوهات" (Lazy Loading) */}
                <button
                  type="button"
                  onClick={() => {
                    setMoreVideosCount((c) => Math.min(SAMPLE_VIDEOS.length, c + 2));
                    showToast('تم تحميل المزيد من الفيديوهات');
                  }}
                  className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 text-xs font-bold text-blue-600 transition"
                >
                  المزيد من الفيديوهات ⬇️
                </button>
              </div>
            )}

            {/* 3. قسم التطبيقات (Apps Section - Google Play Store) */}
            {(activeSearchMode === 'all' || activeSearchMode === 'apps') && (
              <div className="space-y-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">تطبيقات (Apps)</h3>
                  </div>
                  <span className="text-[10px] text-gray-400">متجر Google Play</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      name: 'Shazam: Music Discovery',
                      desc: 'التعرف على الأغاني والموسيقى',
                      rating: '4.6',
                      reviews: '12,230,126',
                      icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80',
                    },
                    {
                      name: 'Spotify: Music and Podcasts',
                      desc: 'استماع وتحميل الأغاني',
                      rating: '4.5',
                      reviews: '31,450,890',
                      icon: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&q=80',
                    },
                    {
                      name: 'YouTube Music',
                      desc: 'بث الموسيقى والفيديوهات الرسمية',
                      rating: '4.4',
                      reviews: '8,920,410',
                      icon: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&q=80',
                    },
                  ].slice(0, moreAppsCount).map((app, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={app.icon}
                          alt={app.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div className="truncate">
                          <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white">
                            {app.name}
                          </h4>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span className="text-amber-500 font-bold flex items-center">
                              ⭐ {app.rating}
                            </span>
                            <span>•</span>
                            <span>{app.reviews}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast(`تم تثبيت ${app.name} عبر AnwerBrowser`)}
                        className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                      >
                        تثبيت
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => showToast('عرض المزيد من تطبيقات الموسيقى')}
                  className="w-full py-2 rounded-xl text-center text-xs font-semibold text-blue-600 hover:underline"
                >
                  المزيد من التطبيقات ⬇️
                </button>
              </div>
            )}

            {/* 4. نتائج الويب العضوية (Web Results) */}
            {(activeSearchMode === 'all' || activeSearchMode === 'news') && (
              <div className="space-y-4">
                {[
                  {
                    domain: 'open.spotify.com',
                    path: 'playlist > best-songs',
                    title: 'THE BEST SONGS OF ALL TIME - Spotify Playlist',
                    snippet:
                      'استمع إلى أشهر الأغاني عبر التاريخ في قائمة التشغيل الرسمية. تتضمن أغاني البوب، الروك، والأغاني الهادئة الأكثر تشغيلاً عالمياً.',
                  },
                  {
                    domain: 'en.wikipedia.org',
                    path: 'wiki > List_of_best-selling_singles',
                    title: 'List of best-selling singles and greatest songs - Wikipedia',
                    snippet:
                      'قائمة بالأغاني الأكثر مبيعاً والأعلى استماعاً عالمياً عبر كل العصور، مع تفاصيل الإصدارات والشهادات الموسيقية.',
                  },
                  {
                    domain: 'billboard.com',
                    path: 'charts > hot-100',
                    title: 'Billboard Hot 100™ - Top 100 Songs Chart of the Week',
                    snippet:
                      'قائمة بيلبورد هوت 100 الأسبوعية لأفضل وأشهر 100 أغنية في العالم مع نسب البث المباشر والمبيعات الرقمية.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateCurrentTab(`https://${item.domain}`)}
                    className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group bg-white dark:bg-[#202124]"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-[9px]">
                        🌐
                      </div>
                      <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">
                        {item.domain}
                      </span>
                      <span>›</span>
                      <span className="text-gray-400 truncate">{item.path}</span>
                    </div>

                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 group-hover:underline mb-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 5. قسم "تم البحث أيضًا عن" (Related Searches) */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 space-y-2">
              <h3 className="font-bold text-xs text-gray-700 dark:text-gray-300">
                تم البحث أيضًا عن (Related Searches)
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'A lot of songs',
                  'Songs English',
                  'Songs popular 2026',
                  'أغاني حماسية جديدة',
                  'Best acoustic songs',
                  'Songs top 50 global',
                ].map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term);
                      navigateCurrentTab(term);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-[#2B2D30] border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:border-blue-500 hover:text-blue-600 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Search className="w-3 h-3 text-gray-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          مشغل الفيديو المدمج (Video Player Modal)
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

            <div className="p-4 bg-[#242526] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-bold">محفوظ في السجل للمشاهدة بدون إنترنت 💾</span>
                <span className="text-gray-400 text-[11px] font-mono">({currentPlayingVideo.duration})</span>
              </div>

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

              <button
                type="button"
                onClick={() => {
                  setIsOfflineVideosDrawerOpen(true);
                  setIsVideoPlayerOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span>مكتبة الفيديوهات المحفوظة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          درج مكتبة الفيديوهات المحفوظة للمشاهدة بدون نت
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

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {videoWatchHistory.map((vid) => (
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
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-md"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          نافذة الموافقة واعتماد قاعدة البيانات للتخزين
      ═══════════════════════════════════════════════════════════════ */}
      {isDbApprovalModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDbApprovalModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col text-right"
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
                className="p-1.5 rounded-full hover:bg-black/10 text-gray-400"
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

      {/* درج السجل والتصفية */}
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
                  سجل التصفح والبحث ({filteredHistory.length})
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
                  المواقع 🌐
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredHistory.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    navigateCurrentTab(h.url);
                    setIsHistoryDrawerOpen(false);
                  }}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="truncate flex-1 pl-2 text-right">
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* مدير مهام كروم (Task Manager) */}
      {isTaskManagerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsTaskManagerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col text-right"
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
                بنية متعددة العمليات (Multi-Process Architecture): عزل تام بين المواقع وتشغيل الفيديو
              </span>
              <button
                type="button"
                disabled={!selectedProcessPid}
                onClick={() => selectedProcessPid && handleKillProcess(selectedProcessPid)}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs"
              >
                إنهاء العملية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة Free VPN */}
      {isVpnModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
          onClick={() => setIsVpnModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#2B2D30] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col text-right"
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

      {/* نافذة الملف الشخصي */}
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
              {userProfile.isLoggedIn ? userProfile.name : 'مستخدم Google'}
            </h3>
            <p className="text-[11px] text-gray-500 mb-4">
              {userProfile.isLoggedIn ? userProfile.email : 'المزامنة السحابية وقاعدة البيانات نشطة'}
            </p>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
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
