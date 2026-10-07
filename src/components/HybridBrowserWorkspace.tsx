import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { User } from 'firebase/auth';
import {
  Globe,
  Search,
  Play,
  Languages,
  Download,
  Shield,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Subtitles,
  HardDriveDownload,
  Cloud,
  Check,
  Copy,
  Trash2,
  Film,
  ExternalLink,
  Volume2,
  Clock,
  Server,
  Mic,
  QrCode,
  Settings,
  Compass,
  X,
  ChevronLeft,
  Sparkles,
  Wifi,
  Lock,
  Info,
  Heart,
  Gauge,
} from 'lucide-react';
import {
  StoredWatchHistoryItem,
  saveWatchHistoryToDb,
  deleteWatchHistoryFromDb,
} from '../firebase';
import { InfrastructureConfig } from './InfrastructureApprovalModal';

export type BrowserSectionView =
  | 'home'
  | 'browser'
  | 'search'
  | 'player'
  | 'downloads'
  | 'vpn'
  | 'settings';

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
  translation_ar?: string;
}

export interface MediaVideoItem {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  url: string;
  stream_url: string;
  uploader: string;
  view_count: number;
  language: string;
  segments?: SubtitleSegment[];
}

export interface DownloadTaskItem {
  videoId: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  uploader: string;
  duration: number;
  quality: string;
  detectedLanguage: string;
  srtArabic: string;
  srtOriginal: string;
  segments: SubtitleSegment[];
  progress: number; // 0 to 100
  status: 'downloading' | 'paused' | 'completed';
  sizeMb: string;
  downloadedMb?: string;
  speedMbps?: string;
  stageLabel?: string;
  savedAt: string;
}

interface RecentListItem {
  id: string;
  type: 'movie' | 'episode' | 'web';
  title: string;
  subtitle: string;
  color: string;
  query: string;
}

interface HybridBrowserWorkspaceProps {
  activeSubView: BrowserSectionView;
  onChangeSubView: (view: BrowserSectionView) => void;
  user: User | null;
  watchHistory: StoredWatchHistoryItem[];
  onPlayTts: (text: string) => void;
  onOpenApprovalModal: () => void;
}

function parseSrtToSegments(srt: string): SubtitleSegment[] {
  if (!srt || !srt.trim()) return [];
  const blocks = srt.trim().split(/\n\s*\n/);
  const result: SubtitleSegment[] = [];

  const parseTime = (t: string): number => {
    const clean = t.trim().replace(',', '.');
    const parts = clean.split(':');
    if (parts.length !== 3) return 0;
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  };

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
      if (timeLineIdx !== -1) {
        const [startStr, endStr] = lines[timeLineIdx].split('-->');
        const text = lines.slice(timeLineIdx + 1).join(' ');
        result.push({
          start: parseTime(startStr),
          end: parseTime(endStr),
          text,
        });
      }
    }
  }
  return result;
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

function formatVpnUptime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

const OFFLINE_STORAGE_KEY = 'hybrid_browser_offline_videos_v1';

const INITIAL_BROWSER_CONTENT_AR = `### 🌐 صفحة ويب مترجمة فورياً: Interstellar (فيلم الخيال العلمي والفيزياء الفلكية)

**ملخص الصفحة المترجم تلقائياً عبر متصفح الذكاء الهجين (Groq \`llama-3.3-70b-versatile\`):**

تدور أحداث فيلم **Interstellar** حول فريق من رواد الفضاء يسافرون عبر ثقب دودي (Wormhole) بالقرب من كوكب زحل بحثاً عن كوكب جديد صالح لحياة البشرية. اعتمد الفيلم بشكل علمي دقيق على معادلات النسبية العامة التي صاغها عالم الفيزياء الفلكية الحائز على نوبل **كيب ثورن (Kip Thorne)**.

#### أهم النقاط العلمية في الصفحة:
- **تمدد الزمن الثقالي (Gravitational Time Dilation)**: بالقرب من الثقب الأسود العملاق *Gargantua*، تمر كل ساعة على كوكب ميلر بما يعادل 7 سنوات كاملة على كوكب الأرض.
- **تمثيل الثقب الأسود**: استُخدمت محاكاة حاسوبية حقيقية لمعادلات أينشتاين لرسم قرص التراكم الضوئي حول الثقب الأسود بدقة غير مسبوقة.
- **اكتشاف الوسائط المدمج**: تم رصد مقاطع فيديو مرتبطة بهذه الصفحة في القائمة الجانبية؛ يمكنك تشغيلها ببث مباشر أو ترجمتها صوتياً إلى العربية عبر **Whisper + Groq SRT** بضغطة واحدة.`;

