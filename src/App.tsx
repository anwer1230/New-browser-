/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Languages,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { SUPPORTED_LANGUAGES, translateTextOnline } from './services/translator.ts';
import { ChromeNewTabPage } from './components/ChromeNewTabPage.tsx';
import { ChromeSERP } from './components/ChromeSERP.tsx';
import {
  MSESourceBufferPipeline,
  MSEPipelineStats,
  isMSESupported,
  getBestSupportedMSEMime,
} from './services/msePipeline.ts';
import { MSEPlayerPanel } from './components/MSEPlayerPanel.tsx';

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
  langTier?: 'ar' | 'en' | 'orig';
  langBadge?: string;
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
  langTier?: 'ar' | 'en' | 'orig';
  langBadge?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  author: string;
  format: 'PDF' | 'EPUB' | 'DOC';
  size: string;
  snippet: string;
  url: string;
  langTier?: 'ar' | 'en' | 'orig';
  langBadge?: string;
}

export interface WebResultItem {
  id: string;
  title: string;
  domain: string;
  path: string;
  url: string;
  snippet: string;
  langTier?: 'ar' | 'en' | 'orig';
  langBadge?: string;
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

/**
 * تحليل روابط الفيديوهات المضمنة (YouTube / Vimeo / External Embeds)
 */
function getEmbedVideoInfo(url: string): { isEmbed: boolean; embedUrl: string } {
  if (!url) return { isEmbed: false, embedUrl: '' };
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1`,
    };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      isEmbed: true,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`,
    };
  }
  return { isEmbed: false, embedUrl: '' };
}

/**
 * تجهيز مسارات مصادر الفيديو بتنسيقات الويب القياسية المدعومة (MP4, WebM, OGG)
 */
