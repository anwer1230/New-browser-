/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  BookOpen,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════
// 1. نماذج بيانات المحرك البرمجي والعمليات المتعددة (Engine Data Models)
// ══════════════════════════════════════════════════════════════════════

export type SearchIntent =
  | 'media_music'
  | 'video_streaming'
  | 'apps_tools'
  | 'research_books_pdf'
  | 'informational_ai'
  | 'news_current'
  | 'general_web';

export interface ParsedQuery {
  raw: string;
  clean: string;
  isUrl: boolean;
  targetUrl?: string;
  filetype?: string;
  intents: SearchIntent[];
}

export interface VideoItem {
  id: string;
  title: string;
  channel: string;
  streamUrl: string;
  thumbnail: string;
  duration: string;
  views: string;
  date: string;
  isCachedOffline: boolean;
}

export interface AppItem {
  id: string;
  name: string;
  developer: string;
  category: string;
  rating: number;
  reviewsCount: string;
  icon: string;
  installed?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  author: string;
  format: 'PDF' | 'EPUB' | 'DOC';
  size: string;
  snippet: string;
  url: string;
}

export interface WebResultItem {
  id: string;
  title: string;
  domain: string;
  path: string;
  url: string;
  snippet: string;
}

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
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
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

// ══════════════════════════════════════════════════════════════════════
// 2. الآلية البرمجية 1: تحليل الاستعلام (Query Parsing & Normalization)
// ══════════════════════════════════════════════════════════════════════

function parseAndAnalyzeQuery(raw: string): ParsedQuery {
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  // فحص ما إذا كان المدخل رابط ويب مباشر
  const isDirectUrl =
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    (clean.includes('.') && !clean.includes(' ') && !clean.includes('filetype:'));

  let filetype: string | undefined;
  const ftMatch = lower.match(/filetype:([a-z0-9]+)/);
  if (ftMatch) {
    filetype = ftMatch[1].toUpperCase();
  }

  // ══════════════════════════════════════════════════════════════════════
  // الآلية البرمجية 2: فهم النية وتصنيفها (Intent Classification)
  // ══════════════════════════════════════════════════════════════════════
  const intents: SearchIntent[] = [];

  // نية الوسائط والموسيقى
  if (
    lower.includes('song') ||
    lower.includes('music') ||
    lower.includes('أغاني') ||
    lower.includes('اغنية') ||
    lower.includes('موسيقى') ||
    lower.includes('ألبوم') ||
    lower.includes('mp3') ||
    lower.includes('استماع') ||
    lower.includes('playlist')
  ) {
    intents.push('media_music');
    intents.push('video_streaming');
    intents.push('apps_tools');
  }

  // نية الفيديو والبث
  if (
    lower.includes('video') ||
    lower.includes('فيديو') ||
    lower.includes('مشاهدة') ||
    lower.includes('كليب') ||
    lower.includes('شرح') ||
    lower.includes('يوتيوب') ||
    lower.includes('youtube') ||
    lower.includes('فيلم') ||
    lower.includes('stream') ||
    lower.includes('watch')
  ) {
    if (!intents.includes('video_streaming')) intents.push('video_streaming');
  }

  // نية التطبيقات والأدوات
  if (
    lower.includes('app') ||
    lower.includes('تطبيق') ||
    lower.includes('برنامج') ||
    lower.includes('apk') ||
    lower.includes('download app') ||
    lower.includes('متجر') ||
    lower.includes('store')
  ) {
    if (!intents.includes('apps_tools')) intents.push('apps_tools');
  }

  // نية الكتب والملفات والأبحاث
  if (
    lower.includes('pdf') ||
    lower.includes('book') ||
    lower.includes('كتاب') ||
    lower.includes('رواية') ||
    lower.includes('بحث') ||
    lower.includes('أطروحة') ||
    filetype !== undefined
  ) {
    intents.push('research_books_pdf');
  }

  // نية الأخبار
  if (
    lower.includes('news') ||
    lower.includes('خبر') ||
    lower.includes('أخبار') ||
    lower.includes('عاجل') ||
    lower.includes('اليوم')
  ) {
    intents.push('news_current');
  }

  // النوايا الافتراضية العامة
  if (!intents.includes('informational_ai')) intents.push('informational_ai');
  if (!intents.includes('general_web')) intents.push('general_web');

  return {
    raw,
    clean,
    isUrl: isDirectUrl,
    targetUrl: isDirectUrl ? (clean.startsWith('http') ? clean : `https://${clean}`) : undefined,
    filetype,
    intents,
  };
}

// ══════════════════════════════════════════════════════════════════════
// 3. الآلية البرمجية 3: البحث العمودي (Vertical Search Aggregation)
// ══════════════════════════════════════════════════════════════════════