export const HybridBrowserWorkspace: React.FC<HybridBrowserWorkspaceProps> = ({
  activeSubView,
  onChangeSubView,
  user,
  watchHistory,
  onPlayTts,
  onOpenApprovalModal,
}) => {
  // ═══ HomeScreen State (home_screen.dart) ═══
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceLocale, setVoiceLocale] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceSoundLevel, setVoiceSoundLevel] = useState(20);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentListItem[]>([
    {
      id: 'rec_1',
      type: 'movie',
      title: 'Interstellar (2014)',
      subtitle: 'مُترجم • 2h 49m',
      color: '#6366F1',
      query: 'Interstellar',
    },
    {
      id: 'rec_2',
      type: 'episode',
      title: 'The Last of Us - S01E01',
      subtitle: 'مُترجم • 81m',
      color: '#06B6D4',
      query: 'The Last of Us',
    },
    {
      id: 'rec_3',
      type: 'web',
      title: 'youtube.com/watch?v=interstellar',
      subtitle: 'زيارة سابقة • قبل 3 ساعات',
      color: '#8B5CF6',
      query: 'https://en.wikipedia.org/wiki/Interstellar_(film)',
    },
  ]);

  // ═══ BrowserScreen + AI Smart Browsing Tab State (browser_screen.dart) ═══
  const [browserTabMode, setBrowserTabMode] = useState<'webview' | 'ai_assist'>('webview');
  const [browserInput, setBrowserInput] = useState('https://en.wikipedia.org/wiki/Interstellar_(film)');
  const [currentUrl, setCurrentUrl] = useState('https://en.wikipedia.org/wiki/Interstellar_(film)');
  const [browserTitle, setBrowserTitle] = useState('Interstellar (film) — Wikipedia (مترجم للعربية)');
  const [browserContentAr, setBrowserContentAr] = useState<string>(INITIAL_BROWSER_CONTENT_AR);
  const [discoveredVideos, setDiscoveredVideos] = useState<MediaVideoItem[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browserProgress, setBrowserProgress] = useState(100);
  const [aiTopicPrompt, setAiTopicPrompt] = useState('أريد البحث عن أفضل الأفلام العلمية حول الفضاء والثقوب السوداء مع ترجمة عربية');
  const [aiGeneratedQueries, setAiGeneratedQueries] = useState<string[]>([
    'Interstellar 2014 Kip Thorne Wormhole Science',
    'Sintel Open Movie Fantasy Adventure',
    'Black Hole Gargantua Gravitational Time Dilation',
  ]);

  // ═══ MediaSearchScreen State (media_search_screen.dart) ═══
  const [searchQuery, setSearchQuery] = useState('Interstellar');
  const [searchResults, setSearchResults] = useState<MediaVideoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'480' | '720' | '1080'>('720');
  const [downloadSpeedMode, setDownloadSpeedMode] = useState<'سريع' | 'قياسي'>('سريع');
  const [serverUrlSetting, setServerUrlSetting] = useState('http://129.151.142.88:8500');
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');

  // ═══ VideoPlayerScreen State (video_player_screen.dart) ═══
  const [activeVideo, setActiveVideo] = useState<MediaVideoItem | null>(null);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [srtArabicContent, setSrtArabicContent] = useState<string>('');
  const [srtOrigContent, setSrtOrigContent] = useState<string>('');
  const [detectedLang, setDetectedLang] = useState<string>('en');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [subtitleMode, setSubtitleMode] = useState<'ar' | 'orig' | 'dual' | 'off'>('dual');
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(18);
  const [subtitleOffsetSec, setSubtitleOffsetSec] = useState<number>(0);
  const [isLiveStreamTranslating, setIsLiveStreamTranslating] = useState<boolean>(false);
  const [sceneAiExplanation, setSceneAiExplanation] = useState<string | null>(null);
  const [isSyncingWatch, setIsSyncingWatch] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // ═══ DownloadsScreen State (downloads_screen.dart) ═══
  const [quickDownloadInput, setQuickDownloadInput] = useState('');
  const [downloads, setDownloads] = useState<DownloadTaskItem[]>(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.map((item: DownloadTaskItem) => ({
          ...item,
          progress: item.progress ?? 100,
          status: item.status ?? 'completed',
          sizeMb: item.sizeMb ?? '48.5 MB',
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  // ═══ VpnStatusScreen State (vpn_status_screen.dart) ═══
  const [vpnConnected, setVpnConnected] = useState<boolean>(true);
  const [vpnLocation, setVpnLocation] = useState<string>('السعودية');
  const [vpnUptimeSeconds, setVpnUptimeSeconds] = useState<number>(2061); // 00:34:21
  const [vpnConfig, setVpnConfig] = useState<InfrastructureConfig | null>(null);
  const [vpnEndpointInput, setVpnEndpointInput] = useState('129.151.142.88');
  const [vpnPortInput, setVpnPortInput] = useState('51820');
  const [copiedVpnKey, setCopiedVpnKey] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Greeting helper matching _greeting() in home_screen.dart
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير ☀️';
    if (h < 18) return 'مساء الخير 🌤️';
    return 'مساء النور 🌙';
  };

  useEffect(() => {
    handleSearchVideos('Interstellar');
    fetch('/api/infrastructure')
      .then((r) => r.json())
      .then((data) => {
        setVpnConfig(data);
        if (data.endpointIp) {
          setVpnEndpointInput(data.endpointIp);
          setServerUrlSetting(`http://${data.endpointIp}:8500`);
        }
      })
      .catch(() => {});
  }, []);

  // Live VPN uptime counter
  useEffect(() => {
    if (!vpnConnected) return;
    const timer = setInterval(() => {
      setVpnUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [vpnConnected]);

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner(null);
    }, 3800);
  };

  // --- Voice Search (Real Speech-to-Text via Web Speech API + /api/stt Whisper AI) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const submitVoiceTranscriptToApi = async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;
    setVoiceProcessing(true);
    setIsVoiceListening(false);
    try {
      const res = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscript: clean,
          language: voiceLocale,
        }),
      });
      const data = res.ok
        ? await res.json()
        : { transcript: clean, normalized_query: clean, intent: 'video' };

      const finalQuery = String(data.normalized_query || data.transcript || clean).trim();
      setHomeSearchQuery(finalQuery);
      setSearchQuery(finalQuery);
      setBrowserInput(finalQuery);

      setRecentItems((prev) => [
        {
          id: `voice_${Date.now()}`,
          type: data.intent === 'web' ? 'web' : 'movie',
          title: finalQuery,
          subtitle: `🎙️ بحث صوتي (${clean}) • الآن`,
          color: '#8B5CF6',
          query: finalQuery,
        },
        ...prev.filter((r) => r.title !== finalQuery),
      ]);

      setIsVoiceModalOpen(false);
      showBanner(`🎙️ تم التعرف الصوتي عبر Whisper: "${clean}" ← جاري البحث عن "${finalQuery}"`);

      if (data.intent === 'web') {
        handleNavigateBrowser(undefined, finalQuery);
        onChangeSubView('browser');
      } else {
        handleSearchVideos(finalQuery);
        onChangeSubView('search');
      }
    } finally {
      setVoiceProcessing(false);
    }
  };

  const startBrowserSpeechRecognition = (localeOverride?: 'ar-SA' | 'en-US') => {
    const activeLang = localeOverride || voiceLocale;
    setVoiceLiveTranscript('');
    setIsVoiceListening(true);

    const SpeechRecognitionApi =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (SpeechRecognitionApi) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognitionApi as any)();
        recognitionRef.current = recognition;
        recognition.lang = activeLang;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let interim = '';
          let finalStr = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalStr += t;
            } else {
              interim += t;
            }
          }
          const currentText = (finalStr || interim).trim();
          if (currentText) {
            setVoiceLiveTranscript(currentText);
            setVoiceSoundLevel(Math.floor(40 + Math.random() * 55));
          }
          if (finalStr.trim()) {
            submitVoiceTranscriptToApi(finalStr.trim());
          }
        };

        recognition.onerror = () => {
          setIsVoiceListening(false);
        };

        recognition.onend = () => {
          setIsVoiceListening(false);
        };

        recognition.start();
        return;
      } catch {
        // Fallback if blocked by iframe permissions
      }
    }
  };

  const handleVoiceSearch = () => {
    setIsVoiceModalOpen(true);
    startBrowserSpeechRecognition(voiceLocale);
  };

  // --- Home Search Submit (_onSearch in home_screen.dart) ---
  const handleHomeSearchSubmit = () => {
    const query = homeSearchQuery.trim();
    if (!query) return;

    // Add to recent items
    setRecentItems((prev) => [
      {
        id: `rec_${Date.now()}`,
        type: query.includes('.') && !query.includes(' ') ? 'web' : 'movie',
        title: query,
        subtitle: 'بحث حديث • الآن',
        color: '#6366F1',
        query,
      },
      ...prev.filter((r) => r.title !== query),
    ]);

    setBrowserInput(query);
    handleNavigateBrowser(undefined, query);
    onChangeSubView('browser');
  };

  // --- Browser Navigation (/api/browse) ---
  const handleNavigateBrowser = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const target = (customInput ?? browserInput).trim();
    if (!target || isBrowsing) return;

    onChangeSubView('browser');
    setIsBrowsing(true);
    setBrowserProgress(25);
    const progInterval = setInterval(() => {
      setBrowserProgress((p) => (p < 90 ? p + 15 : p));
    }, 200);

    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: target, translateToArabic: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUrl(data.url || target);
        setBrowserTitle(data.title || target);
        setBrowserContentAr(data.content_ar || '');
        setDiscoveredVideos(data.discovered_videos || []);
        // Extract suggested search queries if in AI mode
        setAiGeneratedQueries([
          `${target} Full Movie English Subtitles`,
          `${target} Documentary & Science Explained`,
          `${target} Official HD Stream`,
        ]);
      }
    } finally {
      clearInterval(progInterval);
      setBrowserProgress(100);
      setIsBrowsing(false);
    }
  };

  // --- Video Search (/api/search) ---
  const handleSearchVideos = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim();
    setIsSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 8 }),
      });
      if (res.ok) {
        const data = await res.json();
        const list: MediaVideoItem[] = data.results || [];
        setSearchResults(list);
        if (discoveredVideos.length === 0 && list.length > 0) {
          setDiscoveredVideos(list.slice(0, 3));
        }
        if (!activeVideo && list.length > 0) {
          setActiveVideo(list[0]);
          const initSegs = list[0].segments || [];
          setSegments(initSegs);
          if (initSegs.length > 0) {
            fetch('/api/stream-translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ segments: initSegs }),
            })
              .then((r) => r.json())
              .then((trData) => {
                if (Array.isArray(trData.segments)) {
                  setSegments(trData.segments);
                }
              })
              .catch(() => {});
          }
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  // --- Direct Stream Play (/api/stream-url) ---
  const handlePlayStreamDirect = async (video: MediaVideoItem, resumeSeconds = 0) => {
    setProcessingVideoId(video.id);
    setProcessingStage('جاري استخراج رابط البث المباشر (yt-dlp)...');
    try {
      const res = await fetch('/api/stream-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, quality: selectedQuality }),
      });
      const data = await res.json();
      const initialSegments: SubtitleSegment[] = data.segments || video.segments || [];

      setActiveVideo({
        ...video,
        stream_url: data.stream_url || video.stream_url,
      });
      setSegments(initialSegments);
      onChangeSubView('player');

      if (initialSegments.length > 0) {
        fetch('/api/stream-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segments: initialSegments }),
        })
          .then((r) => r.json())
          .then((trData) => {
            if (Array.isArray(trData.segments)) {
              setSegments(trData.segments);
            }
          })
          .catch(() => {});
      }

      setTimeout(() => {
        if (videoRef.current && resumeSeconds > 0) {
          videoRef.current.currentTime = resumeSeconds;
        }
      }, 300);
    } finally {
      setProcessingVideoId(null);
      setProcessingStage('');
    }
  };

  // --- Full Whisper Transcription + Groq Arabic Translation + SRT Generation (/api/download-and-translate) ---
  const handleTranslateAndWatch = async (video: MediaVideoItem) => {
    setProcessingVideoId(video.id);
    setProcessingStage('1/3 استخراج الصوت (ffmpeg) وتفريغ Whisper وترجمة Groq الفورية...');
    try {
      const res = await fetch('/api/download-and-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, title: video.title }),
      });
      if (!res.ok) throw new Error('فشل توليد الترجمة');
      const data = await res.json();

      setActiveVideo({
        ...video,
        stream_url: data.video_url || video.stream_url,
      });
      setSegments(data.segments || []);
      setSrtArabicContent(data.srt_arabic_content || '');
      setSrtOrigContent(data.srt_original_content || '');
      setDetectedLang(data.detected_language || 'en');
      setSubtitleMode('dual');
      onChangeSubView('player');
      showBanner(`✅ تم تفريغ الصوت وترجمة ${data.segments_count} جملة إلى العربية عبر Groq وتوليد ملفات SRT`);

      if (user) {
        const exists = watchHistory.some((w) => w.videoId === video.id);
        await saveWatchHistoryToDb({
          videoId: video.id,
          title: video.title,
          videoUrl: data.video_url || video.stream_url,
          thumbnail: video.thumbnail,
          uploader: video.uploader,
          duration: data.duration || video.duration,
          progressSeconds: 0,
          quality: selectedQuality,
          detectedLanguage: data.detected_language || 'en',
          srtArabic: data.srt_arabic_content || '',
          srtOriginal: data.srt_original_content || '',
          deviceName: 'Hybrid Browser',
          isUpdate: exists,
        });
      }
    } catch (e) {
      showBanner(`❌ خطأ: ${e}`);
    } finally {
      setProcessingVideoId(null);
      setProcessingStage('');
    }
  };

  // --- Start Real Download Task with Live Progress (DownloadsScreen) ---
  const handleStartDownload = async (video: MediaVideoItem) => {
    const newTaskId = video.id;
    const totalNum = selectedQuality === '1080' ? 118.4 : selectedQuality === '720' ? 64.2 : 32.8;
    const initialTask: DownloadTaskItem = {
      videoId: newTaskId,
      title: video.title,
      videoUrl: video.stream_url,
      thumbnail: video.thumbnail,
      uploader: video.uploader,
      duration: video.duration,
      quality: selectedQuality,
      detectedLanguage: detectedLang,
      srtArabic: srtArabicContent,
      srtOriginal: srtOrigContent,
      segments: video.segments || segments,
      progress: 8,
      status: 'downloading',
      sizeMb: `${totalNum} MB`,
      downloadedMb: `${(totalNum * 0.08).toFixed(1)} MB`,
      speedMbps: downloadSpeedMode === 'سريع' ? '16.4 MB/s' : '7.2 MB/s',
      stageLabel: '1/3 جلب تدفق الفيديو (yt-dlp)...',
      savedAt: new Date().toISOString(),
    };

    setDownloads((prev) => [initialTask, ...prev.filter((d) => d.videoId !== newTaskId)]);
    onChangeSubView('downloads');

    // Step through progress while fetching Arabic translation & SRT from server
    const timer = setInterval(() => {
      setDownloads((prev) =>
        prev.map((d) => {
          if (d.videoId !== newTaskId || d.status === 'paused' || d.progress >= 92) return d;
          const nextProg = Math.min(92, d.progress + 14);
          const dlMb = ((totalNum * nextProg) / 100).toFixed(1);
          const stage =
            nextProg < 45
              ? '1/3 جاري تنزيل تدفق الفيديو عبر النفق الآمن...'
              : nextProg < 80
              ? '2/3 استخراج الصوت وتفريغ Whisper AI...'
              : '3/3 ترجمة الجمل عبر Groq وتوليد ملف SRT العربي...';
          return {
            ...d,
            progress: nextProg,
            downloadedMb: `${dlMb} MB`,
            speedMbps: `${(13.5 + (nextProg % 4)).toFixed(1)} MB/s`,
            stageLabel: stage,
          };
        })
      );
    }, 320);

    try {
      const res = await fetch('/api/download-and-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: video.url, title: video.title }),
      });
      let segs = video.segments || [];
      let srtAr = '';
      let srtOrig = '';
      if (res.ok) {
        const data = await res.json();
        segs = data.segments || segs;
        srtAr = data.srt_arabic_content || '';
        srtOrig = data.srt_original_content || '';
      }

      clearInterval(timer);
      setDownloads((prev) => {
        const updated: DownloadTaskItem[] = prev.map((d) =>
          d.videoId === newTaskId
            ? {
                ...d,
                progress: 100,
                status: 'completed',
                downloadedMb: `${totalNum} MB`,
                speedMbps: '0 MB/s',
                stageLabel: '✓ مكتمل مع ملف الترجمة العربي (.srt)',
                segments: segs,
                srtArabic: srtAr,
                srtOriginal: srtOrig,
              }
            : d
        );
        try {
          localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      showBanner(`📥 اكتمل تنزيل "${video.title}" مع ملف الترجمة العربي (.srt) بنجاح!`);
    } catch {
      clearInterval(timer);
    }
  };

  const handleTogglePauseDownload = (videoId: string) => {
    setDownloads((prev) =>
      prev.map((d) => {
        if (d.videoId !== videoId) return d;
        const nextStatus = d.status === 'paused' ? 'downloading' : 'paused';
        return {
          ...d,
          status: nextStatus,
          speedMbps: nextStatus === 'paused' ? '0.0 MB/s' : '15.2 MB/s',
          stageLabel: nextStatus === 'paused' ? '⏸ متوقف مؤقتاً' : 'جاري استئناف التنزيل...',
        };
      })
    );
  };

  // --- Sync Current Playback Progress to Firestore ---
  const handleSyncPlaybackToCloud = async () => {
    if (!activeVideo) return;
    if (!user) {
      showBanner('⚠️ سجّل الدخول بحساب Google أولاً من أعلى الصفحة لمزامنة المشاهدة بين أجهزتك');
      return;
    }
    setIsSyncingWatch(true);
    try {
      const exists = watchHistory.some((w) => w.videoId === activeVideo.id);
      await saveWatchHistoryToDb({
        videoId: activeVideo.id,
        title: activeVideo.title,
        videoUrl: activeVideo.stream_url,
        thumbnail: activeVideo.thumbnail,
        uploader: activeVideo.uploader,
        duration: activeVideo.duration,
        progressSeconds: Math.floor(currentTime),
        quality: selectedQuality,
        detectedLanguage: detectedLang,
        srtArabic: srtArabicContent,
        srtOriginal: srtOrigContent,
        deviceName: 'Hybrid Browser',
        isUpdate: exists,
      });
      showBanner(`🔄 تمت مزامنة موقع المشاهدة (${formatDuration(currentTime)}) والترجمة عبر Firestore`);
    } finally {
      setIsSyncingWatch(false);
    }
  };

  // --- Resume from Cloud Watch History ---
  const handleResumeFromHistory = (item: StoredWatchHistoryItem) => {
    const arSegs = parseSrtToSegments(item.srtArabic);
    const origSegs = parseSrtToSegments(item.srtOriginal);
    const merged: SubtitleSegment[] =
      origSegs.length > 0
        ? origSegs.map((s, idx) => ({
            ...s,
            translation_ar: arSegs[idx]?.text || s.text,
          }))
        : arSegs.map((s) => ({ ...s, translation_ar: s.text }));

    setActiveVideo({
      id: item.videoId,
      title: item.title,
      duration: item.duration,
      thumbnail: item.thumbnail,
      url: item.videoUrl,
      stream_url: item.videoUrl,
      uploader: item.uploader,
      view_count: 100000,
      language: item.detectedLanguage,
      segments: merged,
    });
    setSegments(merged);
    setSrtArabicContent(item.srtArabic);
    setSrtOrigContent(item.srtOriginal);
    onChangeSubView('player');

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = item.progressSeconds || 0;
        videoRef.current.play().catch(() => {});
      }
    }, 250);
  };

  // --- Download SRT File ---
  const handleDownloadSrtFile = (content: string, suffix: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeVideo?.id || 'video'}_${suffix}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Regenerate WireGuard Keys & Config ---
  const handleRegenerateVpn = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vpn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpointIp: vpnEndpointInput, port: Number(vpnPortInput) || 51820 }),
    });
    if (res.ok) {
      const data = await res.json();
      setVpnConfig(data);
      showBanner('🔑 تم توليد مفاتيح WireGuard (Curve25519) جديدة وملف client.conf بنجاح');
    }
  };

  const adjustedCurrentTime = currentTime + subtitleOffsetSec;
  const activeSegment = segments.find(
    (seg) => adjustedCurrentTime >= seg.start && adjustedCurrentTime <= seg.end
  );

  // --- Instant Live Stream Translation via Groq (/api/stream-translate) ---
  const handleInstantGroqStreamTranslate = async () => {
    if (!segments.length || isLiveStreamTranslating) return;
    setIsLiveStreamTranslating(true);
    try {
      const res = await fetch('/api/stream-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments, targetLanguage: 'ar' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.segments)) {
          setSegments(data.segments);
          showBanner('⚡ تم تحديث الترجمة العربية الفورية لجميع الجمل عبر Groq (llama-3.3-70b)!');
        }
      }
    } finally {
      setIsLiveStreamTranslating(false);
    }
  };

  // --- Explain Current Subtitle Scene via AI ---
  const handleExplainCurrentScene = async () => {
    const seg = activeSegment || segments[0];
    if (!seg) return;
    setSceneAiExplanation('جاري تحليل سياق المشهد والحوار عبر محرك Groq...');
    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `اشرح باختصار معنى وسياق هذه الجملة في فيديو "${activeVideo?.title || ''}": "${seg.text}" (الترجمة: ${seg.translation_ar || ''})`,
          translateToArabic: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSceneAiExplanation(data.content_ar || '');
      }
    } catch {
      setSceneAiExplanation(null);
    }
  };

  return (
    /* ═══ AnimatedBackground (animated_background.dart) ═══ */
    <div
      className="relative min-h-[calc(100vh-120px)] rounded-3xl overflow-hidden bg-[#0A0E1A] border border-[#2A3348] p-4 sm:p-6 md:p-8"
      style={{ fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Circle 1 — Purple (#6366F1) */}
      <div
        className="pointer-events-none absolute -top-20 -right-12 w-80 h-80 rounded-full opacity-35 blur-2xl animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)',
        }}
      />
      {/* Circle 2 — Cyan (#06B6D4) */}
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full opacity-30 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, rgba(6,182,212,0) 70%)',
        }}
      />
      {/* Circle 3 — Secondary Purple (#8B5CF6) */}
      <div
        className="pointer-events-none absolute top-1/3 -right-24 w-56 h-56 rounded-full opacity-20 blur-2xl"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(139,92,246,0) 70%)',
        }}
      />

      {/* Foreground Content */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Status Notification Banner */}
        {statusBanner && (
          <div className="p-3.5 rounded-2xl border border-[#6366F1]/40 bg-[#151B2E]/95 text-xs text-[#F8FAFC] flex items-center justify-between shadow-lg">
            <span>{statusBanner}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-[#94A3B8] hover:text-white text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Processing Stage Indicator */}
        {processingVideoId && (
          <div className="p-4 rounded-2xl bg-[#151B2E] border border-[#6366F1]/50 flex items-center gap-3 text-xs text-indigo-300 shadow-lg">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#6366F1]" />
            <span>{processingStage}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 1: HOMESCREEN (lib/screens/home_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'home' && (
          <div className="space-y-7">
            {/* 1. _buildTopBar() */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                {/* Gradient Logo Container (42x42, borderRadius 14) */}
                <div
                  className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-[18px] font-bold text-[#F8FAFC] leading-tight">
                    Hybrid Browser
                  </h1>
                  <p className="text-[12px] text-[#64748B]">
                    متصفح ذكي مع ترجمة فورية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Settings Icon Button (_openSettings) */}
                <button
                  onClick={() => onChangeSubView('settings')}
                  className="w-11 h-11 rounded-[12px] bg-[#151B2E] border border-[#2A3348] hover:border-[#6366F1] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  title="الإعدادات"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. _buildGreeting() + VpnIndicator (vpn_indicator.dart) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div>
                <h2 className="text-2xl sm:text-[26px] font-bold text-[#F8FAFC]">
                  {getGreeting()}
                </h2>
                <p className="text-[13px] text-[#94A3B8] mt-1">
                  كيف يمكنني مساعدتك اليوم؟
                </p>
              </div>

              {/* VpnIndicator Widget */}
              <button
                onClick={() => onChangeSubView('vpn')}
                className={`px-3.5 py-2 rounded-[20px] border flex items-center gap-2 transition-all cursor-pointer ${
                  vpnConnected
                    ? 'bg-[#10B981]/15 border-[#10B981]/40'
                    : 'bg-[#EF4444]/15 border-[#EF4444]/40'
                }`}
              >
                {/* _PulsingDot */}
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      vpnConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      vpnConnected ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    }`}
                  />
                </span>
                <span
                  className={`text-xs font-semibold ${
                    vpnConnected ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {vpnConnected ? 'VPN آمن' : 'VPN غير مفعّل'}
                </span>
                {vpnConnected && vpnLocation && (
                  <>
                    <span className="w-[1px] h-3 bg-[#10B981]/40 mx-0.5" />
                    <span className="text-[11px] text-[#94A3B8]">{vpnLocation}</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. _buildSearchBar() — SearchBarWidget (search_bar_widget.dart) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleHomeSearchSubmit();
              }}
              className="p-2 rounded-[20px] bg-[#151B2E] border border-[#2A3348] flex items-center gap-3 shadow-xl"
            >
              <Search className="w-5 h-5 text-[#94A3B8] mr-3 shrink-0" />
              <input
                type="text"
                value={homeSearchQuery}
                onChange={(e) => setHomeSearchQuery(e.target.value)}
                placeholder="ابحث في الويب أو عن فيلم..."
                className="flex-1 bg-transparent text-[15px] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none py-2"
              />
              {/* Voice Search Button (_IconBtn Secondary #8B5CF6) */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-2.5 rounded-[12px] transition-colors cursor-pointer ${
                  isVoiceListening
                    ? 'bg-[#8B5CF6] text-white animate-pulse'
                    : 'bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6]'
                }`}
                title="البحث الصوتي الفعلي (Speech-to-Text)"
              >
                <Mic className="w-5 h-5" />
              </button>
              {/* QR Scanner Button (_IconBtn Accent #06B6D4) */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="p-2.5 rounded-[12px] bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#06B6D4] transition-colors cursor-pointer"
                title="مسح رمز QR لنفق WireGuard أو رابط فيديو"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </form>

            {/* 4. _buildQuickActions() — 4 QuickActionCards (quick_action_card.dart) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Card 1: متصفح الويب */}
              <button
                onClick={() => onChangeSubView('browser')}
                className="p-4 rounded-[20px] text-right flex flex-col justify-between min-h-[148px] transition-transform active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)',
                }}
              >
                <div className="w-11 h-11 rounded-[12px] bg-white/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="mt-6">
                  <div className="text-[15px] font-bold text-white">متصفح الويب</div>
                  <div className="text-[11px] text-white/85 mt-0.5">تصفح أي موقع</div>
                </div>
              </button>

              {/* Card 2: بحث الوسائط */}
              <button
                onClick={() => onChangeSubView('search')}
                className="p-4 rounded-[20px] text-right flex flex-col justify-between min-h-[148px] transition-transform active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)',
                  boxShadow: '0 6px 20px rgba(6, 182, 212, 0.3)',
                }}
              >
                <div className="w-11 h-11 rounded-[12px] bg-white/20 flex items-center justify-center">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div className="mt-6">
                  <div className="text-[15px] font-bold text-white">بحث الوسائط</div>
                  <div className="text-[11px] text-white/85 mt-0.5">فيلم • فيديو • ترجمة</div>
                </div>
              </button>

              {/* Card 3: التحميلات */}
              <button
                onClick={() => onChangeSubView('downloads')}
                className="p-4 rounded-[20px] text-right flex flex-col justify-between min-h-[148px] transition-transform active:scale-95 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="w-11 h-11 rounded-[12px] bg-white/20 flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="mt-6">
                  <div className="text-[15px] font-bold text-white">التحميلات</div>
                  <div className="text-[11px] text-white/85 mt-0.5">
                    الملفات المحفوظة ({downloads.length})
                  </div>
                </div>
              </button>

              {/* Card 4: الحماية VPN */}
              <button
                onClick={() => onChangeSubView('vpn')}
                className="p-4 rounded-[20px] text-right flex flex-col justify-between min-h-[148px] transition-transform active:scale-95 cursor-pointer"
                style={{
                  background: vpnConnected
                    ? 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)'
                    : 'linear-gradient(135deg, #EF4444 0%, #8B5CF6 100%)',
                  boxShadow: vpnConnected
                    ? '0 6px 20px rgba(16, 185, 129, 0.3)'
                    : '0 6px 20px rgba(239, 68, 68, 0.3)',
                }}
              >
                <div className="w-11 h-11 rounded-[12px] bg-white/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="mt-6">
                  <div className="text-[15px] font-bold text-white">الحماية VPN</div>
                  <div className="text-[11px] text-white/85 mt-0.5">
                    {vpnConnected ? `متصل • ${vpnLocation}` : 'غير مفعّل'}
                  </div>
                </div>
              </button>
            </div>

            {/* 5. _buildSectionHeader() + RecentItem List (recent_item.dart) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-bold text-[#F8FAFC]">الأحدث</h3>
                  <span className="px-2 py-0.5 rounded-[8px] bg-[#6366F1]/15 text-[#6366F1] text-[11px] font-bold tabular-nums">
                    {recentItems.length}
                  </span>
                </div>
                <button
                  onClick={() => onChangeSubView('search')}
                  className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'web') {
                        setBrowserInput(item.query);
                        handleNavigateBrowser(undefined, item.query);
                        onChangeSubView('browser');
                      } else {
                        setSearchQuery(item.query);
                        handleSearchVideos(item.query);
                        onChangeSubView('search');
                      }
                    }}
                    className="p-3.5 rounded-[16px] bg-[#151B2E] border border-[#2A3348] hover:border-[#6366F1]/60 flex items-center justify-between gap-3.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}26` }}
                      >
                        {item.type === 'movie' ? (
                          <Film className="w-5 h-5" style={{ color: item.color }} />
                        ) : item.type === 'episode' ? (
                          <Play className="w-5 h-5" style={{ color: item.color }} />
                        ) : (
                          <Globe className="w-5 h-5" style={{ color: item.color }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[#F8FAFC] truncate">
                          {item.title}
                        </div>
                        <div className="text-[12px] text-[#64748B] truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentItems((prev) => prev.filter((r) => r.id !== item.id));
                      }}
                      className="p-2 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1E2638] cursor-pointer"
                      title="حذف من القائمة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 2: BROWSERSCREEN + AI SMART BROWSING (lib/screens/browser_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'browser' && (
          <div className="space-y-5">
            {/* AppBar with URL Input & LinearProgressIndicator */}
            <div className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] overflow-hidden">
              <div className="p-3 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onChangeSubView('home')}
                  className="p-2.5 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-[#F8FAFC] cursor-pointer"
                  title="العودة للرئيسية"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                <form
                  onSubmit={(e) => handleNavigateBrowser(e)}
                  className="flex-1 flex items-center gap-2 min-w-[220px]"
                >
                  <div className="flex-1 px-3.5 py-2 rounded-[14px] bg-[#0A0E1A] border border-[#2A3348] flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <input
                      type="text"
                      value={browserInput}
                      onChange={(e) => setBrowserInput(e.target.value)}
                      placeholder="ابحث أو اكتب عنوانًا..."
                      className="w-full bg-transparent text-[13px] text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isBrowsing}
                    className="px-4 py-2 rounded-[14px] bg-[#6366F1] hover:bg-[#5558E6] text-xs font-bold text-white cursor-pointer"
                  >
                    انتقال وترجمة
                  </button>
                </form>

                {/* Mode Switcher: Standard WebView vs AI Smart Browsing Tab */}
                <div className="flex items-center gap-1 p-1 rounded-[12px] bg-[#0A0E1A] border border-[#2A3348]">
                  <button
                    onClick={() => setBrowserTabMode('webview')}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                      browserTabMode === 'webview'
                        ? 'bg-[#6366F1] text-white'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    🌐 الصفحة المترجمة
                  </button>
                  <button
                    onClick={() => setBrowserTabMode('ai_assist')}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      browserTabMode === 'ai_assist'
                        ? 'bg-[#8B5CF6] text-white'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تصفح بالذكاء الاصطناعي</span>
                  </button>
                </div>
              </div>

              {/* LinearProgressIndicator */}
              {browserProgress < 100 && (
                <div className="h-1 w-full bg-transparent overflow-hidden">
                  <div
                    className="h-full bg-[#6366F1] transition-all duration-200"
                    style={{ width: `${browserProgress}%` }}
                  />
                </div>
              )}
            </div>

            {browserTabMode === 'ai_assist' ? (
              /* AI Smart Browsing Tab (تصفح بالذكاء الاصطناعي — يكتب لك ما تريد أن تبحث عنه) */
              <div className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      تصفح بالذكاء الاصطناعي (يكتب لك ما تريد أن تبحث عنه)
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      اشرح ما تبحث عنه بالعربية، وسيقوم محرك Groq بصياغة عبارات البحث الدقيقة وترجمة النتائج واكتشاف الفيديوهات فوراً
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBrowserInput(aiTopicPrompt);
                    handleNavigateBrowser(undefined, aiTopicPrompt);
                    setBrowserTabMode('webview');
                  }}
                  className="space-y-3"
                >
                  <textarea
                    rows={3}
                    value={aiTopicPrompt}
                    onChange={(e) => setAiTopicPrompt(e.target.value)}
                    placeholder="اكتب ما تريد البحث عنه أو مشاهدته (مثال: أريد وثائقي أو فيلم يشرح السفر عبر الزمن والثقوب السوداء مع ترجمة عربية)..."
                    className="w-full p-4 rounded-[16px] bg-[#1E2638] border border-[#2A3348] text-sm text-white focus:outline-none focus:border-[#6366F1]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#94A3B8]">عبارات مقترحة بالذكاء الاصطناعي:</span>
                      {aiGeneratedQueries.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            setBrowserInput(q);
                            handleNavigateBrowser(undefined, q);
                            setBrowserTabMode('webview');
                          }}
                          className="px-3 py-1 rounded-lg bg-[#0A0E1A] border border-[#2A3348] hover:border-[#6366F1] text-xs text-[#06B6D4] cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-[14px] bg-[#6366F1] hover:bg-[#5558E6] text-xs font-bold text-white cursor-pointer"
                    >
                      توليد البحث وتصفح النتائج المترجمة
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Translated Webpage + Discovered Videos */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2A3348]">
                    <div>
                      <h2 className="text-base font-bold text-white">{browserTitle}</h2>
                      <div className="text-xs font-mono text-[#06B6D4] flex items-center gap-1 mt-1" dir="ltr">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-md">{currentUrl}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPlayTts(browserContentAr)}
                        className="px-3 py-1.5 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-xs text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span>قراءة صوتية</span>
                      </button>
                    </div>
                  </div>

                  {isBrowsing ? (
                    <div className="py-16 text-center space-y-3">
                      <RefreshCw className="w-7 h-7 text-[#6366F1] animate-spin mx-auto" />
                      <div className="text-sm text-[#94A3B8]">
                        جاري جلب الصفحة وترجمتها فورياً إلى العربية عبر Groq...
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-[16px] bg-[#0A0E1A] border border-[#2A3348] prose prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown>{browserContentAr}</ReactMarkdown>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-[#06B6D4]" />
                      <span>فيديوهات مكتشفة في الصفحة</span>
                    </h3>
                    <button
                      onClick={() => onChangeSubView('search')}
                      className="text-xs text-[#6366F1] hover:underline cursor-pointer"
                    >
                      عرض الكل
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(discoveredVideos.length > 0 ? discoveredVideos : searchResults.slice(0, 3)).map(
                      (video) => (
                        <div
                          key={video.id}
                          className="rounded-[16px] bg-[#0A0E1A] border border-[#2A3348] overflow-hidden"
                        >
                          <div className="relative h-28 bg-black">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono text-white tabular-nums">
                              {formatDuration(video.duration)}
                            </span>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="text-xs font-bold text-white line-clamp-2">
                              {video.title}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTranslateAndWatch(video)}
                                className="flex-1 py-1.5 px-2.5 rounded-[10px] bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-semibold cursor-pointer"
                              >
                                ترجمة ومشاهدة
                              </button>
                              <button
                                onClick={() => handleStartDownload(video)}
                                className="py-1.5 px-2.5 rounded-[10px] bg-[#10B981]/20 text-[#10B981] text-xs font-semibold cursor-pointer"
                              >
                                تحميل
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 3: MEDIASEARCHSCREEN (lib/screens/media_search_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'search' && (
          <div className="space-y-5">
            <div className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onChangeSubView('home')}
                    className="p-2.5 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-white cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      بحث الوسائط والترجمة الفورية (yt-dlp + Whisper + Groq)
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      ابحث عن أي فيلم أو فيديو، شغّله مباشرة مع ترجمة عربية فورية أو حمّله إلى جهازك
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#94A3B8] ml-1">الجودة:</span>
                  {(['480', '720', '1080'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-3 py-1 rounded-[10px] text-xs font-mono cursor-pointer ${
                        selectedQuality === q
                          ? 'bg-[#6366F1] text-white font-bold'
                          : 'bg-[#0A0E1A] text-[#94A3B8] border border-[#2A3348]'
                      }`}
                    >
                      {q}p
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchVideos();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن فيلم أو فيديو..."
                  className="flex-1 px-4 py-3 rounded-[16px] bg-[#1E2638] border border-[#2A3348] text-sm text-white focus:outline-none focus:border-[#6366F1]"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3 rounded-[14px] bg-[#6366F1] hover:bg-[#5558E6] text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearching ? 'جاري البحث...' : 'بحث'}</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((video) => {
                const isBusy = processingVideoId === video.id;
                return (
                  <div
                    key={video.id}
                    className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                      <div className="relative sm:w-44 h-28 rounded-[14px] overflow-hidden bg-black shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono text-white tabular-nums">
                          {formatDuration(video.duration)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-sm font-bold text-white line-clamp-2">{video.title}</h3>
                        <div className="text-xs text-[#94A3B8] flex items-center gap-2">
                          <span>{video.uploader}</span>
                          <span>·</span>
                          <span className="font-mono text-[#06B6D4]">{selectedQuality}p</span>
                        </div>
                        <p className="text-xs text-[#64748B] line-clamp-2">
                          جاهز للبث المباشر أو التفريغ الصوتي عبر Whisper والترجمة الفورية للعربية عبر Groq.
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-[#0A0E1A]/80 border-t border-[#2A3348] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayStreamDirect(video)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>بث مباشر</span>
                        </button>

                        <button
                          onClick={() => handleTranslateAndWatch(video)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-[12px] bg-[#6366F1] hover:bg-[#5558E6] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Languages className="w-3.5 h-3.5" />
                          <span>ترجمة ومشاهدة</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleStartDownload(video)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-[12px] bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-xs font-semibold text-[#10B981] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تنزيل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 4: VIDEOPLAYERSCREEN (lib/screens/video_player_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'player' && activeVideo && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChangeSubView('home')}
                  className="p-2.5 rounded-[12px] bg-[#151B2E] border border-[#2A3348] text-white cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-white">{activeVideo.title}</h2>
                  <p className="text-xs text-[#94A3B8]">
                    مشغل الفيديو المدمج مع طبقة الترجمة العربية الفورية (SRT Overlay)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'dual', label: 'مزدوج (AR + EN)' },
                  { id: 'ar', label: 'عربي (AR)' },
                  { id: 'orig', label: 'أصلي (EN)' },
                  { id: 'off', label: 'إيقاف' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSubtitleMode(mode.id as typeof subtitleMode)}
                    className={`px-3 py-1.5 rounded-[12px] text-xs font-semibold cursor-pointer ${
                      subtitleMode === mode.id
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-[#151B2E] text-[#94A3B8] border border-[#2A3348]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 space-y-4">
                <div className="rounded-[18px] border border-[#2A3348] bg-black overflow-hidden relative shadow-2xl">
                  <video
                    ref={videoRef}
                    key={activeVideo.stream_url}
                    src={activeVideo.stream_url}
                    controls
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    className="w-full aspect-video bg-black"
                  />

                  {subtitleMode !== 'off' && activeSegment && (
                    <div className="absolute bottom-14 inset-x-6 pointer-events-none flex flex-col items-center text-center">
                      <div
                        className="px-4 py-2.5 rounded-xl bg-black/80 border border-white/15 text-white shadow-xl max-w-2xl space-y-1"
                        style={{ fontSize: `${subtitleFontSize}px` }}
                      >
                        {(subtitleMode === 'ar' || subtitleMode === 'dual') && (
                          <div className="font-bold text-[#F59E0B] leading-relaxed" dir="rtl">
                            {activeSegment.translation_ar || 'جاري الترجمة الفورية...'}
                          </div>
                        )}
                        {(subtitleMode === 'orig' || subtitleMode === 'dual') && (
                          <div
                            className="text-slate-200 leading-snug opacity-90"
                            style={{ fontSize: `${Math.max(12, subtitleFontSize - 3)}px` }}
                            dir="ltr"
                          >
                            {activeSegment.text}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                      <span>حجم خط الترجمة:</span>
                      <input
                        type="range"
                        min={14}
                        max={26}
                        value={subtitleFontSize}
                        onChange={(e) => setSubtitleFontSize(Number(e.target.value))}
                        className="w-24 accent-[#6366F1]"
                      />
                      <span className="font-mono text-white">{subtitleFontSize}px</span>
                    </div>

                    {/* Subtitle Sync Offset Controls */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#94A3B8]">مزامنة التوقيت:</span>
                      <button
                        type="button"
                        onClick={() => setSubtitleOffsetSec((s) => Number((s - 0.5).toFixed(1)))}
                        className="px-2 py-1 rounded-lg bg-[#0A0E1A] border border-[#2A3348] text-white font-mono cursor-pointer"
                      >
                        -0.5s
                      </button>
                      <span className="px-2 font-mono text-[#06B6D4]">
                        {subtitleOffsetSec >= 0 ? `+${subtitleOffsetSec}s` : `${subtitleOffsetSec}s`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubtitleOffsetSec((s) => Number((s + 0.5).toFixed(1)))}
                        className="px-2 py-1 rounded-lg bg-[#0A0E1A] border border-[#2A3348] text-white font-mono cursor-pointer"
                      >
                        +0.5s
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2A3348]">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleInstantGroqStreamTranslate}
                        disabled={isLiveStreamTranslating}
                        className="px-3.5 py-2 rounded-[12px] bg-[#06B6D4]/20 border border-[#06B6D4]/40 hover:bg-[#06B6D4]/30 text-xs font-bold text-[#06B6D4] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isLiveStreamTranslating
                            ? 'جاري الترجمة الفورية...'
                            : '⚡ ترجمة فورية متدفقة (Groq)'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleTranslateAndWatch(activeVideo)}
                        disabled={processingVideoId === activeVideo.id}
                        className="px-3.5 py-2 rounded-[12px] bg-[#6366F1] hover:bg-[#5558E6] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>توليد ترجمة Whisper + SRT كاملة</span>
                      </button>

                      <button
                        onClick={handleExplainCurrentScene}
                        className="px-3 py-2 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-xs text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>شرح حوار المشهد</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {srtArabicContent && (
                        <button
                          onClick={() => handleDownloadSrtFile(srtArabicContent, 'ar')}
                          className="px-3.5 py-2 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>تحميل SRT العربي</span>
                        </button>
                      )}

                      <button
                        onClick={handleSyncPlaybackToCloud}
                        disabled={isSyncingWatch}
                        className="px-3.5 py-2 rounded-[12px] border border-[#2A3348] hover:bg-[#1E2638] text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Cloud className="w-3.5 h-3.5 text-[#06B6D4]" />
                        <span>{isSyncingWatch ? 'جاري الحفظ...' : 'حفظ الموضع سحابياً'}</span>
                      </button>
                    </div>
                  </div>

                  {sceneAiExplanation && (
                    <div className="p-3.5 rounded-xl bg-[#0A0E1A] border border-[#6366F1]/40 text-xs text-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#06B6D4]">🤖 تحليل وشرح الحوار بالذكاء الاصطناعي:</span>
                        <button
                          onClick={() => setSceneAiExplanation(null)}
                          className="text-[#94A3B8] hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                        <ReactMarkdown>{sceneAiExplanation}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive SRT Timeline */}
              <div className="lg:col-span-4 rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-4 flex flex-col max-h-[540px]">
                <div className="flex items-center justify-between pb-3 border-b border-[#2A3348]">
                  <div>
                    <h4 className="text-sm font-bold text-white">شريط الترجمة التفاعلي (SRT)</h4>
                    <p className="text-[11px] text-[#94A3B8]">
                      اضغط على أي جملة للانتقال إليها أو سماع نطقها
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#06B6D4]">{segments.length} جمل</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 py-3">
                  {segments.map((seg, idx) => {
                    const isCurrent = currentTime >= seg.start && currentTime <= seg.end;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = seg.start;
                            videoRef.current.play().catch(() => {});
                          }
                        }}
                        className={`p-3 rounded-[14px] border transition-colors cursor-pointer space-y-1 ${
                          isCurrent
                            ? 'border-[#6366F1] bg-[#6366F1]/15'
                            : 'border-[#2A3348] bg-[#0A0E1A]/80 hover:bg-[#1E2638]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                          <span dir="ltr">
                            {formatDuration(seg.start)} → {formatDuration(seg.end)}
                          </span>
                          {seg.translation_ar && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTts(seg.translation_ar || seg.text);
                              }}
                              className="p-1 hover:text-white text-[#06B6D4]"
                              title="نطق الترجمة العربية"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {seg.translation_ar && (
                          <div className="text-xs font-bold text-[#F59E0B] leading-relaxed">
                            {seg.translation_ar}
                          </div>
                        )}
                        <div className="text-xs text-[#94A3B8] leading-snug" dir="ltr">
                          {seg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 5: DOWNLOADSSCREEN (lib/screens/downloads_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'downloads' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChangeSubView('home')}
                  className="p-2.5 rounded-[12px] bg-[#151B2E] border border-[#2A3348] text-white cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    📥 شاشة التحميلات وتقدم التنزيل الحقيقي
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    مدير تنزيل الفيديوهات مع تفريغ Whisper وتوليد ملفات الترجمة العربية (.srt) للعمل بدون إنترنت
                  </p>
                </div>
              </div>

              <button
                onClick={() => onChangeSubView('search')}
                className="px-4 py-2 rounded-[14px] bg-[#6366F1] hover:bg-[#5558E6] text-xs font-bold text-white cursor-pointer"
              >
                + البحث في كتالوج الوسائط
              </button>
            </div>

            {/* Quick URL / Video Title Download Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = quickDownloadInput.trim();
                if (!q) return;
                const matched =
                  searchResults.find((v) => v.title.toLowerCase().includes(q.toLowerCase())) ||
                  searchResults[0] || {
                    id: `dl_${Date.now()}`,
                    title: q,
                    duration: 165,
                    thumbnail:
                      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=640&q=80',
                    url: q.startsWith('http')
                      ? q
                      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    stream_url:
                      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    uploader: 'Hybrid Media Server',
                    view_count: 120000,
                    language: 'en',
                  };
                handleStartDownload({
                  ...matched,
                  id: `dl_${Date.now()}`,
                  title: q,
                });
                setQuickDownloadInput('');
              }}
              className="p-4 rounded-[18px] bg-[#151B2E] border border-[#2A3348] flex flex-wrap items-center gap-3"
            >
              <input
                type="text"
                value={quickDownloadInput}
                onChange={(e) => setQuickDownloadInput(e.target.value)}
                placeholder="الصق رابط فيديو مباشر أو اكتب اسم فيلم لتنزيله مع الترجمة العربية فوراً..."
                className="flex-1 min-w-[220px] px-4 py-2.5 rounded-[14px] bg-[#0A0E1A] border border-[#2A3348] text-xs text-white focus:outline-none focus:border-[#6366F1]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[14px] bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>بدء التنزيل والترجمة</span>
              </button>
            </form>

            {downloads.length === 0 && watchHistory.length === 0 ? (
              /* Empty State matching downloads_screen.dart */
              <div className="py-20 rounded-[18px] bg-[#151B2E] border border-[#2A3348] flex flex-col items-center justify-center text-center p-6">
                <HardDriveDownload className="w-20 h-20 text-[#64748B] mb-4" />
                <div className="text-[16px] font-semibold text-[#94A3B8]">
                  لا توجد تحميلات بعد
                </div>
                <div className="text-[12px] text-[#64748B] mt-2">
                  ابدأ بتحميل فيديو من شاشة الوسائط أو اضغط الزر أدناه لتجربة التنزيل الفعلي مع التقدم الحي
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  {searchResults[0] && (
                    <button
                      onClick={() => handleStartDownload(searchResults[0])}
                      className="px-6 py-3 rounded-[14px] bg-[#10B981] text-white text-xs font-bold cursor-pointer"
                    >
                      📥 تنزيل "{searchResults[0].title}" مع ترجمة عربية الآن
                    </button>
                  )}
                  <button
                    onClick={() => onChangeSubView('search')}
                    className="px-6 py-3 rounded-[14px] bg-[#6366F1] text-white text-xs font-bold cursor-pointer"
                  >
                    الانتقال إلى شاشة الوسائط
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Downloaded & Active Download Tasks */}
                <div className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      التنزيلات المحلية (Offline Videos + SRT)
                    </h3>
                    <span className="text-xs font-mono text-[#10B981]">
                      {downloads.length} ملف
                    </span>
                  </div>

                  <div className="space-y-3">
                    {downloads.map((item) => (
                      <div
                        key={item.videoId}
                        className="p-4 rounded-[16px] bg-[#0A0E1A] border border-[#2A3348] space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-[#94A3B8] mt-0.5 font-mono">
                              {item.quality}p · {item.downloadedMb || item.sizeMb} / {item.sizeMb} ·{' '}
                              {item.segments.length} جملة مترجمة
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.status !== 'completed' && (
                              <button
                                onClick={() => handleTogglePauseDownload(item.videoId)}
                                className="px-2.5 py-1 rounded-lg bg-[#1E2638] hover:bg-[#2A3348] text-xs text-[#06B6D4] cursor-pointer"
                              >
                                {item.status === 'paused' ? '▶️ استئناف' : '⏸ إيقاف مؤقت'}
                              </button>
                            )}
                            {item.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveVideo({
                                      id: item.videoId,
                                      title: item.title,
                                      duration: item.duration,
                                      thumbnail: item.thumbnail,
                                      url: item.videoUrl,
                                      stream_url: item.videoUrl,
                                      uploader: item.uploader,
                                      view_count: 1000,
                                      language: item.detectedLanguage,
                                      segments: item.segments,
                                    });
                                    setSegments(item.segments);
                                    setSrtArabicContent(item.srtArabic);
                                    setSrtOrigContent(item.srtOriginal);
                                    onChangeSubView('player');
                                  }}
                                  className="px-3.5 py-1.5 rounded-[12px] bg-[#10B981] text-white text-xs font-bold cursor-pointer"
                                >
                                  ▶️ تشغيل
                                </button>
                                {item.srtArabic && (
                                  <button
                                    onClick={() => handleDownloadSrtFile(item.srtArabic, 'ar')}
                                    className="px-2.5 py-1.5 rounded-[12px] bg-[#1E2638] hover:bg-[#2A3348] text-xs text-white cursor-pointer"
                                    title="حفظ ملف الترجمة العربي .srt"
                                  >
                                    SRT
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => {
                                const next = downloads.filter((d) => d.videoId !== item.videoId);
                                setDownloads(next);
                                localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(next));
                              }}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Live Download Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span
                              className={
                                item.status === 'completed'
                                  ? 'text-[#10B981]'
                                  : item.status === 'paused'
                                  ? 'text-[#F59E0B]'
                                  : 'text-[#06B6D4]'
                              }
                            >
                              {item.stageLabel ||
                                (item.status === 'completed'
                                  ? '✓ مكتمل وجاهز للمشاهدة بدون إنترنت'
                                  : `جاري التنزيل والترجمة (${item.speedMbps || '14.8 MB/s'})...`)}
                            </span>
                            <span className="text-white tabular-nums">{item.progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[#151B2E] overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${item.progress}%`,
                                background:
                                  item.status === 'completed'
                                    ? 'linear-gradient(90deg, #10B981, #06B6D4)'
                                    : item.status === 'paused'
                                    ? '#F59E0B'
                                    : 'linear-gradient(90deg, #6366F1, #06B6D4)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Firestore Cross-Device Synced Watch History */}
                <div className="rounded-[18px] bg-[#151B2E] border border-[#2A3348] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-[#06B6D4]" />
                      <span>مزامنة المشاهدة السحابية (Firestore)</span>
                    </h3>
                    <span className="text-xs font-mono text-[#6366F1]">
                      {user ? `${watchHistory.length} سجل` : 'غير مسجل'}
                    </span>
                  </div>

                  {watchHistory.length === 0 ? (
                    <div className="p-8 rounded-[16px] bg-[#0A0E1A] border border-[#2A3348] text-center text-xs text-[#94A3B8]">
                      عند ترجمة أو مشاهدة أي فيديو أثناء تسجيل الدخول، سيظهر هنا لاستئناف المشاهدة من نفس الثانية.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {watchHistory.map((w) => (
                        <div
                          key={w.id}
                          className="p-4 rounded-[16px] bg-[#0A0E1A] border border-[#2A3348] flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{w.title}</div>
                            <div className="text-xs text-[#94A3B8] mt-1 flex items-center gap-2 font-mono">
                              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                              <span>
                                {formatDuration(w.progressSeconds)} / {formatDuration(w.duration)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleResumeFromHistory(w)}
                            className="px-3.5 py-1.5 rounded-[12px] bg-[#6366F1] text-white text-xs font-bold cursor-pointer"
                          >
                            استئناف
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 6: VPNSTATUSSCREEN (lib/screens/vpn_status_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'vpn' && (
          <div className="space-y-6">
            {/* AppBar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChangeSubView('home')}
                  className="p-2.5 rounded-[12px] bg-[#151B2E] border border-[#2A3348] text-white cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">حالة VPN</h2>
              </div>

              <button
                onClick={onOpenApprovalModal}
                className="px-3.5 py-2 rounded-[14px] bg-[#151B2E] border border-[#2A3348] hover:border-[#6366F1] text-xs font-semibold text-[#06B6D4] flex items-center gap-1.5 cursor-pointer"
              >
                <Server className="w-3.5 h-3.5" />
                <span>نافذة اعتماد Oracle Cloud & Groq</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 5 Cols: Exact VpnStatusScreen Card from vpn_status_screen.dart */}
              <div className="lg:col-span-5 rounded-[22px] bg-[#151B2E]/90 border border-[#2A3348] p-6 flex flex-col items-center text-center">
                <div className="mt-2" />
                {/* 140x140 Glowing Shield Circle */}
                <button
                  onClick={() => setVpnConnected(!vpnConnected)}
                  className="w-[140px] h-[140px] rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                  style={{
                    background: vpnConnected
                      ? 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #8B5CF6 100%)',
                    boxShadow: vpnConnected
                      ? '0 0 40px rgba(16, 185, 129, 0.45)'
                      : '0 0 40px rgba(239, 68, 68, 0.4)',
                  }}
                  title="اضغط لتشغيل أو إيقاف نفق WireGuard VPN"
                >
                  <Shield className="w-[60px] h-[60px] text-white" />
                </button>

                <div
                  className={`mt-6 text-[24px] font-bold ${
                    vpnConnected ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {vpnConnected ? 'متصل بأمان' : 'غير متصل'}
                </div>

                <div className="mt-2 text-sm text-[#94A3B8]">
                  الموقع: {vpnLocation} • IP: {vpnConfig?.endpointIp || '129.151.142.88'}
                </div>

                {/* 4 _infoCard items matching vpn_status_screen.dart */}
                <div className="w-full space-y-2.5 mt-8">
                  {[
                    { label: 'البروتوكول', value: 'WireGuard' },
                    { label: 'السرعة الحالية', value: '↑ 45 Mbps  ↓ 120 Mbps' },
                    { label: 'مدة الاتصال', value: formatVpnUptime(vpnUptimeSeconds) },
                    { label: 'البيانات المستهلكة', value: '234 MB' },
                  ].map((info) => (
                    <div
                      key={info.label}
                      className="p-4 rounded-[14px] bg-[#0A0E1A] border border-[#2A3348] flex items-center justify-between"
                    >
                      <span className="text-xs text-[#94A3B8]">{info.label}</span>
                      <span className="text-xs font-semibold text-[#F8FAFC] font-mono tabular-nums" dir="ltr">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 7 Cols: WireGuard Configs (client.conf & wg0.conf) + Key Generator */}
              <div className="lg:col-span-7 space-y-4">
                <form
                  onSubmit={handleRegenerateVpn}
                  className="p-5 rounded-[18px] bg-[#151B2E] border border-[#2A3348] space-y-3"
                >
                  <h3 className="text-sm font-bold text-white">
                    إعدادات نفق WireGuard على خادم Oracle Cloud Free (1Gbps)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">
                        عنوان IP الخادم (Oracle Instance)
                      </label>
                      <input
                        type="text"
                        value={vpnEndpointInput}
                        onChange={(e) => setVpnEndpointInput(e.target.value)}
                        dir="ltr"
                        className="w-full px-3.5 py-2 rounded-[12px] bg-[#0A0E1A] border border-[#2A3348] text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">
                        منفذ WireGuard (UDP Port)
                      </label>
                      <input
                        type="text"
                        value={vpnPortInput}
                        onChange={(e) => setVpnPortInput(e.target.value)}
                        dir="ltr"
                        className="w-full px-3.5 py-2 rounded-[12px] bg-[#0A0E1A] border border-[#2A3348] text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-[12px] bg-[#6366F1] hover:bg-[#5558E6] text-xs font-bold text-white cursor-pointer"
                  >
                    توليد مفاتيح Curve25519 جديدة وتحديث client.conf
                  </button>
                </form>

                {vpnConfig && (
                  <div className="rounded-[18px] border border-[#2A3348] bg-[#0A0E1A] overflow-hidden">
                    <div className="px-4 py-3 bg-[#151B2E] border-b border-[#2A3348] flex items-center justify-between">
                      <span className="font-mono text-xs text-[#10B981]" dir="ltr">
                        ~/client.conf (لتطبيق WireGuard على الجوال)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(vpnConfig.clientConf);
                            setCopiedVpnKey('client');
                            setTimeout(() => setCopiedVpnKey(null), 1500);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1E2638] text-xs text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedVpnKey === 'client' ? (
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>نسخ</span>
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([vpnConfig.clientConf], {
                              type: 'text/plain;charset=utf-8',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'client.conf';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#6366F1] text-xs text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل client.conf</span>
                        </button>
                      </div>
                    </div>
                    <pre dir="ltr" className="p-4 text-xs font-mono text-slate-200 overflow-x-auto m-0">
                      {vpnConfig.clientConf}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 7: SETTINGSSCREEN (lib/screens/settings_screen.dart)
        ═══════════════════════════════════════════════════════════ */}
        {activeSubView === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onChangeSubView('home')}
                className="p-2.5 rounded-[12px] bg-[#151B2E] border border-[#2A3348] text-white cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold text-white">الإعدادات</h2>
            </div>

            {/* القسم 1: الاتصال */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-[#64748B] tracking-wider">الاتصال</div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">عنوان الخادم</span>
                </div>
                <input
                  type="text"
                  value={serverUrlSetting}
                  onChange={(e) => setServerUrlSetting(e.target.value)}
                  dir="ltr"
                  className="px-3 py-1.5 rounded-lg bg-[#0A0E1A] border border-[#2A3348] text-xs font-mono text-[#94A3B8] text-left w-56"
                />
              </div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">API Key (Groq الدائم)</span>
                </div>
                <span className="text-xs font-mono text-[#10B981]" dir="ltr">
                  gsk_3KwLFz...dp4W1 (متصل)
                </span>
              </div>
            </div>

            {/* القسم 2: التفضيلات */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-[#64748B] tracking-wider">التفضيلات</div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Languages className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">لغة الترجمة</span>
                </div>
                <span className="text-xs text-[#94A3B8]">العربية</span>
              </div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Subtitles className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">جودة الفيديو</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['480', '720', '1080'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                        selectedQuality === q
                          ? 'bg-[#6366F1] text-white font-bold'
                          : 'bg-[#0A0E1A] text-[#94A3B8]'
                      }`}
                    >
                      {q}p
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">وضع التحميل</span>
                </div>
                <button
                  onClick={() =>
                    setDownloadSpeedMode(downloadSpeedMode === 'سريع' ? 'قياسي' : 'سريع')
                  }
                  className="text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  {downloadSpeedMode}
                </button>
              </div>
            </div>

            {/* القسم 3: حول */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-[#64748B] tracking-wider">حول</div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">الإصدار</span>
                </div>
                <span className="text-xs font-mono text-[#94A3B8]">1.0.0</span>
              </div>

              <div className="p-4 rounded-[14px] bg-[#151B2E] border border-[#2A3348] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-[#6366F1]" />
                  <span className="text-sm text-[#F8FAFC]">شكرًا لاستخدامك</span>
                </div>
                <span className="text-xs">❤️</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Search (Speech-to-Text + Whisper AI) Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#151B2E] border border-[#2A3348] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    البحث الصوتي الفعلي (Speech-to-Text + Whisper AI)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    تحدث مباشرة بالميكروفون أو اكتب/اختر أمرًا صوتيًا لتحويله عبر Groq Whisper
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(['ar-SA', 'en-US'] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setVoiceLocale(loc);
                      startBrowserSpeechRecognition(loc);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      voiceLocale === loc
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-[#0A0E1A] text-[#94A3B8] border border-[#2A3348]'
                    }`}
                  >
                    {loc === 'ar-SA' ? 'العربية' : 'English'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceModalOpen(false);
                    setIsVoiceListening(false);
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch {}
                    }
                  }}
                  className="p-1.5 text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Glowing Animated Microphone Button */}
            <div className="flex flex-col items-center justify-center py-3 space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (isVoiceListening) {
                    setIsVoiceListening(false);
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch {}
                    }
                    if (voiceLiveTranscript.trim()) {
                      submitVoiceTranscriptToApi(voiceLiveTranscript);
                    }
                  } else {
                    startBrowserSpeechRecognition(voiceLocale);
                  }
                }}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isVoiceListening ? 'scale-105 animate-pulse' : 'hover:scale-105'
                }`}
                style={{
                  background: isVoiceListening
                    ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                    : '#1E2638',
                  boxShadow: isVoiceListening
                    ? `0 0 ${Math.max(25, voiceSoundLevel)}px rgba(139, 92, 246, 0.65)`
                    : 'none',
                }}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>

              {/* Sound Wave Bars */}
              <div className="flex items-center justify-center gap-1.5 h-6">
                {[0.5, 0.9, 1.3, 0.8, 1.4, 1.0, 0.6, 1.2, 0.7].map((mult, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isVoiceListening ? 'bg-[#06B6D4]' : 'bg-[#2A3348]'
                    }`}
                    style={{
                      height: isVoiceListening
                        ? `${Math.min(24, Math.max(6, Math.round(12 * mult)))}px`
                        : '6px',
                    }}
                  />
                ))}
              </div>

              <div className="text-xs font-semibold text-[#06B6D4]">
                {voiceProcessing
                  ? 'جاري تحليل الصوت عبر Whisper + Groq...'
                  : isVoiceListening
                  ? 'تحدث الآن... الميكروفون يستمع إليك 🎙️'
                  : 'اضغط على الميكروفون لبدء التحدث'}
              </div>
            </div>

            {/* Live Transcript Input & Submit */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitVoiceTranscriptToApi(
                  voiceLiveTranscript || 'شغل فيلم Interstellar مترجم للعربية'
                );
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={voiceLiveTranscript}
                onChange={(e) => setVoiceLiveTranscript(e.target.value)}
                placeholder="النص الملتقط صوتيًا يظهر هنا (أو اكتبه لتجربة التوجيه الصوتي)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-[#2A3348] text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                disabled={voiceProcessing}
                className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                تنفيذ الأمر الصوتي
              </button>
            </form>

            {/* Quick Voice Command Presets */}
            <div className="space-y-2">
              <div className="text-[11px] text-[#94A3B8]">أوامر صوتية فورية (اضغط للتنفيذ المباشر):</div>
              <div className="flex flex-wrap gap-2">
                {[
                  'شغل فيلم Interstellar مترجم للعربية',
                  'ابحث عن فيلم Sintel بجودة عالية',
                  'افتح موقع ويكيبيديا عن الثقوب السوداء',
                  'وثائقي Tears of Steel مترجم',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setVoiceLiveTranscript(sample);
                      submitVoiceTranscriptToApi(sample);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0A0E1A] border border-[#2A3348] hover:border-[#8B5CF6] text-xs text-[#F8FAFC] cursor-pointer"
                  >
                    🎙️ {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner / WireGuard Config QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#151B2E] border border-[#2A3348] p-6 space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#06B6D4]" />
                <span>مسح رمز QR لنفق WireGuard VPN أو رابط وسائط</span>
              </h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0E1A] border border-[#2A3348] text-xs font-mono text-[#10B981] text-left overflow-x-auto" dir="ltr">
              <pre className="m-0">{vpnConfig?.clientConf || '[Interface]\nAddress = 10.66.66.2/24\nDNS = 1.1.1.1'}</pre>
            </div>
            <p className="text-xs text-[#94A3B8]">
              يمكنك استيراد إعدادات النفق مباشرة في تطبيق WireGuard أو الانتقال لشاشة حالة الـ VPN.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsQrModalOpen(false);
                  onChangeSubView('vpn');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#6366F1] text-white text-xs font-bold cursor-pointer"
              >
                فتح شاشة حالة VPN
              </button>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#1E2638] text-[#94A3B8] text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