function getVideoSourceUrls(baseStreamUrl: string): { mp4Url: string; webmUrl: string; oggUrl: string } {
  const mp4Url = baseStreamUrl;
  const webmUrl = baseStreamUrl.replace(/\.mp4$/i, '.webm');
  const oggUrl = baseStreamUrl.replace(/\.mp4$/i, '.ogv');
  return { mp4Url, webmUrl, oggUrl };
}

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
  const rawQ = query.trim() || 'songs';
  const cleanName = rawQ.replace(/^(فيلم|فلم|أغنية|اغنية|movie|song)\s+/i, '').trim() || rawQ;
  const lower = rawQ.toLowerCase();

  const isMovieOrCinema =
    lower.includes('فيلم') ||
    lower.includes('فلم') ||
    lower.includes('سينما') ||
    lower.includes('movie') ||
    lower.includes('film') ||
    lower.includes('cinema') ||
    lower.includes('مسلسل') ||
    lower.includes('series') ||
    lower.includes('season') ||
    lower.includes('avatar') ||
    lower.includes('inception') ||
    lower.includes('interstellar') ||
    lower.includes('batman') ||
    lower.includes('spiderman') ||
    lower.includes('spider-man') ||
    lower.includes('joker') ||
    lower.includes('dune') ||
    lower.includes('titanic') ||
    lower.includes('oppenheimer') ||
    lower.includes('gladiator') ||
    lower.includes('matrix');

  const isSongOrMusic =
    !isMovieOrCinema &&
    (lower.includes('أغنية') ||
      lower.includes('اغنية') ||
      lower.includes('أغاني') ||
      lower.includes('اغاني') ||
      lower.includes('موسيقى') ||
      lower.includes('song') ||
      lower.includes('music') ||
      lower.includes('hits') ||
      lower.includes('adele') ||
      lower.includes('songs') ||
      intents.includes('media_music'));

  // أ) البحث العمودي في الفيديوهات مرتبة بالأولوية: عربي أولاً ➔ إنجليزي ثانياً ➔ لغات أخرى ثالثاً
  let allVideos: VideoItem[] = [];

  if (isMovieOrCinema) {
    allVideos = [
      // 1. النتائج المترجمة للعربية أولاً (Tier 1: Arabic Translated)
      {
        id: 'v_ar_1',
        title: `فيلم ${cleanName} مترجم للعربية كامل HD (مشاهدة مباشرة وسيرفرات سريعة)`,
        channel: 'سينما العرب · YouTube',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
        duration: '2:14:30',
        views: '3.4M مشاهدة',
        date: 'ترجمة احترافية 2026',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      {
        id: 'v_ar_2',
        title: `${cleanName} النسخة المدبلجة والمترجمة للعربية بدقة 1080p BluRay`,
        channel: 'مترجم بالعربي · Vevo',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
        duration: '1:58:13',
        views: '1.8M مشاهدة',
        date: 'مدبلج ومترجم للعربية',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      {
        id: 'v_ar_3',
        title: `مشاهدة فيلم ${cleanName} مترجم للعربي أونلاين - القصة والأحداث كاملة`,
        channel: 'عرب سينما الرسمي',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&q=80',
        duration: '10:54',
        views: '940K مشاهدة',
        date: 'مترجم عربي معتمد',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      // 2. النتائج باللغة الإنجليزية ثانياً (Tier 2: English Version)
      {
        id: 'v_en_1',
        title: `${cleanName} Full Movie (Official English Audio & Subtitles) - HD Stream`,
        channel: 'Warner Bros / Sony Global',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
        duration: '2:22:15',
        views: '14.2M views',
        date: 'English Release',
        isCachedOffline: true,
        langTier: 'en',
        langBadge: 'English Version 🇺🇸',
      },
      {
        id: 'v_en_2',
        title: `${cleanName} 4K Ultra HD (Original English Dub/Sub Release)`,
        channel: 'Paramount Pictures Official',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80',
        duration: '24:18',
        views: '6.7M views',
        date: 'English Original',
        isCachedOffline: true,
        langTier: 'en',
        langBadge: 'English Version 🇺🇸',
      },
      // 3. لغات أخرى / النسخة الأصلية ثالثاً (Tier 3: Original / Other Languages)
      {
        id: 'v_orig_1',
        title: `${cleanName} (International Festival Master / Multi-Language CC & Audio)`,
        channel: 'Global Cinema Worldwide',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80',
        duration: '14:20',
        views: '820K views',
        date: 'Multi-Language Edition',
        isCachedOffline: true,
        langTier: 'orig',
        langBadge: 'لغات أخرى / الأصلية 🌐',
      },
    ];
  } else if (isSongOrMusic) {
    allVideos = [
      // 1. النتائج المترجمة للعربية أولاً (Tier 1: Arabic Translated)
      {
        id: 'v_ar_1',
        title: `أغنية ${cleanName} مترجمة للعربية بالكلمات الحصرية (Arabic Lyrics Translation)`,
        channel: 'ترجمات الأغاني العربية · YouTube',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
        duration: '04:15',
        views: '5.2M مشاهدة',
        date: 'مترجمة للعربية',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      {
        id: 'v_ar_2',
        title: `${cleanName} النسخة المترجمة للعربية بدقة عالية مع معاني الكلمات الكاملة`,
        channel: 'Arabic Vevo Subtitles',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
        duration: '03:45',
        views: '2.1M مشاهدة',
        date: 'ترجمة معتمدة',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      {
        id: 'v_ar_3',
        title: `أغاني وموسيقى ${cleanName} مترجمة للعربي كاملة مع الشرح الصوتي`,
        channel: 'موسيقى وترجمات الشرق',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
        duration: '10:54',
        views: '980K مشاهدة',
        date: 'مترجمة للعربية',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      // 2. النتائج باللغة الإنجليزية ثانياً (Tier 2: English Version)
      {
        id: 'v_en_1',
        title: `${cleanName} - Official Music Video & English Lyrics (Full HD)`,
        channel: 'Official Artist Channel · Vevo',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
        duration: '03:52',
        views: '42.8M views',
        date: 'Official English Video',
        isCachedOffline: true,
        langTier: 'en',
        langBadge: 'English Version 🇺🇸',
      },
      {
        id: 'v_en_2',
        title: `${cleanName} - Studio Master Audio Stream (English Release)`,
        channel: 'BBC Music Global',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
        duration: '24:18',
        views: '8.4M views',
        date: 'English Master',
        isCachedOffline: true,
        langTier: 'en',
        langBadge: 'English Version 🇺🇸',
      },
      // 3. لغات أخرى / النسخة الأصلية ثالثاً (Tier 3: Original / Other Languages)
      {
        id: 'v_orig_1',
        title: `${cleanName} (Worldwide Live Performance / Multi-Language CC)`,
        channel: 'International Music Awards',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
        duration: '06:12',
        views: '1.2M views',
        date: 'Global Multi-Lingual',
        isCachedOffline: true,
        langTier: 'orig',
        langBadge: 'لغات أخرى / الأصلية 🌐',
      },
    ];
  } else {
    // استعلام عام أو تقني أو أدبي
    allVideos = [
      // 1. النتائج المترجمة للعربية أولاً (Tier 1: Arabic Translated)
      {
        id: 'v_ar_1',
        title: `${cleanName} - الشرح والتفاصيل الكاملة باللغة العربية (مترجم ومعرّب)`,
        channel: 'المعرفة الرقمية بالعربي · YouTube',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
        duration: '16:26',
        views: '1.5M مشاهدة',
        date: 'شرح مترجم للعربية',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      {
        id: 'v_ar_2',
        title: `دليل شامل ومترجم للعربية حول: ${cleanName} بالتفصيل الكامل`,
        channel: 'Tech Explorer بالعربي',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
        duration: '10:54',
        views: '820K مشاهدة',
        date: 'مترجم للعربية',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      {
        id: 'v_ar_3',
        title: `${cleanName} - النسخة العربية المترجمة والموثقة للباحثين`,
        channel: 'الأكاديمية المعربة',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
        duration: '12:30',
        views: '450K مشاهدة',
        date: 'مترجم عربي',
        isCachedOffline: true,
        langTier: 'ar',
        langBadge: 'مترجم للعربية 🇸🇦',
      },
      // 2. النتائج باللغة الإنجليزية ثانياً (Tier 2: English Version)
      {
        id: 'v_en_1',
        title: `${cleanName} - Comprehensive Guide & Insights (English Version)`,
        channel: 'Global Tech & Culture · YouTube',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
        duration: '09:56',
        views: '9.1M views',
        date: 'English Edition',
        isCachedOffline: true,
        langTier: 'en',
        langBadge: 'English Version 🇺🇸',
      },
      {
        id: 'v_en_2',
        title: `Official ${cleanName} Global Handbook & Deep Dive Overview`,
        channel: 'BBC Insights Worldwide',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
        duration: '24:18',
        views: '3.6M views',
        date: 'English Master',
        isCachedOffline: true,
        langTier: 'en',
        langBadge: 'English Version 🇺🇸',
      },
      // 3. لغات أخرى / النسخة الأصلية ثالثاً (Tier 3: Original / Other Languages)
      {
        id: 'v_orig_1',
        title: `${cleanName} (Multi-Language Source & Global Archive Edition)`,
        channel: 'International Archive',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80',
        duration: '14:20',
        views: '710K views',
        date: 'Original Global CC',
        isCachedOffline: true,
        langTier: 'orig',
        langBadge: 'لغات أخرى / الأصلية 🌐',
      },
    ];
  }

  // ب) البحث العمودي في متجر التطبيقات (Apps Vertical)
  const allApps: AppItem[] = [
    {
      id: 'app_1',
      name: isMovieOrCinema ? `تطبيق سينما ${cleanName}: أفلام مترجمة بالعربي` : `تطبيق ${cleanName}: استماع وبث مترجم`,
      developer: 'Arabic Apps Studio',
      category: isMovieOrCinema ? 'أفلام ومسلسلات مترجمة' : 'موسيقى وصوت',
      rating: 4.8,
      reviewsCount: '840,126',
      icon: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&q=80',
      langTier: 'ar',
      langBadge: 'تطبيق مترجم للعربية 🇸🇦',
    },
    {
      id: 'app_2',
      name: isMovieOrCinema ? `${cleanName} Movies: English & Global Streaming` : `Spotify: ${cleanName} & Podcasts`,
      developer: 'Global Media AB',
      category: 'ترفيه عالمي',
      rating: 4.6,
      reviewsCount: '12,450,890',
      icon: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&q=80',
      langTier: 'en',
      langBadge: 'English Version 🇺🇸',
    },
    {
      id: 'app_3',
      name: `International Cinema Player: ${cleanName}`,
      developer: 'Worldwide App LLC',
      category: 'مشغلات عالمية',
      rating: 4.4,
      reviewsCount: '3,920,410',
      icon: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&q=80',
      langTier: 'orig',
      langBadge: 'Multi-Language 🌐',
    },
  ];

  // ج) البحث العمودي في الكتب والأبحاث وملفات PDF
  const allDocuments: DocumentItem[] = [
    // 1. عربي أولاً
    {
      id: 'doc_ar_1',
      title: isMovieOrCinema ? `كتاب السيناريو والقصة الكاملة لفيلم: ${cleanName} (مترجم للعربية)` : `كتاب ودراسة شاملة ومترجمة للعربية حول: ${cleanName}`,
      author: 'د. سامي العلي · دار المعرفة العربية',
      format: 'PDF',
      size: '6.4 MB',
      snippet: `مستند توثيقي مترجم ومعرّب يشتمل على تحليل سيناريو وأحداث ${cleanName} باللغة العربية الفصحى مع التوثيق الكامل.`,
      url: 'https://anwerbrowser.local/library/arabic_study.pdf',
      langTier: 'ar',
      langBadge: 'مترجم للعربية 🇸🇦',
    },
    {
      id: 'doc_ar_2',
      title: `الموسوعة المترجمة والمراجع العربية الكاملة: ${cleanName}`,
      author: 'مؤسسة الترجمة الرقمية',
      format: 'PDF',
      size: '14.2 MB',
      snippet: `ملف بصيغة PDF يضم فهرساً ومصطلحات معرّبة بالكامل تركز على شرح أبعاد ${cleanName}.`,
      url: 'https://anwerbrowser.local/library/arabic_encyclopedia.pdf',
      langTier: 'ar',
      langBadge: 'مترجم للعربية 🇸🇦',
    },
    // 2. إنجليزي ثانياً
    {
      id: 'doc_en_1',
      title: `Official Production Script & Comprehensive Guide: ${cleanName} (English Edition)`,
      author: 'Global Publishing House',
      format: 'PDF',
      size: '8.9 MB',
      snippet: `Original English documentation containing official screenplay, archival data, and reviews for ${cleanName}.`,
      url: 'https://anwerbrowser.local/library/english_edition.pdf',
      langTier: 'en',
      langBadge: 'English Version 🇺🇸',
    },
    // 3. لغات أخرى ثالثاً
    {
      id: 'doc_orig_1',
      title: `${cleanName} - International Archival Manuscript (Multi-Language PDF)`,
      author: 'International Heritage Library',
      format: 'PDF',
      size: '11.5 MB',
      snippet: `Original multilingual documents including source scripts, global translations and festival records.`,
      url: 'https://anwerbrowser.local/library/international_doc.pdf',
      langTier: 'orig',
      langBadge: 'لغات أخرى / الأصلية 🌐',
    },
  ];

  // د) البحث العمودي في الويب (Web Results) مرتبة: عربي أولاً ➔ إنجليزي ثانياً ➔ أخرى ثالثاً
  const allWebResults: WebResultItem[] = [
    // 1. عربي أولاً
    {
      id: 'web_ar_1',
      title: isMovieOrCinema
        ? `مشاهدة وتحميل ${cleanName} مترجم للعربية كامل بجودة عالية 1080p | عرب سينما`
        : `استمع وحمّل ${cleanName} مترجمة للعربية مع الكلمات الكاملة | أنغامي عربية`,
      domain: 'ar.cinema-online.com',
      path: 'watch > arabic-sub',
      url: 'https://ar.cinema-online.com',
      snippet: `النسخة المترجمة للعربية مع توفير سيرفرات سريعة وبدون إعلانات. تم تدقيق الترجمة والكلمات باللغة العربية لمشاهدة ممتعة ومريحة.`,
      langTier: 'ar',
      langBadge: 'مترجم للعربية 🇸🇦',
    },
    {
      id: 'web_ar_2',
      title: `${cleanName} - ويكيبيديا العربية (الموسوعة الحرة باللغة العربية)`,
      domain: 'ar.wikipedia.org',
      path: `wiki > ${encodeURIComponent(cleanName)}`,
      url: 'https://ar.wikipedia.org',
      snippet: `تقرير شامل ومترجم للعربية يتناول قصة ${cleanName}، الممثلين أو المغنين، الجوائز، وتاريخ الإصدار مع تحليل نقدي معرّب.`,
      langTier: 'ar',
      langBadge: 'مترجم للعربية 🇸🇦',
    },
    // 2. إنجليزي ثانياً
    {
      id: 'web_en_1',
      title: `${cleanName} - Official IMDb & Rotten Tomatoes Synopsis (English)`,
      domain: 'imdb.com',
      path: `title > ${encodeURIComponent(cleanName)}`,
      url: 'https://imdb.com',
      snippet: `Comprehensive English overview, cast info, verified user ratings, box office numbers, and official critical consensus.`,
      langTier: 'en',
      langBadge: 'English Version 🇺🇸',
    },
    {
      id: 'web_en_2',
      title: `${cleanName} - Wikipedia, the free encyclopedia (English)`,
      domain: 'en.wikipedia.org',
      path: `wiki > ${encodeURIComponent(cleanName)}`,
      url: 'https://en.wikipedia.org',
      snippet: `In-depth historical and creative documentation in English covering development, release chronology, and international reception.`,
      langTier: 'en',
      langBadge: 'English Version 🇺🇸',
    },
    // 3. لغات أخرى ثالثاً
    {
      id: 'web_orig_1',
      title: `${cleanName} - International Festival Directory & Multi-Language Releases`,
      domain: 'worldcinema.org',
      path: 'international > releases',
      url: 'https://worldcinema.org',
      snippet: `Global releases, multilingual subtitles archive, festival entries, and original language commentary from worldwide critics.`,
      langTier: 'orig',
      langBadge: 'لغات أخرى / الأصلية 🌐',
    },
  ];

  // هـ) النظرة العامة التوليدية (AI Overview)
  const aiOverview = {
    summary: `بناءً على طلبك، تم تفعيل نظام الترتيب والترجمة ذو الأولوية للاستعلام "${rawQ}": تم عرض النتائج المترجمة للعربية أولاً (🇸🇦)، تليها النتائج باللغة الإنجليزية (🇺🇸)، ثم لغات المصدر الأخرى (🌐) حتى استيفاء كافة النتائج.`,
    keyPoints: [
      `النتائج المترجمة للعربية في الصدارة: تشمل الأفلام ومقاطع الفيديو والكتب وصفحات الويب المعربة مع روابط مشاهدة وتحميل فوري.`,
      `النتائج الإنجليزية تليها تلقائياً: للمستخدمين الراغبين بمتابعة النسخ الأصلية أو الترجمة الإنجليزية.`,
      `مشغل الفيديو المدمج يحفظ مقاطع الفيديو تلقائياً في السجل للمشاهدة بدون إنترنت مع الترجمة المصاحبة.`,
    ],
  };

  // و) الاقتراحات المترابطة (Related Searches)
  const relatedSearches = [
    `${cleanName} مترجم للعربية كامل`,
    `${cleanName} مدبلج بالعربي`,
    `${cleanName} English Subtitles 1080p`,
    `تحميل ${cleanName} مترجم بدون نت`,
    `قصة وتفاصيل ${cleanName} بالعربية`,
    `${cleanName} Official Trailer & Review`,
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
      title: 'علامة تبويب جديدة',
      url: 'chrome://newtab',
      history: ['chrome://newtab'],
      historyIndex: 0,
      loading: false,
      isCrashed: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');
  const [urlInput, setUrlInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // ═══ تحسينات مشغل الفيديو والتنسيقات المدعومة (Sandbox & Formats) ═══
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<'mp4' | 'webm' | 'ogg'>('mp4');
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [videoFormatFallbackAttempted, setVideoFormatFallbackAttempted] = useState<boolean>(false);

  // ═══ منظومة Media Source Extensions (MSE) و SourceBuffer Pipeline ═══
  const msePipelineRef = useRef<MSESourceBufferPipeline | null>(null);
  const [isMSEActive, setIsMSEActive] = useState<boolean>(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoTotalDuration, setVideoTotalDuration] = useState<number>(0);
  const [mseStats, setMseStats] = useState<MSEPipelineStats>({
    isSupported: isMSESupported(),
    active: false,
    mimeType: getBestSupportedMSEMime(),
    sourceState: 'closed',
    sourceBufferMode: 'sequence',
    chunksAppended: 0,
    totalBytesAppended: 0,
    bufferedRanges: [],
    bufferAhead: 0,
    isUpdating: false,
    streamMode: 'chunked-range',
    currentBitrateKbps: 2400,
    quality: '1080p',
  });

  // ═══ ميزة ترجمة الصفحة الفورية عبر قاموس أونلاين (Translate Page) ═══
  const [targetLanguage, setTargetLanguage] = useState<string>('ar');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isTranslateBannerOpen, setIsTranslateBannerOpen] = useState<boolean>(false);

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
    { title: 'علامة تبويب جديدة', url: 'chrome://newtab', time: '12:30 م' },
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
    let q = searchQuery || '';
    if (activeTab.url.includes('google.com/search')) {
      try {
        const u = new URL(activeTab.url);
        q = u.searchParams.get('q') || q;
      } catch {}
    }
    return parseAndAnalyzeQuery(q || '');
  }, [searchQuery, activeTab.url]);

  // نتائج البحث العمودي المتخصصة (Vertical Results)
  const verticalData = useMemo(() => {
    return generateVerticalResults(currentQueryParsed.clean, currentQueryParsed.intents);
  }, [currentQueryParsed]);

  // ═══ فرز نتائج البحث اللغوي ذو الأولوية (عربي أولاً ➔ إنجليزي ثانياً ➔ لغات أخرى) ═══
  const [selectedLangFilter, setSelectedLangFilter] = useState<'all' | 'ar' | 'en' | 'orig'>('all');

  const filteredVideos = useMemo(() => {
    const list =
      selectedLangFilter === 'all'
        ? verticalData.videos
        : verticalData.videos.filter((v) => v.langTier === selectedLangFilter);
    const score = (t?: string) => (t === 'ar' ? 1 : t === 'en' ? 2 : 3);
    return [...list].sort((a, b) => score(a.langTier) - score(b.langTier));
  }, [verticalData.videos, selectedLangFilter]);

  const filteredWebResults = useMemo(() => {
    const list =
      selectedLangFilter === 'all'
        ? verticalData.webResults
        : verticalData.webResults.filter((w) => w.langTier === selectedLangFilter);
    const score = (t?: string) => (t === 'ar' ? 1 : t === 'en' ? 2 : 3);
    return [...list].sort((a, b) => score(a.langTier) - score(b.langTier));
  }, [verticalData.webResults, selectedLangFilter]);

  const filteredDocuments = useMemo(() => {
    const list =
      selectedLangFilter === 'all'
        ? verticalData.documents
        : verticalData.documents.filter((d) => d.langTier === selectedLangFilter);
    const score = (t?: string) => (t === 'ar' ? 1 : t === 'en' ? 2 : 3);
    return [...list].sort((a, b) => score(a.langTier) - score(b.langTier));
  }, [verticalData.documents, selectedLangFilter]);

  // مزامنة شريط العنوان
  useEffect(() => {
    if (activeTab.url === 'chrome://newtab' || activeTab.url === 'about:blank') {
      setUrlInput('');
    } else {
      setUrlInput(activeTab.url.replace(/^https?:\/\//, ''));
    }
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

  // دالة الترجمة الفورية لنصوص المتصفح باستخدام القاموس الأونلاين (Online Mock Dictionary)
  const t = useCallback(
    (text: string): string => {
      if (!text || targetLanguage === 'ar') return text;
      return translateTextOnline(text, targetLanguage);
    },
    [targetLanguage]
  );

  const handleLanguageChange = (langCode: string) => {
    setIsTranslating(true);
    setTimeout(() => {
      setTargetLanguage(langCode);
      setIsTranslating(false);
      if (langCode === 'ar') {
        showToast('تمت استعادة لغة الصفحة الأصلية (العربية) ↩️');
      } else {
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
        showToast(`🌐 تمت ترجمة نصوص الصفحة إلى ${langObj?.nativeName || langCode} عبر القاموس الفوري`);
      }
    }, 120);
  };

  const handleRestoreOriginal = () => {
    setTargetLanguage('ar');
    showToast('تمت استعادة النص الأصلي للصفحة ↩️');
  };

  // تشغيل وحفظ الفيديو أوفلاين مع إعدادات التنسيق والـ Sandbox
  const handlePlayVideo = (vid: VideoItem) => {
    setCurrentPlayingVideo(vid);
    setIsVideoPlayerOpen(true);
    setVideoPlaybackRate(1);
    setSelectedVideoFormat('mp4');
    setVideoLoadError(null);
    setIsVideoBuffering(false);
    setVideoFormatFallbackAttempted(false);

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

  // معالجة أخطاء تشغيل الفيديو والتبديل التلقائي إلى التنسيق البديل المدعوم
  const handleVideoError = () => {
    if (!videoFormatFallbackAttempted) {
      setVideoFormatFallbackAttempted(true);
      const nextFmt = selectedVideoFormat === 'mp4' ? 'webm' : selectedVideoFormat === 'webm' ? 'ogg' : 'mp4';
      setSelectedVideoFormat(nextFmt);
      setVideoLoadError(`⚠️ تعذر تشغيل تنسيق ${selectedVideoFormat.toUpperCase()} - جاري التبديل التلقائي إلى ${nextFmt.toUpperCase()}`);
      setTimeout(() => {
        if (videoPlayerRef.current) {
          videoPlayerRef.current.load();
          videoPlayerRef.current.play().catch(() => {});
        }
      }, 500);
    } else {
      setVideoLoadError('⚠️ تعذر تشغيل هذا التنسيق. يمكنك التبديل يدوياً إلى تنسيق آخر أو إعادة المحاولة.');
    }
  };

  // ═══ إدارة دورة حياة أنبوب Media Source Extensions (SourceBuffer Pipeline) ═══
  useEffect(() => {
    if (!isVideoPlayerOpen || !currentPlayingVideo) {
      if (msePipelineRef.current) {
        msePipelineRef.current.cleanup();
        msePipelineRef.current = null;
      }
      return;
    }

    const embedInfo = getEmbedVideoInfo(currentPlayingVideo.streamUrl);
    if (embedInfo.isEmbed || !isMSEActive) {
      if (msePipelineRef.current) {
        msePipelineRef.current.cleanup();
        msePipelineRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    const initMSE = async () => {
      const videoEl = videoPlayerRef.current;
      if (!videoEl) return;

      try {
        if (msePipelineRef.current) {
          msePipelineRef.current.cleanup();
        }

        const pipeline = new MSESourceBufferPipeline({
          mimeType: mseStats.mimeType,
          mode: mseStats.sourceBufferMode,
          onStats: (newStats) => {
            if (!isCancelled) setMseStats(newStats);
          },
          onError: (err) => {
            console.warn('MSE Pipeline error:', err);
          },
        });
        msePipelineRef.current = pipeline;

        await pipeline.initialize(videoEl, mseStats.mimeType);
        if (isCancelled) return;

        showToast('⚡ تم ربط أنبوب Media Source Extensions (SourceBuffer)');

        // بدء جلب وتدفق الشرائح الثنائية للـ SourceBuffer
        pipeline
          .startDynamicChunkStreaming(currentPlayingVideo.streamUrl)
          .catch(() => {
            if (!isCancelled) {
              pipeline.generateSyntheticDemoSegments(4);
            }
          });
      } catch (err) {
        console.warn('MSE Initialization Notice:', err);
        if (!isCancelled && msePipelineRef.current) {
          msePipelineRef.current.generateSyntheticDemoSegments(3);
        }
      }
    };

    const timer = setTimeout(() => {
      initMSE();
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (msePipelineRef.current) {
        msePipelineRef.current.cleanup();
        msePipelineRef.current = null;
      }
    };
  }, [isVideoPlayerOpen, currentPlayingVideo?.id, isMSEActive, mseStats.mimeType]);

  const handleToggleMSE = (enable: boolean) => {
    setIsMSEActive(enable);
    if (enable) {
      showToast('⚡ تم تفعيل تدفق القطع الثنائية Media Source Extensions (MSE)');
    } else {
      showToast('🎬 تم التبديل إلى المشغل القياسي Direct HTML5');
      if (videoPlayerRef.current) {
        videoPlayerRef.current.src = '';
        videoPlayerRef.current.load();
      }
    }
  };

  const handleAppendChunkManually = () => {
    if (msePipelineRef.current) {
      msePipelineRef.current.generateSyntheticDemoSegments(1);
      showToast('📥 تم جلب ودمج شريحة بيانات 64KB في SourceBuffer بنجاح');
    }
  };

  const handleEvictBuffer = () => {
    if (msePipelineRef.current) {
      msePipelineRef.current.evictBufferBefore(5);
      showToast('🧹 تم تفريغ أجزاء الفيديو المستهلكة من الذاكرة (Buffer Eviction)');
    }
  };

  const handleChangeMimeType = (mime: string) => {
    setMseStats((prev) => ({ ...prev, mimeType: mime }));
    showToast(`تم تغيير ترميز MSE إلى: ${mime.split(';')[0]}`);
  };

  const handleChangeMode = (mode: 'segments' | 'sequence') => {
    if (msePipelineRef.current) {
      msePipelineRef.current.setMode(mode);
    }
    setMseStats((prev) => ({ ...prev, sourceBufferMode: mode }));
    showToast(`تم تغيير وضع SourceBuffer إلى: ${mode}`);
  };

  const handleResetPipeline = () => {
    if (msePipelineRef.current && videoPlayerRef.current) {
      msePipelineRef.current.initialize(videoPlayerRef.current, mseStats.mimeType);
      msePipelineRef.current.generateSyntheticDemoSegments(3);
      showToast('🔄 تمت إعادة ضبط MediaSource و SourceBuffer بنجاح');
    }
  };

  // الملاحة والتنقل
  const navigateCurrentTab = (input: string) => {
    const clean = input.trim();
    if (!clean) return;

    let targetUrl: string;
    let newTitle: string;

    if (
      clean === 'chrome://newtab' ||
      clean === 'about:blank' ||
      clean === 'https://www.google.com' ||
      clean === 'https://www.google.com/' ||
      clean === 'google.com'
    ) {
      targetUrl = 'chrome://newtab';
      newTitle = 'علامة تبويب جديدة';
      setUrlInput('');
      setSearchQuery('');
    } else {
      const parsed = parseAndAnalyzeQuery(clean);
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
    }

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
          loading: targetUrl !== 'chrome://newtab',
          isCrashed: false,
        };
      })
    );

    if (targetUrl !== 'chrome://newtab') {
      setTimeout(() => {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, loading: false } : t))
        );
      }, dataSaver ? 60 : 250);
    }
  };

  // التحكم بالتبويبات
  const createNewTab = (initialUrl: string = 'chrome://newtab') => {
    const newId = `tab_${Date.now()}`;
    const newPid = Math.floor(100 + Math.random() * 900);
    const newTab: TabItem = {
      id: newId,
      pid: newPid,
      title: initialUrl === 'chrome://newtab' || initialUrl === 'about:blank' ? 'علامة تبويب جديدة' : initialUrl,
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

  const isNewTabPage =
    activeTab.url === 'chrome://newtab' ||
    activeTab.url === 'about:blank' ||
    activeTab.url === 'https://www.google.com' ||
    activeTab.url === 'https://www.google.com/' ||
    activeTab.url === 'http://www.google.com';

  const isSearchPage = !isNewTabPage && activeTab.url.includes('google.com/search');

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
          onClick={() => createNewTab('chrome://newtab')}
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
            onClick={() => navigateCurrentTab('chrome://newtab')}
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

        {/* زر ترجمة الصفحة عبر القاموس الفوري أونلاين */}
        <button
          type="button"
          onClick={() => setIsTranslateBannerOpen((prev) => !prev)}
          className={`p-2 rounded-full cursor-pointer transition relative ${
            isTranslateBannerOpen || targetLanguage !== 'ar'
              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 ring-2 ring-blue-400/40'
              : 'text-[#5F6368] hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title="ترجمة الصفحة (Translate Page)"
        >
          <Languages className="w-4 h-4" />
          {targetLanguage !== 'ar' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-1 ring-white animate-pulse" />
          )}
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
                onClick={() => {
                  setIsTranslateBannerOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between text-right text-blue-600 font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Languages className="w-3.5 h-3.5" />
                  <span>ترجمة الصفحة (Translate Page)</span>
                </span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.nativeName || 'العربية'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => createNewTab('chrome://newtab')}
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
          شريط ترجمة الصفحة الفوري عبر القاموس الأونلاين (Translate Banner)
      ═══════════════════════════════════════════════════════════════ */}
      {isTranslateBannerOpen && (
        <div className="bg-[#E8F0FE] dark:bg-[#1E293B] border-b border-[#D2E3FC] dark:border-[#334155] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs transition z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white">
                  ترجمة الصفحة (Translate Page)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  قاموس فوري أونلاين متصل
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                استبدال فوري للنصوص والعناوين والمحتوى باللغة التي تختارها
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-2xs">
              <span className="text-[11px] text-gray-400 px-1">اللغة:</span>
              <select
                value={targetLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isTranslating}
                className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer pr-1 pl-2 py-0.5"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {isTranslating ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري استبدال النصوص...</span>
              </div>
            ) : targetLanguage !== 'ar' ? (
              <button
                type="button"
                onClick={handleRestoreOriginal}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold cursor-pointer transition shadow-2xs"
              >
                عرض النص الأصلي (Original)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer transition shadow-2xs"
              >
                ترجمة إلى الإنجليزية
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsTranslateBannerOpen(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 cursor-pointer"
              title="إغلاق شريط الترجمة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. مساحة العرض الرئيسية: محرك بحث جوجل المتكامل أو صفحة الويب
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#202124] relative">
        {isNewTabPage ? (
          <ChromeNewTabPage
            onNavigate={navigateCurrentTab}
            onSearch={(q) => navigateCurrentTab(q)}
            onOpenVoiceSearch={() => {
              setIsVoiceListening(true);
              showToast("🎤 جاري الاستماع لصوتك...");
              setTimeout(() => {
                setIsVoiceListening(false);
                navigateCurrentTab("أفلام سينمائية مترجمة");
              }, 1800);
            }}
          />
        ) : isSearchPage ? (
          <ChromeSERP
            query={searchQuery || currentQueryParsed.clean}
            onSearch={(q) => navigateCurrentTab(q)}
            onNavigate={navigateCurrentTab}
            onPlayVideo={handlePlayVideo}
            targetLanguage={targetLanguage}
            t={t}
          />
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
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads allow-pointer-lock allow-orientation-lock"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
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
          مشغل الفيديو المدمج المتطور مع إعدادات Sandbox وتنسيقات الملفات
      ═══════════════════════════════════════════════════════════════ */}
      {isVideoPlayerOpen && currentPlayingVideo && (() => {
        const embedInfo = getEmbedVideoInfo(currentPlayingVideo.streamUrl);
        const sources = getVideoSourceUrls(currentPlayingVideo.streamUrl);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
            onClick={() => setIsVideoPlayerOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-[#18191A] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col text-white"
            >
              {/* شريط عنوان المشغل */}
              <div className="p-3.5 bg-black/60 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pl-2">
                  <Film className="w-4 h-4 text-rose-500 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold truncate">
                    {t(currentPlayingVideo.title)}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800 font-mono">
                    {embedInfo.isEmbed
                      ? 'IFRAME EMBED'
                      : isMSEActive
                      ? 'MSE SOURCEBUFFER (DASH/HLS)'
                      : `${selectedVideoFormat.toUpperCase()} (H.264/AAC)`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsVideoPlayerOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* مساحة عرض المشغل المدمج */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {embedInfo.isEmbed ? (
                  /* مشغل الفيديو التضميني مع تفعيل Sandbox والصلاحيات الكاملة */
                  <iframe
                    src={embedInfo.embedUrl}
                    title={currentPlayingVideo.title}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads allow-pointer-lock allow-orientation-lock"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  /* عنصر الفيديو المباشر مع دعم التنسيقات المتعددة وتقنية MSE */
                  <video
                    ref={videoPlayerRef}
                    key={`${currentPlayingVideo.id}_${selectedVideoFormat}_${isMSEActive ? 'mse' : 'direct'}`}
                    poster={currentPlayingVideo.thumbnail}
                    controls
                    autoPlay
                    playsInline
                    crossOrigin="anonymous"
                    preload="auto"
                    className="w-full h-full object-contain"
                    onTimeUpdate={(e) => {
                      setVideoCurrentTime(e.currentTarget.currentTime);
                      if (e.currentTarget.duration) {
                        setVideoTotalDuration(e.currentTarget.duration);
                      }
                    }}
                    onLoadedMetadata={(e) => {
                      if (e.currentTarget.duration) {
                        setVideoTotalDuration(e.currentTarget.duration);
                      }
                    }}
                    onWaiting={() => setIsVideoBuffering(true)}
                    onPlaying={() => {
                      setIsVideoBuffering(false);
                      setVideoLoadError(null);
                    }}
                    onCanPlay={() => setIsVideoBuffering(false)}
                    onError={handleVideoError}
                  >
                    {!isMSEActive && (
                      <>
                        {selectedVideoFormat === 'mp4' && (
                          <source
                            src={sources.mp4Url}
                            type="video/mp4; codecs='avc1.42E01E, mp4a.40.2'"
                          />
                        )}
                        {selectedVideoFormat === 'webm' && (
                          <source
                            src={sources.webmUrl}
                            type="video/webm; codecs='vp8, vorbis'"
                          />
                        )}
                        {selectedVideoFormat === 'ogg' && (
                          <source
                            src={sources.oggUrl}
                            type="video/ogg; codecs='theora, vorbis'"
                          />
                        )}
                        {/* مصادر بديلة للمتانة والتوافق الشامل */}
                        <source src={sources.mp4Url} type="video/mp4" />
                        <source src={sources.webmUrl} type="video/webm" />
                        <source src={sources.oggUrl} type="video/ogg" />
                      </>
                    )}
                    <p className="text-xs text-white p-4">
                      متصفحك لا يدعم عنصر الفيديو المباشر أو Media Source Extensions.
                    </p>
                  </video>
                )}

                {/* مؤشر التحميل والتخزين المؤقت */}
                {isVideoBuffering && !embedInfo.isEmbed && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center gap-2 bg-black/70 px-4 py-3 rounded-xl border border-white/10">
                      <RotateCw className="w-6 h-6 text-rose-500 animate-spin" />
                      <span className="text-xs text-white font-semibold">جاري تحميل البث (Buffering)...</span>
                    </div>
                  </div>
                )}

                {/* تنبيه الخطأ والتبديل التلقائي للتنسيق */}
                {videoLoadError && !embedInfo.isEmbed && (
                  <div className="absolute bottom-4 left-4 right-4 bg-amber-950/90 border border-amber-600 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-xl backdrop-blur-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{videoLoadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVideoFormat((prev) => (prev === 'mp4' ? 'webm' : 'mp4'));
                        setVideoLoadError(null);
                      }}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      تبديل التنسيق
                    </button>
                  </div>
                )}
              </div>

              {/* لوحة تحكم أنبوب Media Source Extensions (MSE) و SourceBuffer Pipeline */}
              {!embedInfo.isEmbed && (
                <MSEPlayerPanel
                  stats={mseStats}
                  isMSEActive={isMSEActive}
                  onToggleMSE={handleToggleMSE}
                  onAppendChunkManually={handleAppendChunkManually}
                  onEvictBuffer={handleEvictBuffer}
                  onChangeMimeType={handleChangeMimeType}
                  onChangeMode={handleChangeMode}
                  onResetPipeline={handleResetPipeline}
                  currentTime={videoCurrentTime}
                  videoDuration={videoTotalDuration || 120}
                />
              )}

              {/* أدوات التحكم السفلية */}
              <div className="p-4 bg-[#242526] flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold">
                    {t('محفوظ في السجل للمشاهدة بدون إنترنت 💾')}
                  </span>
                  <span className="text-gray-400 text-[11px] font-mono">
                    ({currentPlayingVideo.duration})
                  </span>
                </div>

                {/* محدد تنسيقات الفيديو المدعومة في عنصر الـ video */}
                {!embedInfo.isEmbed && (
                  <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg border border-gray-700">
                    <span className="text-gray-400 text-[10px]">التنسيق المدعوم:</span>
                    {(['mp4', 'webm', 'ogg'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          setSelectedVideoFormat(fmt);
                          setVideoLoadError(null);
                          showToast(`تم التبديل لتنسيق: ${fmt.toUpperCase()}`);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                          selectedVideoFormat === fmt
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={`تشغيل بتنسيق ${fmt.toUpperCase()}`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-gray-400 ml-1">{t('السرعة:')}</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setVideoPlaybackRate(rate);
                        if (videoPlayerRef.current) videoPlayerRef.current.playbackRate = rate;
                      }}
                      className={`px-2 py-0.5 rounded font-mono font-bold transition cursor-pointer ${
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
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('فتح مكتبة الفيديوهات')}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