function generateVerticalResults(query: string, intents: SearchIntent[]) {
  const q = query.trim() || 'songs';

  // أ) البحث العمودي في قاعدة بيانات الفيديوهات (Videos Vertical)
  const allVideos: VideoItem[] = [
    {
      id: 'v_1',
      title: `${q.toUpperCase()} - THE BEST SONGS & HITS OF ALL TIME`,
      channel: 'Lewis Capaldi · YouTube',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      duration: '16:26',
      views: '42.8M مشاهدة',
      date: '2026/07/06',
      isCachedOffline: true,
    },
    {
      id: 'v_2',
      title: `Top ${q} Mix 2026 - Official Streaming & Visualizer`,
      channel: 'Vevo Global · YouTube',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
      duration: '1:58:13',
      views: '18.4M مشاهدة',
      date: 'منذ أسبوعين',
      isCachedOffline: true,
    },
    {
      id: 'v_3',
      title: `دليل شامل وشرح تفصيلي حول: ${q}`,
      channel: 'Tech Explorer · YouTube',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
      duration: '10:54',
      views: '5.2M مشاهدة',
      date: 'قبل 3 أيام',
      isCachedOffline: true,
    },
    {
      id: 'v_4',
      title: `أروع المقاطع الصوتية والحماسية ذات الصلة بـ ${q}`,
      channel: 'Blender Studio · YouTube',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
      duration: '09:56',
      views: '9.1M مشاهدة',
      date: 'قبل 5 أيام',
      isCachedOffline: true,
    },
    {
      id: 'v_5',
      title: `البث الحي المباشر للأعمال المميزة: ${q} Live Special`,
      channel: 'BBC Music · YouTube',
      streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
      duration: '24:18',
      views: '3.6M مشاهدة',
      date: 'أمس',
      isCachedOffline: true,
    },
  ];

  // ب) البحث العمودي في متجر التطبيقات (Apps Vertical - Google Play)
  const allApps: AppItem[] = [
    {
      id: 'app_1',
      name: 'Shazam: Music Discovery',
      developer: 'Apple Inc.',
      category: 'موسيقى وصوت',
      rating: 4.6,
      reviewsCount: '12,230,126',
      icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80',
    },
    {
      id: 'app_2',
      name: 'Spotify: Music and Podcasts',
      developer: 'Spotify AB',
      category: 'استماع وبث',
      rating: 4.5,
      reviewsCount: '31,450,890',
      icon: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&q=80',
    },
    {
      id: 'app_3',
      name: 'YouTube Music Player',
      developer: 'Google LLC',
      category: 'فيديو وموسيقى',
      rating: 4.4,
      reviewsCount: '8,920,410',
      icon: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&q=80',
    },
    {
      id: 'app_4',
      name: 'SoundCloud: Play Music & Songs',
      developer: 'SoundCloud Global',
      category: 'مكتبة صوتية',
      rating: 4.3,
      reviewsCount: '6,150,000',
      icon: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80',
    },
  ];

  // ج) البحث العمودي في الكتب والأبحاث وملفات PDF (Books & PDF Vertical)
  const allDocuments: DocumentItem[] = [
    {
      id: 'doc_1',
      title: `كتاب ودراسة شاملة حول تاريخ وتطور: ${q}`,
      author: 'د. أحمد الشريف',
      format: 'PDF',
      size: '4.8 MB',
      snippet: `تحليل منهجي وتاريخي متعمق يستعرض نشأة ${q} وأبرز المراحل التحولية والتأثير الثقافي.`,
      url: 'https://anwerbrowser.local/library/study.pdf',
    },
    {
      id: 'doc_2',
      title: `الموسوعة الكاملة والمراجع المفتوحة: ${q} Edition`,
      author: 'مؤسسة المعرفة الحرة',
      format: 'PDF',
      size: '12.2 MB',
      snippet: `ملف بصيغة PDF يضم فهرساً شاملاً وتوثيقاً مفصلاً لكافة المفاهيم المرتبطة بـ ${q}.`,
      url: 'https://anwerbrowser.local/library/encyclopedia.pdf',
    },
  ];

  // د) البحث العمودي في الويب (Organic Web Results Vertical)
  const allWebResults: WebResultItem[] = [
    {
      id: 'web_1',
      title: `THE BEST ${q.toUpperCase()} OF ALL TIME - Official Spotify Playlist`,
      domain: 'open.spotify.com',
      path: 'playlist > best-hits',
      url: 'https://open.spotify.com',
      snippet: `استمع إلى أشهر الأعمال المرتبطة بـ ${q} في قائمة التشغيل العالمية المحدثة لعام 2026. الملايين من المتابعين والبث المستمر.`,
    },
    {
      id: 'web_2',
      title: `${q} - Wikipedia, the free encyclopedia`,
      domain: 'en.wikipedia.org',
      path: `wiki > ${encodeURIComponent(q)}`,
      url: 'https://en.wikipedia.org',
      snippet: `تعريف شامل، تاريخي، وتقني حول ${q} مع توثيق المصادر والشهادات التقديرية والتصنيفات المعتمدة عالمياً.`,
    },
    {
      id: 'web_3',
      title: `Billboard Hot Global Charts - Top Rankings for ${q}`,
      domain: 'billboard.com',
      path: 'charts > global-100',
      url: 'https://billboard.com',
      snippet: `إحصاءات بيلبورد الأسبوعية، نسب المبيعات، ومعدلات البث الرقمي الأكثر شعبية لهذا الأسبوع.`,
    },
    {
      id: 'web_4',
      title: `BBC Culture & Entertainment: Deep Dive into ${q}`,
      domain: 'bbc.com',
      path: 'culture > article',
      url: 'https://bbc.com',
      snippet: `تحقيق صحفي وثقافي يتناول الظواهر الفنية والتقنية التي شكلت مشهد ${q} الحديث.`,
    },
  ];

  // هـ) النظرة العامة التوليدية (AI Overview Vertical)
  const aiOverview = {
    summary: `بناءً على تحليل الاستعلام "${q}"، تم تصنيف النية الأساسية كـ (${intents.join(', ')})، ويظهر توازن بين المحتوى الصوتي المرئي والتطبيقات المخصصة ومصادر الويب الموثوقة.`,
    keyPoints: [
      `تم ترتيب النتائج آلياً وفق الأهمية والشعبية الحالية لعام 2026.`,
      `يمكنك تشغيل أي فيديو مباشرة داخل المتصفح، وسيُحفظ تلقائياً في السجل للمشاهدة بدون إنترنت.`,
      `يتوفر قسم التطبيقات المباشرة لمتجر Google Play للوصول السريع إلى الأدوات ذات الصلة.`,
    ],
  };

  // و) الاقتراحات المترابطة (Related Searches)
  const relatedSearches = [
    `A lot of ${q}`,
    `${q} English 2026`,
    `${q} popular hits`,
    `أفضل ${q} لهذا العام`,
    `${q} download mp3`,
    `تطبيقات تشغيل ${q}`,
  ];

  return {
    videos: allVideos,
    apps: allApps,
    documents: allDocuments,
    webResults: allWebResults,
    aiOverview,
    relatedSearches,
  };
}

// ══════════════════════════════════════════════════════════════════════
// 4. المكون الرئيسي: AnwerBrowser
// ══════════════════════════════════════════════════════════════════════

export default function App() {
  // ═══ حالة التصفح والتبويبات ═══
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

  // ═══ الآلية البرمجية 6: التحميل التدريجي (Lazy Loading Engine) ═══
  const [videosVisibleCount, setVideosVisibleCount] = useState<number>(3);
  const [appsVisibleCount, setAppsVisibleCount] = useState<number>(3);
  const [webVisibleCount, setWebVisibleCount] = useState<number>(3);
  const [isAiOverviewExpanded, setIsAiOverviewExpanded] = useState<boolean>(true);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  // وضع التصفية النشط من شريط التصنيفات (Search Modes)
  const [selectedVertical, setSelectedVertical] = useState<
    'all' | 'ai' | 'videos' | 'images' | 'shorts' | 'news' | 'apps' | 'books' | 'pdf'
  >('all');

  // ═══ ميزات المتصفح الأساسية (Free VPN + Storage DB + Video Player) ═══
  const [databaseApproved, setDatabaseApproved] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('anwer_database_approved');
      if (s !== null) return s === 'true';
    } catch {}
    return true;
  });
  const [isDbApprovalModalOpen, setIsDbApprovalModalOpen] = useState<boolean>(false);

  const [videoWatchHistory, setVideoWatchHistory] = useState<VideoItem[]>(() => {
    try {
      const s = localStorage.getItem('anwer_video_watch_history');
      if (s) return JSON.parse(s);
    } catch {}
    return [];
  });

  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<VideoItem | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState<boolean>(false);
  const [isOfflineVideosDrawerOpen, setIsOfflineVideosDrawerOpen] = useState<boolean>(false);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState<number>(1);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Free VPN الدائم
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('anwer_vpn_enabled');
      if (s !== null) return s === 'true';
    } catch {}
    return true;
  });
  const [selectedVpn, setSelectedVpn] = useState<VpnServerInfo>(AVAILABLE_VPN_SERVERS[0]);
  const [vpnBytesProtected, setVpnBytesProtected] = useState<number>(14.85);
  const [isVpnModalOpen, setIsVpnModalOpen] = useState<boolean>(false);

  // توفير البيانات
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('anwer_data_saver');
      if (s !== null) return s === 'true';
    } catch {}
    return true;
  });

  // الإشارات والسجل
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
    { id: 'b_1', title: 'Google بحث', url: 'https://www.google.com' },
    { id: 'b_2', title: 'Spotify Web', url: 'https://open.spotify.com' },
    { id: 'b_3', title: 'YouTube أغاني', url: 'https://www.youtube.com' },
    { id: 'b_4', title: 'ويكيبيديا', url: 'https://ar.wikipedia.org' },
  ]);
  const [historyList, setHistoryList] = useState<Array<{ title: string; url: string; time: string }>>([
    { title: 'songs - بحث Google', url: 'https://www.google.com/search?q=songs', time: '12:30 م' },
  ]);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterCategory, setHistoryFilterCategory] = useState<'all' | 'searches' | 'domains'>('all');

  // النوافذ
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [selectedProcessPid, setSelectedProcessPid] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // استخراج وتحليل الاستعلام النشط
  const currentQueryParsed = useMemo(() => {
    let q = searchQuery || 'songs';
    if (activeTab.url.includes('google.com/search')) {
      try {
        const u = new URL(activeTab.url);
        q = u.searchParams.get('q') || q;
      } catch {}
    }
    return parseAndAnalyzeQuery(q);
  }, [searchQuery, activeTab.url]);

  // نتائج البحث العمودي المتخصصة (Vertical Results)
  const verticalData = useMemo(() => {
    return generateVerticalResults(currentQueryParsed.clean, currentQueryParsed.intents);
  }, [currentQueryParsed]);

  // مزامنة شريط العنوان
  useEffect(() => {
    setUrlInput(activeTab.url.replace(/^https?:\/\//, ''));
  }, [activeTab.url, activeTabId]);

  // حفظ الإعدادات محلياً
  useEffect(() => {
    try {
      localStorage.setItem('anwer_vpn_enabled', String(vpnEnabled));
      localStorage.setItem('anwer_data_saver', String(dataSaver));
      localStorage.setItem('anwer_database_approved', String(databaseApproved));
      localStorage.setItem('anwer_video_watch_history', JSON.stringify(videoWatchHistory));
    } catch {}
  }, [vpnEnabled, dataSaver, databaseApproved, videoWatchHistory]);

  // تشغيل وحفظ الفيديو أوفلاين
  const handlePlayVideo = (vid: VideoItem) => {
    setCurrentPlayingVideo(vid);
    setIsVideoPlayerOpen(true);
    setVideoPlaybackRate(1);

    setVideoWatchHistory((prev) => {
      const exists = prev.find((v) => v.id === vid.id || v.streamUrl === vid.streamUrl);
      const updated = {
        ...vid,
        date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        isCachedOffline: true,
      };
      if (exists) {
        return [updated, ...prev.filter((v) => v.id !== exists.id)];
      }
      return [updated, ...prev];
    });

    if (databaseApproved) {
      try {
        if ('storage' in navigator && 'persist' in navigator.storage) {
          navigator.storage.persist();
        }
      } catch {}
    }

    showToast(`🎬 تم تشغيل وحفظ الفيديو في السجل للمشاهدة بدون إنترنت: ${vid.title.slice(0, 30)}...`);
  };

  // الملاحة والتنقل
  const navigateCurrentTab = (input: string) => {
    const parsed = parseAndAnalyzeQuery(input);
    if (!parsed.clean) return;

    let targetUrl: string;
    let newTitle: string;

    if (parsed.isUrl && parsed.targetUrl) {
      targetUrl = parsed.targetUrl;
      newTitle = targetUrl.replace(/^https?:\/\//, '').split('/')[0];
    } else {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(parsed.clean)}`;
      newTitle = `${parsed.clean} - بحث Google`;
      setSearchQuery(parsed.clean);
      setVideosVisibleCount(3);
      setAppsVisibleCount(3);
      setWebVisibleCount(3);
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
        const nextHist = [...t.history.slice(0, t.historyIndex + 1), targetUrl];
        return {
          ...t,
          url: targetUrl,
          title: newTitle,
          history: nextHist,
          historyIndex: nextHist.length - 1,
          loading: true,
          isCrashed: false,
        };
      })
    );

    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, loading: false } : t))
      );
    }, dataSaver ? 60 : 250);
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

  // قائمة العمليات النشطة لمدير المهام
  const getActiveProcesses = (): ProcessItem[] => {
    const core: ProcessItem[] = [
      { pid: 1, type: 'browser', name: 'Browser (العملية الرئيسية وواجهة المستخدم)', memoryMB: 148, cpuPercent: 1.2 },
      { pid: 2, type: 'gpu', name: 'GPU Process (Viz تسريع الرسوميات والفيديو)', memoryMB: 94, cpuPercent: 2.4 },
      { pid: 3, type: 'network', name: 'Network Service (محرك البحث والاستعلام الفوري)', memoryMB: 42, cpuPercent: 0.5 },
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

    const tabProc: ProcessItem[] = tabs.map((t) => ({
      pid: t.pid,
      type: 'renderer',
      name: `Tab: ${t.title || t.url}`,
      memoryMB: t.isCrashed ? 0 : Math.floor(65 + (t.url.length % 50)),
      cpuPercent: t.loading ? 3.8 : 0.2,
      tabId: t.id,
    }));

    return [...core, ...tabProc];
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

  const isSearchPage = activeTab.url.includes('google.com/search');

  return (
    <div
      className="flex flex-col h-screen w-screen bg-[#F1F3F4] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED] font-sans select-none overflow-hidden"
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════════════
          1. شريط التبويبات الفعلي لمتصفح كروم (Full Viewport Tabs Strip)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center h-10 px-2 pt-1.5 bg-[#DEE1E6] dark:bg-[#1E1F22] border-b border-[#C7C9CC] dark:border-[#333539] overflow-x-auto no-scrollbar gap-1 shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group relative flex items-center h-8.5 px-3 max-w-[240px] min-w-[130px] rounded-t-lg text-xs cursor-pointer transition select-none ${
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
                ) : (
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
                <span className="truncate text-xs">{tab.title || tab.url}</span>
              </div>
              <button
                type="button"
                onClick={(e) => closeTab(tab.id, e)}
                className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition text-gray-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => createNewTab('https://www.google.com/search?q=songs')}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#C7C9CC] dark:hover:bg-[#333539] text-[#5F6368] dark:text-[#9AA0A6] transition cursor-pointer shrink-0"
          title="علامة تبويب جديدة (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* مؤشرات الحالة الأساسية (Free VPN + Database + Offline Videos) */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsOfflineVideosDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900"
            title="مكتبة الفيديوهات المحفوظة للمشاهدة بدون نت"
          >
            <Film className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline">فيديوهات أوفلاين</span>
            <span className="font-mono text-[11px]">({videoWatchHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDbApprovalModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900"
            title="اعتماد وترخيص قاعدة البيانات"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">قاعدة البيانات: معتمدة ✅</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVpnModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900"
            title="Free VPN دائم في الخلفية"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>VPN {selectedVpn.flag} متصل</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. شريط الأدوات وعنوان الويب المباشر (Omnibox Navigation Bar)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center h-12 px-3 bg-white dark:bg-[#2B2D30] border-b border-[#E0E2E6] dark:border-[#3C4043] gap-2 shadow-2xs shrink-0">
        <div className="flex items-center gap-1 text-[#5F6368] dark:text-[#9AA0A6]">
          <button
            type="button"
            onClick={goForward}
            disabled={activeTab.historyIndex <= 0}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition cursor-pointer"
            title="للخلف"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 transition cursor-pointer"
            title="للأمام"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={reloadTab}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="إعادة تحميل"
          >
            <RotateCw className={`w-4 h-4 ${activeTab.loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigateCurrentTab('https://www.google.com/search?q=songs')}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            title="الصفحة الرئيسية (Home)"
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
          className="flex-1 flex items-center h-9 px-3.5 bg-[#F1F3F4] dark:bg-[#1E1F22] hover:bg-[#E8EAED] dark:hover:bg-[#1E1F22]/90 rounded-full border border-transparent focus-within:border-[#1A73E8] focus-within:bg-white dark:focus-within:bg-[#202124] transition text-xs gap-2"
        >
          <span title="اتصال مشفر وآمن (HTTPS)">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </span>

          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="ابحث في Google أو اكتب عنوان ويب أو كلمة..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#202124] dark:text-[#E8EAED] focus:outline-none dir-ltr text-left font-mono truncate"
          />

          <button
            type="submit"
            className="h-6 px-3 rounded-full bg-[#1A73E8] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>انتقال</span>
            <ArrowLeft className="w-3 h-3" />
          </button>
        </form>

        {/* زر النجمة لحفظ الإشارات */}
        <button
          type="button"
          onClick={() => {
            const exists = bookmarks.some((b) => b.url === activeTab.url);
            if (exists) {
              setBookmarks((b) => b.filter((x) => x.url !== activeTab.url));
              showToast('تمت الإزالة من الإشارات المرجعية');
            } else {
              setBookmarks((b) => [...b, { id: `b_${Date.now()}`, title: activeTab.title, url: activeTab.url }]);
              showToast('تمت الإضافة إلى الإشارات ⭐');
            }
          }}
          className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          title="إضافة للإشارات"
        >
          <Star className="w-4 h-4" />
        </button>

        {/* قائمة الخيارات (3-dots) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((p) => !p)}
            className="p-2 rounded-full text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            title="خيارات المتصفح"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#2B2D30] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs"
              onClick={() => setIsMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => createNewTab('https://www.google.com/search?q=songs')}
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
                <span>مكتبة الفيديوهات المحفوظة (أوفلاين)</span>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-mono">
                  {videoWatchHistory.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsDbApprovalModalOpen(true)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-blue-600 font-bold"
              >
                <span>اعتماد قاعدة البيانات للتخزين</span>
                <span className="text-[10px]">{databaseApproved ? 'معتمدة ✅' : 'مطلوبة ⚠️'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right"
              >
                <span>السجل وتصفية الكلمات</span>
                <span className="text-[10px] text-gray-400">Ctrl+H</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTaskManagerOpen(true)}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-purple-600 font-semibold"
              >
                <span>مدير مهام المتصفح</span>
                <span className="text-[10px] text-gray-400">Shift+Esc</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. مساحة العرض الرئيسية: محرك بحث جوجل المتكامل أو صفحة الويب
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#202124] relative">
        {isSearchPage ? (
          <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
            {/* رأس محرك بحث جوجل (Google Header) */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div
                onClick={() => navigateCurrentTab('https://www.google.com/search?q=songs')}
                className="cursor-pointer select-none font-bold text-2xl tracking-tight flex items-center"
              >
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </div>

              {/* شريط الإشعارات والحساب والنية المصنفة */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-200 dark:border-purple-800">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>النية المصنفة: {currentQueryParsed.intents.slice(0, 2).join(' + ')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('لا توجد إشعارات جديدة')}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 relative cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-300 dark:ring-blue-800 cursor-pointer"
                >
                  <span>A</span>
                </button>
              </div>
            </div>

            {/* مربع البحث التفاعلي (Search Box with Voice & Clear) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigateCurrentTab(searchQuery);
              }}
              className="flex items-center h-12 px-4 rounded-full bg-white dark:bg-[#303134] border border-gray-200 dark:border-transparent shadow-xs hover:shadow-md focus-within:shadow-md transition gap-2"
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في Google..."
                className="flex-1 bg-transparent text-sm text-[#202124] dark:text-white focus:outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* ميكروفون البحث الصوتي (Voice Search) */}
              <button
                type="button"
                onClick={() => {
                  setIsVoiceListening(true);
                  showToast('🎤 جاري الاستماع لصوتك...');
                  setTimeout(() => {
                    setIsVoiceListening(false);
                    navigateCurrentTab('songs');
                  }, 2000);
                }}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isVoiceListening ? 'text-red-500 animate-pulse bg-red-50' : 'text-[#4285F4] hover:bg-blue-50'
                }`}
                title="البحث الصوتي"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => showToast('📷 عدسة Google Lens')}
                className="p-1 text-[#EA4335] hover:bg-gray-100 rounded-full"
                title="عدسة Google Lens"
              >
                <Camera className="w-4 h-4" />
              </button>
            </form>

            {/* شريط التصنيفات وأوضاع البحث (Search Modes Carousel) */}
            <div className="border-b border-gray-200 dark:border-gray-800 flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: 'all', label: 'الكل', icon: <Search className="w-3.5 h-3.5" /> },
                { id: 'ai', label: 'وضع AI', icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />, badge: 'توليدي' },
                { id: 'videos', label: 'فيديوهات', icon: <Film className="w-3.5 h-3.5 text-rose-500" /> },
                { id: 'images', label: 'صور', icon: <Image className="w-3.5 h-3.5 text-blue-500" /> },
                { id: 'shorts', label: 'فيديوهات قصيرة', icon: <Play className="w-3.5 h-3.5 text-red-500" /> },
                { id: 'news', label: 'أخبار', icon: <Globe className="w-3.5 h-3.5 text-emerald-500" /> },
                { id: 'apps', label: 'تطبيقات', icon: <Smartphone className="w-3.5 h-3.5 text-indigo-500" /> },
                { id: 'books', label: 'كتب', icon: <BookOpen className="w-3.5 h-3.5 text-amber-500" /> },
                { id: 'pdf', label: 'ملفات PDF', icon: <FileText className="w-3.5 h-3.5 text-gray-500" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedVertical(m.id as any)}
                  className={`py-2 px-3 border-b-2 font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedVertical === m.id
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                  {m.badge && (
                    <span className="px-1 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold">
                      {m.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                الآلية البرمجية 4 و 5: الترتيب والعرض الديناميكي المتكيف مع النية
            ═══════════════════════════════════════════════════════════════ */}

            {/* أ) بطاقة النظرة العامة بالذكاء الاصطناعي (AI Overview) */}
            {(selectedVertical === 'all' || selectedVertical === 'ai') && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-300">
                      نظرة عامة مدعومة بنماذج الذكاء الاصطناعي (AI Overview)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiOverviewExpanded((p) => !p)}
                    className="text-[11px] text-purple-700 dark:text-purple-400 font-bold"
                  >
                    {isAiOverviewExpanded ? 'تصغير' : 'عرض المزيد'}
                  </button>
                </div>

                {isAiOverviewExpanded && (
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">
                    <p>{verticalData.aiOverview.summary}</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                      {verticalData.aiOverview.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ب) قسم الفيديوهات (Videos Vertical) - يظهر عندما تكون النية فيديو/وسائط */}
            {(selectedVertical === 'all' || selectedVertical === 'videos' || selectedVertical === 'shorts') &&
              (currentQueryParsed.intents.includes('video_streaming') ||
                currentQueryParsed.intents.includes('media_music') ||
                selectedVertical === 'videos') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-rose-600" />
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">فيديوهات</h3>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      مشغل مدمج + حفظ تلقائي بدون نت
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {verticalData.videos.slice(0, videosVisibleCount).map((vid) => (
                      <div
                        key={vid.id}
                        onClick={() => handlePlayVideo(vid)}
                        className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between bg-white dark:bg-[#2B2D30] group"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2.5">
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px]">
                            {vid.duration}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition">
                            {vid.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1">{vid.channel}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <span>{vid.views}</span>
                          <span className="text-emerald-600 font-bold">جاهز للمشاهدة 🎬</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* الآلية البرمجية 6: التحميل التدريجي للفيديوهات */}
                  {videosVisibleCount < verticalData.videos.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setVideosVisibleCount((c) => Math.min(verticalData.videos.length, c + 3));
                        showToast('تم تحميل المزيد من الفيديوهات');
                      }}
                      className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 text-xs font-bold text-blue-600 transition cursor-pointer"
                    >
                      المزيد من الفيديوهات ⬇️
                    </button>
                  )}
                </div>
              )}

            {/* ج) قسم التطبيقات (Apps Vertical) - يظهر عندما تكون النية أدوات/تطبيقات/موسيقى */}
            {(selectedVertical === 'all' || selectedVertical === 'apps') &&
              (currentQueryParsed.intents.includes('apps_tools') || selectedVertical === 'apps') && (
                <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        تطبيقات ذات صلة (Google Play Store)
                      </h3>
                    </div>
                    <span className="text-[11px] text-gray-400">تحميل مباشر وتثبيت</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {verticalData.apps.slice(0, appsVisibleCount).map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <img
                            src={app.icon}
                            alt={app.name}
                            className="w-11 h-11 rounded-xl object-cover shrink-0"
                          />
                          <div className="truncate">
                            <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white">
                              {app.name}
                            </h4>
                            <p className="text-[10px] text-gray-400">{app.category}</p>
                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                              <span>⭐ {app.rating}</span>
                              <span className="text-gray-400 font-normal">({app.reviewsCount})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast(`تم تثبيت ${app.name} عبر AnwerBrowser بنجاح`)}
                          className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                        >
                          تثبيت
                        </button>
                      </div>
                    ))}
                  </div>

                  {appsVisibleCount < verticalData.apps.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppsVisibleCount((c) => Math.min(verticalData.apps.length, c + 2));
                        showToast('تم تحميل المزيد من التطبيقات');
                      }}
                      className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:underline"
                    >
                      المزيد من التطبيقات ⬇️
                    </button>
                  )}
                </div>
              )}

            {/* د) قسم الكتب والأبحاث وملفات PDF */}
            {(selectedVertical === 'all' || selectedVertical === 'books' || selectedVertical === 'pdf') &&
              (currentQueryParsed.intents.includes('research_books_pdf') ||
                selectedVertical === 'books' ||
                selectedVertical === 'pdf') && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        الكتب والأبحاث والمستندات (PDF / Books)
                      </h3>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                      تحميل مباشر مجاني
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {verticalData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-[#202124] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold">
                              {doc.format}
                            </span>
                            <span className="text-[10px] text-gray-400">{doc.size}</span>
                          </div>
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white mb-1">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2">
                            {doc.snippet}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <span className="text-[10px] text-gray-400">{doc.author}</span>
                          <button
                            type="button"
                            onClick={() => showToast(`تم بدء تنزيل ${doc.title}`)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>تحميل</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* هـ) نتائج الويب العضوية (Organic Web Results) */}
            {(selectedVertical === 'all' || selectedVertical === 'news') && (
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">نتائج الويب</h3>

                <div className="space-y-3">
                  {verticalData.webResults.slice(0, webVisibleCount).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigateCurrentTab(item.url)}
                      className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group bg-white dark:bg-[#2B2D30]"
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

                {webVisibleCount < verticalData.webResults.length && (
                  <button
                    type="button"
                    onClick={() => {
                      setWebVisibleCount((c) => Math.min(verticalData.webResults.length, c + 3));
                      showToast('تم تحميل المزيد من نتائج الويب');
                    }}
                    className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 text-xs font-bold text-blue-600 transition"
                  >
                    المزيد من نتائج الويب ⬇️
                  </button>
                )}
              </div>
            )}

            {/* و) قسم "تم البحث أيضًا عن" (Related Searches) */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 space-y-2.5">
              <h3 className="font-bold text-xs text-gray-700 dark:text-gray-300">
                تم البحث أيضًا عن (Related Searches)
              </h3>
              <div className="flex flex-wrap gap-2">
                {verticalData.relatedSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigateCurrentTab(term)}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2B2D30] border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:border-blue-500 hover:text-blue-600 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Search className="w-3 h-3 text-gray-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* عرض صفحة ويب خارجية حقيقية داخل المتصفح */
          <div className="w-full h-full relative">
            {activeTab.loading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
                <div className="h-full bg-blue-600 animate-pulse w-full" />
              </div>
            )}
            <iframe
              title={activeTab.title}
              src={activeTab.url}
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
                  prev.map((t) => (t.id === activeTab.id ? { ...t, loading: false } : t))
                );
              }}
            />
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          مشغل الفيديو المدمج مع الحفظ التلقائي للمشاهدة بدون إنترنت
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
                    onClick={() => {
                      setVideoPlaybackRate(rate);
                      if (videoPlayerRef.current) videoPlayerRef.current.playbackRate = rate;
                    }}
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
                <span>فتح مكتبة الفيديوهات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* درج مكتبة الفيديوهات المحفوظة للمشاهدة بدون نت */}
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
                  <p className="text-[10px] text-gray-500">مشاهدة مباشرة بدون إنترنت</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOfflineVideosDrawerOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {videoWatchHistory.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => {
                    handlePlayVideo(vid);
                    setIsOfflineVideosDrawerOpen(false);
                  }}
                  className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-rose-500 transition cursor-pointer flex gap-3 group bg-white dark:bg-[#202124]"
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
                  </div>

                  <div className="flex-1 flex flex-col justify-between truncate">
                    <h4 className="font-bold text-xs truncate text-gray-900 dark:text-white">
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{vid.channel}</span>
                      <span className="text-emerald-600 font-bold">بدون نت 💾</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة اعتماد قاعدة البيانات للتخزين */}
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
                    لحفظ الفيديوهات وسجل التصفح بشكل مشفر ودائم
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

            <div className="p-5 space-y-3 text-xs text-gray-700 dark:text-gray-300">
              <p>تفعيل التخزين المعتمد (IndexedDB + Cache Storage + Firestore) لحفظ الوسائط ومشاهدتها أوفلاين.</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                  <span className="font-bold block">التشفير:</span>
                  <span className="text-emerald-600 font-bold">256-bit Secure</span>
                </div>
                <div className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
                  <span className="font-bold block">نوع الذاكرة:</span>
                  <span className="text-gray-500 font-mono">Persistent Quota</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDbApprovalModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  setDatabaseApproved(true);
                  setIsDbApprovalModalOpen(false);
                  showToast('✅ تم اعتماد وتفعيل قاعدة البيانات بنجاح');
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                موافق واعتماد قاعدة البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* درج السجل والتصفية بالكلمات */}
      {isHistoryDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end"
          onClick={() => setIsHistoryDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-white dark:bg-[#2B2D30] shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">سجل التصفح ({historyList.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="ابحث في السجل..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-xs focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {historyList.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    navigateCurrentTab(h.url);
                    setIsHistoryDrawerOpen(false);
                  }}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-750 hover:border-blue-500 cursor-pointer transition text-right"
                >
                  <div className="text-xs font-bold truncate mb-0.5">{h.title}</div>
                  <div className="text-[10px] text-gray-400 font-mono truncate dir-ltr text-left">{h.url}</div>
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
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">مدير مهام المتصفح (Chrome Multi-Process)</h3>
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
                    <th className="p-2">العملية</th>
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
                بنية العمليات المتعددة: عزل كامل بين محركات البحث والصفحات ومشغل الفيديو
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
                <h3 className="font-bold text-sm">Free VPN التلقائي (دائم ومستقر)</h3>
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
                  <div className="text-[11px] text-gray-500">حماية كاملة من تتبع أبحاثك وكلماتك</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVpnEnabled((prev) => !prev);
                    showToast(!vpnEnabled ? 'تم تفعيل Free VPN 🟢' : 'تم تعطيل VPN');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                    vpnEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {vpnEnabled ? 'نشط ومتصل ✅' : 'تشغيل VPN'}
                </button>
              </div>

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
                    <div className="font-mono text-[10px] text-emerald-600">{server.ping} ms</div>
                  </div>
                ))}
              </div>
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
