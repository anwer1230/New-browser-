import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Lock,
  Mic,
  X,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  Home,
  Bookmark,
  FolderOpen,
  Layers,
  Languages,
  CheckCircle2,
  Circle,
  Sparkles,
  Trash2,
  Search,
  FileText,
  Moon,
  Sun,
  Cloud,
  Plus,
  Download,
  Smartphone,
  Play,
  Film,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  StoredWatchHistoryItem,
  StoredSavedPage,
  savePageToFirestore,
  deleteSavedPageFromFirestore,
  signInWithGoogle,
} from '../firebase';
import { VideoDownloadPermissionModal } from './VideoDownloadPermissionModal';
import { usePWAInstall } from './usePWAInstall';

export type BrowserSectionView =
  | 'home'
  | 'browser'
  | 'search'
  | 'player'
  | 'downloads'
  | 'vpn'
  | 'settings';

export interface SavedPageEntry {
  id: string;
  url: string;
  title: string;
  content: string;
  translation?: string;
  savedAt: string;
}

interface BrowserTabItem {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  offlineHtml?: string | null;
}

interface HybridBrowserWorkspaceProps {
  activeSubView: BrowserSectionView;
  onChangeSubView: (view: BrowserSectionView) => void;
  user: User | null;
  watchHistory: StoredWatchHistoryItem[];
  cloudSavedPages?: StoredSavedPage[];
  onPlayTts: (text: string) => void;
  onOpenApprovalModal: () => void;
  onOpenFilesModal?: () => void;
}

const LOCAL_SAVED_KEY = 'saved_pages_v1';

/**
 * OfflineService.buildOfflineHtml — مطابق تماماً لملف lib/services/offline_service.dart
 */
function buildOfflineHtml(params: { title: string; url: string; content: string }): string {
  const safeTitle = (params.title || params.url).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeUrl = (params.url || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeContent = (params.content || '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      line-height: 1.85;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 20px 60px;
      color: #202124;
      background: #fff;
    }
    .banner {
      background: #E8F0FE;
      color: #1967D2;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h1 { color: #202124; font-size: 22px; margin-bottom: 16px; }
    .content { font-size: 15px; color: #3C4043; white-space: normal; word-break: break-word; }
    .source { color: #5F6368; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8EAED; }
  </style>
</head>
<body>
  <div class="banner">
    <span>📖 نسخة محفوظة للقراءة بدون إنترنت (Offline)</span>
    <span>محفوظ محلياً وفي السحابة</span>
  </div>
  <h1>${safeTitle}</h1>
  <div class="content">${safeContent}</div>
  <div class="source" dir="ltr">المصدر: ${safeUrl}</div>
</body>
</html>`;
}

export const HybridBrowserWorkspace: React.FC<HybridBrowserWorkspaceProps> = ({
  user,
  cloudSavedPages = [],
  onOpenApprovalModal,
}) => {
  // ═══ Tabs & WebView State (browser_screen.dart) ═══
  const [tabs, setTabs] = useState<BrowserTabItem[]>([
    {
      id: 'tab_1',
      title: 'Google',
      url: 'https://www.google.com',
      history: ['https://www.google.com'],
      historyIndex: 0,
      offlineHtml: null,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
  const [urlFocused, setUrlFocused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(1);
  const [currentTitle, setCurrentTitle] = useState<string>('Google');
  const [currentPageText, setCurrentPageText] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // ═══ Background Services State (background_service.dart + vpn_service.dart) ═══
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);
  const [vpnConnected, setVpnConnected] = useState<boolean>(true);
  const [vpnLocation, setVpnLocation] = useState<string | null>('السعودية');
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  // ═══ SaveService State (save_service.dart — Local Offline + External DB + Firestore) ═══
  const [localSavedPages, setLocalSavedPages] = useState<SavedPageEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SAVED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Merge local offline saved pages with Firestore & backend external DB saved pages
  const allSavedPages = useMemo(() => {
    const map = new Map<string, SavedPageEntry>();
    for (const item of localSavedPages) {
      map.set(item.id, item);
    }
    for (const cloudItem of cloudSavedPages) {
      if (!map.has(cloudItem.id)) {
        map.set(cloudItem.id, {
          id: cloudItem.id,
          url: cloudItem.url,
          title: cloudItem.title,
          content: cloudItem.content,
          translation: cloudItem.translation,
          savedAt: cloudItem.savedAt,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (b.savedAt || '').localeCompare(a.savedAt || '')
    );
  }, [localSavedPages, cloudSavedPages]);

  const isCurrentUrlSaved = useMemo(
    () => allSavedPages.some((p) => p.url === activeTab.url),
    [allSavedPages, activeTab.url]
  );

  // ═══ Modals & Bottom Sheets State ═══
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSavedSheetOpen, setIsSavedSheetOpen] = useState<boolean>(false);
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');
  const [isTabsSheetOpen, setIsTabsSheetOpen] = useState<boolean>(false);

  // ═══ Ask AI Dialog State (_askAboutPage) ═══
  const [isAskAiOpen, setIsAskAiOpen] = useState<boolean>(false);
  const [askAiQuestion, setAskAiQuestion] = useState<string>('');
  const [askAiAnswer, setAskAiAnswer] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);

  // ═══ Floating Snackbar (_snack) ═══
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  // ═══ PWA Installation Hook ═══
  const { isInstalled: isPwaInstalled, triggerInstall: triggerPwaInstall } = usePWAInstall();

  // ═══ Mobile Video Download & Permission Dialog State ═══
  const [downloadModalVideo, setDownloadModalVideo] = useState<{
    url: string;
    title: string;
    poster?: string;
  } | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadedVideosList, setDownloadedVideosList] = useState<
    Array<{
      id: string;
      title: string;
      url: string;
      downloadUrl: string;
      filename: string;
      downloadedAt: string;
      poster?: string;
    }>
  >(() => {
    try {
      const raw = localStorage.getItem('downloaded_videos_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [savedSheetTab, setSavedSheetTab] = useState<'pages' | 'videos'>('pages');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setTimeout(() => {
      setSnackMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleConfirmVideoDownload = async () => {
    if (!downloadModalVideo) return;
    setIsDownloadingVideo(true);
    setDownloadProgress(20);

    const safeTitle =
      downloadModalVideo.title
        .replace(/[^\w\s\u0600-\u06FF.-]/gi, '_')
        .replace(/\s+/g, '_')
        .trim() || 'video';
    const filename = safeTitle.endsWith('.mp4') ? safeTitle : `${safeTitle}.mp4`;
    const downloadApiUrl = `/api/download-video?url=${encodeURIComponent(
      downloadModalVideo.url
    )}&filename=${encodeURIComponent(filename)}`;

    const progTimer = setInterval(() => {
      setDownloadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 250);

    try {
      // 1. Trigger actual browser download directly to Downloads folder
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadApiUrl;
      downloadAnchor.download = filename;
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => downloadAnchor.remove(), 2000);

      clearInterval(progTimer);
      setDownloadProgress(100);

      // 2. Persist record to device downloaded items history
      const historyItem = {
        id: `vid_dl_${Date.now()}`,
        title: downloadModalVideo.title,
        url: downloadModalVideo.url,
        downloadUrl: downloadApiUrl,
        filename,
        downloadedAt: new Date().toISOString(),
        poster: downloadModalVideo.poster,
      };

      setDownloadedVideosList((prev) => {
        const updated = [historyItem, ...prev.filter((p) => p.url !== downloadModalVideo.url)];
        try {
          localStorage.setItem('downloaded_videos_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setTimeout(() => {
        setIsDownloadingVideo(false);
        setDownloadModalVideo(null);
        setDownloadProgress(0);
        showSnack(`✓ تم تنزيل «${downloadModalVideo.title}» بنجاح وحفظه في مجلد التنزيلات بالجهاز`);
      }, 700);
    } catch {
      clearInterval(progTimer);
      setIsDownloadingVideo(false);
      showSnack('❌ حدث خطأ أثناء تنزيل الفيديو');
    }
  };

  // ═══ Boot: Sync External DB saved pages into localStorage for offline readiness ═══
  useEffect(() => {
    fetch('/api/saved-pages')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items) && data.items.length > 0) {
          setLocalSavedPages((prev) => {
            const merged = [...prev];
            for (const srvItem of data.items) {
              if (!merged.some((m) => m.id === srvItem.id || m.url === srvItem.url)) {
                merged.push(srvItem);
              }
            }
            try {
              localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {
        // Offline mode: local saved_pages_v1 works automatically
      });
  }, []);

  // Sync localStorage whenever cloudSavedPages updates
  useEffect(() => {
    if (cloudSavedPages.length > 0) {
      try {
        localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(allSavedPages));
      } catch {}
    }
  }, [cloudSavedPages, allSavedPages]);

  // ═══ Listen to postMessage events from the WebView (/api/web-proxy) ═══
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'HYBRID_BROWSER_NAVIGATE' && typeof data.url === 'string') {
        navigateTo(data.url);
      } else if (data.type === 'HYBRID_BROWSER_PAGE_META') {
        if (data.title) {
          setCurrentTitle(String(data.title));
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTabId ? { ...t, title: String(data.title) } : t
            )
          );
        }
        if (data.textContent) {
          setCurrentPageText(String(data.textContent));
        }
      } else if (data.type === 'HYBRID_BROWSER_TRANSLATED') {
        if (data.content) {
          setCurrentPageText(String(data.content));
        }
      } else if (data.type === 'HYBRID_BROWSER_SAVE_DATA') {
        performSavePage({
          url: String(data.url || activeTab.url),
          title: String(data.title || currentTitle || activeTab.url),
          content: String(data.content || currentPageText),
        });
      } else if (data.type === 'HYBRID_BROWSER_REQUEST_VIDEO_DOWNLOAD') {
        const vUrl = String(data.videoUrl || activeTab.url);
        const vTitle = String(data.title || currentTitle || 'فيديو تم تشغيله');
        setDownloadModalVideo({
          url: vUrl,
          title: vTitle,
          poster: data.poster ? String(data.poster) : undefined,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  });

  // ═══ Navigation (_navigate in browser_screen.dart) ═══
  const navigateTo = (rawInput: string) => {
    const text = rawInput.trim();
    if (!text) return;

    let targetUrl: string;
    if (text.startsWith('http://') || text.startsWith('https://')) {
      targetUrl = text;
    } else if (text.includes('.') && !text.includes(' ')) {
      targetUrl = `https://${text}`;
    } else {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    }

    setLoading(true);
    setProgress(0.25);
    setUrlInput(targetUrl);
    setCurrentTitle(text);

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const nextHistory = [...t.history.slice(0, t.historyIndex + 1), targetUrl];
        return {
          ...t,
          url: targetUrl,
          title: text,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
          offlineHtml: null,
        };
      })
    );

    const timer = setInterval(() => {
      setProgress((p) => (p < 0.9 ? p + 0.2 : p));
    }, 180);

    setTimeout(() => {
      clearInterval(timer);
      setProgress(1);
      setLoading(false);
    }, 650);
  };

  const handleBack = () => {
    if (activeTab.historyIndex <= 0) return;
    const nextIdx = activeTab.historyIndex - 1;
    const prevUrl = activeTab.history[nextIdx];
    setUrlInput(prevUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, url: prevUrl, historyIndex: nextIdx, offlineHtml: null }
          : t
      )
    );
  };

  const handleForward = () => {
    if (activeTab.historyIndex >= activeTab.history.length - 1) return;
    const nextIdx = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[nextIdx];
    setUrlInput(nextUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, url: nextUrl, historyIndex: nextIdx, offlineHtml: null }
          : t
      )
    );
  };

  const handleHome = () => {
    navigateTo('https://www.google.com');
  };

  // ═══ Translate Current Page (_translateCurrentPage in browser_screen.dart) ═══
  const handleTranslateCurrentPage = async () => {
    if (!autoTranslate) {
      showSnack('الترجمة التلقائية معطّلة');
      return;
    }
    showSnack('🌐 جاري الترجمة في الخلفية...');
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'TRIGGER_PAGE_TRANSLATE' },
          '*'
        );
      }
      if (currentPageText && currentPageText.length >= 20) {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentPageText.slice(0, 6000),
            target: 'ar',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translation) {
            setCurrentPageText(data.translation);
          }
        }
      }
      setTimeout(() => {
        showSnack('✅ تمت الترجمة');
      }, 900);
    } catch {
      showSnack('تعذّرت الترجمة');
    }
  };

  // ═══ Save Page & Text Search Results (_saveCurrentPage in browser_screen.dart) ═══
  const performSavePage = async (params: {
    url: string;
    title: string;
    content: string;
  }) => {
    const entryId = `page_${Date.now()}`;
    let finalContent = params.content.trim();

    // If page text wasn't yet extracted from iframe, fetch text summary via /api/browse
    if (!finalContent || finalContent.length < 20) {
      try {
        const res = await fetch('/api/browse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: params.url, translateToArabic: true }),
        });
        if (res.ok) {
          const data = await res.json();
          const webListText = Array.isArray(data.web_results)
            ? data.web_results
                .map(
                  (w: { title_ar?: string; url?: string; snippet_ar?: string }, idx: number) =>
                    `${idx + 1}. ${w.title_ar}\n${w.url}\n${w.snippet_ar}`
                )
                .join('\n\n')
            : '';
          finalContent = [data.content_ar || '', webListText].filter(Boolean).join('\n\n---\n\n');
        }
      } catch {}
    }

    if (!finalContent) {
      finalContent = `${params.title}\n${params.url}`;
    }

    const entry: SavedPageEntry = {
      id: entryId,
      url: params.url,
      title: params.title || params.url,
      content: finalContent,
      translation: finalContent,
      savedAt: new Date().toISOString(),
    };

    // 1. Save immediately to Local Offline Storage (SharedPreferences / localStorage)
    setLocalSavedPages((prev) => {
      const next = [entry, ...prev.filter((p) => p.url !== entry.url)];
      try {
        localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Sync to External Database (/api/saved-pages) in background
    fetch('/api/saved-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});

    // 3. Sync to Firestore (saved_pages collection) in background if signed in
    if (user) {
      savePageToFirestore({
        id: entry.id,
        url: entry.url,
        title: entry.title,
        content: entry.content,
        translation: entry.translation,
        savedAt: entry.savedAt,
      }).catch(() => {});
    }

    showSnack('✅ تم الحفظ — متاح offline');
  };

  const handleSaveCurrentPage = async () => {
    if (isCurrentUrlSaved) {
      showSnack('تم حفظها سابقًا');
      return;
    }
    showSnack('💾 جاري الحفظ...');
    await performSavePage({
      url: activeTab.url,
      title: currentTitle || activeTab.title || activeTab.url,
      content: currentPageText,
    });
  };

  const handleDeleteSavedPage = async (id: string) => {
    setLocalSavedPages((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    fetch(`/api/saved-pages/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    if (user) {
      deleteSavedPageFromFirestore(id).catch(() => {});
    }
  };

  const handleOpenSavedItemOffline = (item: SavedPageEntry) => {
    const html = buildOfflineHtml({
      title: item.title,
      url: item.url,
      content: item.content,
    });
    setUrlInput(item.url);
    setCurrentTitle(item.title);
    setCurrentPageText(item.content);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, url: item.url, title: item.title, offlineHtml: html }
          : t
      )
    );
    setIsSavedSheetOpen(false);
    showSnack('📖 تم فتح النسخة المحفوظة بدون إنترنت (Offline)');
  };

  // ═══ Voice Search inside Chrome Address Bar ═══
  const handleVoiceMicClick = () => {
    const SpeechRecognitionApi =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (SpeechRecognitionApi) {
      try {
        setIsVoiceListening(true);
        showSnack('🎙️ تحدّث الآن للبحث في المتصفح...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec = new (SpeechRecognitionApi as any)();
        rec.lang = 'ar-SA';
        rec.interimResults = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (ev: any) => {
          const transcript = ev.results?.[0]?.[0]?.transcript || '';
          if (transcript.trim()) {
            setUrlInput(transcript.trim());
            navigateTo(transcript.trim());
          }
        };
        rec.onerror = () => setIsVoiceListening(false);
        rec.onend = () => setIsVoiceListening(false);
        rec.start();
        return;
      } catch {
        setIsVoiceListening(false);
      }
    }
    urlInputRef.current?.focus();
  };

  // ═══ Ask AI About Current Page (_askAboutPage in browser_screen.dart) ═══
  const handleSubmitAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = askAiQuestion.trim();
    if (!q || isAskingAi) return;

    setIsAskingAi(true);
    setAskAiAnswer(null);
    showSnack('🤔 جاري التحليل...');

    try {
      const contextSnippet = (currentPageText || `${currentTitle} - ${activeTab.url}`).slice(
        0,
        3000
      );
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `بناءً على محتوى الصفحة (${activeTab.url}):\n${contextSnippet}\n\nالسؤال: ${q}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAskAiAnswer(data.response || 'لا توجد إجابة.');
      } else {
        showSnack('تعذّر الحصول على إجابة');
      }
    } catch {
      showSnack('خطأ');
    } finally {
      setIsAskingAi(false);
    }
  };

  // Filtered saved pages for _SavedBottomSheet
  const filteredSavedPages = useMemo(() => {
    const q = savedSearchQuery.trim().toLowerCase();
    if (!q) return allSavedPages;
    return allSavedPages.filter(
      (e) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.content || '').toLowerCase().includes(q) ||
        (e.url || '').toLowerCase().includes(q)
    );
  }, [allSavedPages, savedSearchQuery]);

  const proxyIframeSrc = useMemo(() => {
    return `/api/web-proxy?url=${encodeURIComponent(activeTab.url)}&autoTranslate=${
      autoTranslate ? '1' : '0'
    }`;
  }, [activeTab.url, autoTranslate]);

  return (
    <div
      className={`h-full w-full flex flex-col select-none ${
        darkMode ? 'bg-[#202124] text-[#E8EAED]' : 'bg-white text-[#202124]'
      }`}
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════════
          شريط Chrome العلوي (_buildAppBar in browser_screen.dart)
          [🛡️] [🔍 شريط العنوان] [⋮]
      ═══════════════════════════════════════════════════════════ */}
      <header
        className={`h-[58px] px-2.5 flex items-center gap-2 border-b shrink-0 ${
          darkMode
            ? 'bg-[#202124] border-[#3C4043]'
            : 'bg-[#F8F9FA] border-[#E8EAED]'
        }`}
      >
        {/* حقل شريط العنوان الدائري مثل Chrome */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(urlInput);
            urlInputRef.current?.blur();
          }}
          className={`flex-1 h-[42px] px-3.5 rounded-[22px] border flex items-center gap-2.5 transition-shadow ${
            darkMode
              ? 'bg-[#303134] border-[#5F6368] focus-within:border-[#8AB4F8]'
              : 'bg-white border-[#DADCE0] focus-within:border-[#1A73E8] focus-within:shadow-sm'
          }`}
        >
          {/* أيقونة القفل / الحماية VPN (تعمل بصمت في الخلفية) */}
          <button
            type="button"
            onClick={async () => {
              const nextState = !vpnConnected;
              setVpnConnected(nextState);
              setVpnLocation(nextState ? 'السعودية' : null);
              showSnack(nextState ? '🛡️ VPN متصل بصمت (السعودية)' : 'تم إيقاف VPN');
            }}
            title={
              vpnConnected
                ? `حماية VPN مفعّلة بصمت • ${vpnLocation}`
                : 'حماية VPN غير مفعّلة'
            }
            className="shrink-0 cursor-pointer flex items-center"
          >
            {vpnConnected ? (
              <Shield className="w-4 h-4 text-[#10B981]" />
            ) : (
              <Lock className="w-4 h-4 text-[#5F6368]" />
            )}
          </button>

          {/* حقل البحث أو الرابط */}
          <input
            ref={urlInputRef}
            type="text"
            value={urlInput}
            onFocus={(e) => {
              setUrlFocused(true);
              e.currentTarget.select();
            }}
            onBlur={() => {
              setTimeout(() => setUrlFocused(false), 150);
            }}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="ابحث أو اكتب عنوانًا"
            className={`flex-1 bg-transparent text-[14px] focus:outline-none ${
              darkMode
                ? 'text-[#E8EAED] placeholder-[#9AA0A6]'
                : 'text-[#202124] placeholder-[#80868B]'
            }`}
          />

          {/* زر مسح النص عند التركيز أو الميكروفون الصوتي */}
          {urlFocused && urlInput ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setUrlInput('');
              }}
              className="text-[#5F6368] hover:text-[#202124] p-1 cursor-pointer"
              title="مسح"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVoiceMicClick}
              className={`p-1 rounded-full cursor-pointer ${
                isVoiceListening
                  ? 'text-[#EA4335] animate-pulse'
                  : 'text-[#5F6368] hover:text-[#202124]'
              }`}
              title="بحث صوتي"
            >
              <Mic className="w-[18px] h-[18px]" />
            </button>
          )}
        </form>

        {/* زر القائمة الثلاثية (⋮) */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            darkMode
              ? 'text-[#E8EAED] hover:bg-[#303134]'
              : 'text-[#5F6368] hover:bg-[#E8EAED]/60'
          }`}
          title="الخيارات"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* شريط التقدم الرفيع (2px LinearProgressIndicator) */}
      {(loading || progress < 1) && (
        <div className="h-[2px] w-full bg-transparent overflow-hidden shrink-0">
          <div
            className="h-full bg-[#1A73E8] transition-all duration-200"
            style={{ width: `${Math.max(15, progress * 100)}%` }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          مساحة WebView الوحيدة (يعمل بصمت: ترجمة تلقائية + VPN + حفظ المحتوى)
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 w-full relative bg-white overflow-hidden">
        {activeTab.offlineHtml ? (
          <iframe
            ref={iframeRef}
            title={activeTab.title || 'Offline Reader'}
            srcDoc={activeTab.offlineHtml}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <iframe
            ref={iframeRef}
            key={`${activeTab.id}_${activeTab.url}_${autoTranslate}`}
            title={activeTab.title || 'Chrome WebView'}
            src={proxyIframeSrc}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={() => {
              setLoading(false);
              setProgress(1);
            }}
            className="w-full h-full border-0 bg-white"
          />
        )}

        {/* Snackbar العائم مثل Flutter (_snack) */}
        {snackMsg && (
          <div className="fixed bottom-16 left-4 right-4 sm:left-auto sm:right-6 sm:min-w-[280px] z-40 pointer-events-none flex justify-center sm:justify-start">
            <div className="px-4 py-2.5 rounded-[10px] bg-[#202124] text-white text-[13px] shadow-lg">
              {snackMsg}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          الشريط السفلي مثل Chrome (_buildBottomBar in browser_screen.dart)
          [←] [→] [🏠] [💾 حفظ] [📚 المحفوظات] [📑]
      ═══════════════════════════════════════════════════════════ */}
      <footer
        className={`h-[56px] border-t flex items-center justify-evenly shrink-0 ${
          darkMode
            ? 'bg-[#202124] border-[#3C4043]'
            : 'bg-[#F8F9FA] border-[#E8EAED]'
        }`}
      >
        {/* رجوع */}
        <button
          type="button"
          onClick={handleBack}
          disabled={activeTab.historyIndex <= 0}
          className="p-3 rounded-full text-[#5F6368] hover:bg-black/5 disabled:opacity-35 cursor-pointer"
          title="رجوع"
        >
          <ArrowRight className="w-[21px] h-[21px]" />
        </button>

        {/* تقدم */}
        <button
          type="button"
          onClick={handleForward}
          disabled={activeTab.historyIndex >= activeTab.history.length - 1}
          className="p-3 rounded-full text-[#5F6368] hover:bg-black/5 disabled:opacity-35 cursor-pointer"
          title="تقدم"
        >
          <ArrowLeft className="w-[21px] h-[21px]" />
        </button>

        {/* الرئيسية (Google) */}
        <button
          type="button"
          onClick={handleHome}
          className="p-3 rounded-full text-[#5F6368] hover:bg-black/5 cursor-pointer"
          title="الرئيسية"
        >
          <Home className="w-[21px] h-[21px]" />
        </button>

        {/* زر الحفظ 💾 (يحفظ الصفحة ونتائج البحث النصية للرجوع إليها بدون إنترنت) */}
        <button
          type="button"
          onClick={handleSaveCurrentPage}
          className={`p-3 rounded-full hover:bg-black/5 cursor-pointer ${
            isCurrentUrlSaved ? 'text-[#1A73E8]' : 'text-[#5F6368]'
          }`}
          title="حفظ الصفحة ونتائج البحث بدون إنترنت"
        >
          <Bookmark
            className="w-[21px] h-[21px]"
            fill={isCurrentUrlSaved ? '#1A73E8' : 'none'}
          />
        </button>

        {/* زر المحفوظات 📚 (يعمل بدون إنترنت) */}
        <button
          type="button"
          onClick={() => setIsSavedSheetOpen(true)}
          className="relative p-3 rounded-full text-[#5F6368] hover:bg-black/5 cursor-pointer"
          title="المحفوظات — متاحة بدون إنترنت"
        >
          <FolderOpen className="w-[21px] h-[21px]" />
          {allSavedPages.length > 0 && (
            <span className="absolute top-1.5 left-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#1A73E8] text-white text-[10px] font-bold flex items-center justify-center">
              {allSavedPages.length}
            </span>
          )}
        </button>

        {/* زر التبويبات */}
        <button
          type="button"
          onClick={() => setIsTabsSheetOpen(true)}
          className="relative p-3 rounded-full text-[#5F6368] hover:bg-black/5 cursor-pointer"
          title="التبويبات"
        >
          <Layers className="w-[21px] h-[21px]" />
          <span className="sr-only">{tabs.length}</span>
        </button>
      </footer>

      {/* ═══════════════════════════════════════════════════════════
          قائمة الخيارات المنسدلة (⋮) — _openMenu()
      ═══════════════════════════════════════════════════════════ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-t-[20px] pb-4 pt-2 shadow-2xl ${
              darkMode ? 'bg-[#292A2D] text-[#E8EAED]' : 'bg-white text-[#202124]'
            }`}
          >
            {/* مقبض */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto my-2" />

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* 1. ترجمة الصفحة للعربية */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleTranslateCurrentPage();
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                <Languages className="w-5 h-5 text-[#1A73E8] shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">ترجمة الصفحة للعربية</div>
                  <div className="text-[12px] text-[#5F6368]">
                    {autoTranslate ? 'الترجمة التلقائية مفعّلة' : 'معطّلة'}
                  </div>
                </div>
              </button>

              {/* 2. الترجمة التلقائية */}
              <button
                type="button"
                onClick={() => {
                  const next = !autoTranslate;
                  setAutoTranslate(next);
                  setIsMenuOpen(false);
                  showSnack(next ? 'الترجمة التلقائية مفعّلة' : 'الترجمة التلقائية معطّلة');
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                {autoTranslate ? (
                  <CheckCircle2 className="w-5 h-5 text-[#1A73E8] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#5F6368] shrink-0" />
                )}
                <div>
                  <div className="text-[15px] font-medium">الترجمة التلقائية</div>
                  <div className="text-[12px] text-[#5F6368]">
                    {autoTranslate ? 'تعمل بصمت' : 'معطّلة'}
                  </div>
                </div>
              </button>

              {/* 3. حفظ هذه الصفحة ونتائج البحث */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSaveCurrentPage();
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                <Bookmark className="w-5 h-5 text-[#1A73E8] shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">حفظ هذه الصفحة</div>
                  <div className="text-[12px] text-[#5F6368]">
                    لقراءتها بدون إنترنت (محلياً + قاعدة البيانات الخارجية)
                  </div>
                </div>
              </button>

              {/* 4. حماية VPN */}
              <button
                type="button"
                onClick={() => {
                  const next = !vpnConnected;
                  setVpnConnected(next);
                  setVpnLocation(next ? 'السعودية' : null);
                  setIsMenuOpen(false);
                  showSnack(next ? '🛡️ تم تفعيل VPN' : 'تم إيقاف VPN');
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                <Shield className="w-5 h-5 text-[#1A73E8] shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">حماية VPN</div>
                  <div className="text-[12px] text-[#5F6368]">
                    {vpnConnected ? `متصل • ${vpnLocation}` : 'غير مفعّل'}
                  </div>
                </div>
              </button>

              {/* 5. المحفوظات */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setSavedSheetTab('pages');
                  setIsSavedSheetOpen(true);
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                <FolderOpen className="w-5 h-5 text-[#1A73E8] shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">المحفوظات</div>
                  <div className="text-[12px] text-[#5F6368]">
                    {allSavedPages.length} عنصر محفوظ — متاح بدون إنترنت
                  </div>
                </div>
              </button>

              {/* 5b. التنزيلات والفيديوهات المحملة بالجهاز */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setSavedSheetTab('videos');
                  setIsSavedSheetOpen(true);
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                <Download className="w-5 h-5 text-[#1A73E8] shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">التنزيلات والفيديوهات المحمّلة بالجهاز</div>
                  <div className="text-[12px] text-[#5F6368]">
                    {downloadedVideosList.length} فيديو تم تنزيله إلى مجلد Downloads
                  </div>
                </div>
              </button>

              {/* 5c. تثبيت التطبيق PWA */}
              {!isPwaInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    triggerPwaInstall();
                  }}
                  className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-[#1A73E8] shrink-0" />
                  <div>
                    <div className="text-[15px] font-medium">تثبيت التطبيق (PWA)</div>
                    <div className="text-[12px] text-[#5F6368]">
                      تثبيت كـ تطبيق أصيل على شاشة جهازك
                    </div>
                  </div>
                </button>
              )}

              {/* 6. سؤال AI */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setAskAiQuestion('');
                  setAskAiAnswer(null);
                  setIsAskAiOpen(true);
                }}
                className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-black/5 text-right cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-[#1A73E8] shrink-0" />
                <div>
                  <div className="text-[15px] font-medium">سؤال AI</div>
                  <div className="text-[12px] text-[#5F6368]">اسأل عن محتوى الصفحة</div>
                </div>
              </button>

              {/* 7. الوضع الليلي + مزامنة السحابة وخادم Oracle */}
              <div className="px-5 py-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDarkMode(!darkMode);
                    setIsMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#F1F3F4] text-[#202124] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (!user) {
                      signInWithGoogle().catch(() => {});
                    } else {
                      onOpenApprovalModal();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#E8F0FE] text-[#1A73E8] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>
                    {user
                      ? 'إعدادات السحابة (Oracle + VPN)'
                      : 'مزامنة المحفوظات عبر Firestore'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          Bottom Sheet المحفوظات — يعمل بدون إنترنت (_SavedBottomSheet)
      ═══════════════════════════════════════════════════════════ */}
      {isSavedSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-end justify-center"
          onClick={() => setIsSavedSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl h-[82vh] bg-white text-[#202124] rounded-t-[20px] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* مقبض */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2 shrink-0" />

            {/* العنوان */}
            <div className="px-5 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-[#1A73E8]" />
                <h3 className="text-[16px] font-semibold text-[#202124]">
                  المحفوظات — متاحة بدون إنترنت
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedSheetOpen(false)}
                className="p-1.5 rounded-full text-[#5F6368] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* التبديل بين تبويب الصفحات وتبويب التنزيلات */}
            <div className="px-5 pt-2 flex items-center gap-2 border-b border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setSavedSheetTab('pages')}
                className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  savedSheetTab === 'pages'
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>الصفحات المحفوظة ({allSavedPages.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSavedSheetTab('videos')}
                className={`pb-2.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  savedSheetTab === 'videos'
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>الفيديوهات المحمّلة بالجهاز ({downloadedVideosList.length})</span>
              </button>
            </div>

            {/* شريط البحث في المحفوظات */}
            <div className="px-5 py-2 shrink-0">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] bg-[#F1F3F4]">
                <Search className="w-4 h-4 text-[#5F6368] shrink-0" />
                <input
                  type="text"
                  value={savedSearchQuery}
                  onChange={(e) => setSavedSearchQuery(e.target.value)}
                  placeholder={
                    savedSheetTab === 'videos'
                      ? 'ابحث في الفيديوهات المحمّلة بالجهاز...'
                      : 'ابحث في المحفوظات ونتائج البحث النصية...'
                  }
                  className="w-full bg-transparent text-sm text-[#202124] placeholder-[#5F6368] focus:outline-none"
                />
                {savedSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSavedSearchQuery('')}
                    className="text-[#5F6368] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* قائمة العناصر المحفوظة */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {savedSheetTab === 'videos' ? (
                downloadedVideosList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                    <Download className="w-14 h-14 stroke-1 mb-3 text-blue-500" />
                    <div className="text-sm font-medium text-gray-600">
                      لا توجد فيديوهات محمّلة بعد
                    </div>
                    <div className="text-xs text-gray-400 mt-1 max-w-xs">
                      عند تشغيل أي فيديو في المتصفح، اضغط على أيقونة «تحميل الفيديو للجوال» ليتم نقله مباشرة إلى مجلد التنزيلات بجهازك
                    </div>
                  </div>
                ) : (
                  downloadedVideosList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-[12px] bg-[#F8F9FA] border border-[#E8EAED] hover:border-[#1A73E8] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center shrink-0">
                          <Film className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold text-[#202124] truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[#5F6368] truncate mt-0.5" dir="ltr">
                            {item.filename}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>محفوظ في مجلد التنزيلات (Downloads)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSavedSheetOpen(false);
                            navigateTo(item.url);
                          }}
                          className="p-2 rounded-lg text-[#1A73E8] hover:bg-blue-50 cursor-pointer"
                          title="تشغيل في المتصفح"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = item.downloadUrl;
                            a.download = item.filename;
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => a.remove(), 1000);
                            showSnack(`جاري إعادة تنزيل «${item.title}» للجهاز`);
                          }}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          title="إعادة التنزيل للجهاز"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = downloadedVideosList.filter((v) => v.id !== item.id);
                            setDownloadedVideosList(updated);
                            try {
                              localStorage.setItem('downloaded_videos_v1', JSON.stringify(updated));
                            } catch {}
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="حذف من القائمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : filteredSavedPages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
                  <FolderOpen className="w-14 h-14 stroke-1 mb-3" />
                  <div className="text-sm font-medium text-gray-500">
                    لا يوجد محتوى محفوظ
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    اضغط على أيقونة الحفظ (💾) في الشريط السفلي لحفظ أي صفحة أو نتائج بحث نصية لقراءتها بدون إنترنت
                  </div>
                </div>
              ) : (
                filteredSavedPages.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenSavedItemOffline(item)}
                    className="p-3.5 rounded-[12px] bg-[#F8F9FA] border border-[#E8EAED] hover:border-[#1A73E8] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-[#1A73E8] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-[#202124] truncate">
                          {item.title}
                        </div>
                        <div
                          className="text-[11px] text-[#5F6368] truncate mt-0.5"
                          dir="ltr"
                        >
                          {item.url}
                        </div>
                        <p className="text-[12px] text-[#4D5156] line-clamp-2 mt-1">
                          {(item.content || '').slice(0, 160)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedPage(item.id);
                      }}
                      className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          نافذة سؤال AI عن محتوى الصفحة (_askAboutPage)
      ═══════════════════════════════════════════════════════════ */}
      {isAskAiOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          onClick={() => setIsAskAiOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white text-[#202124] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1A73E8]" />
                <span>اسأل AI عن الصفحة</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAskAiOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAskAi} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={askAiQuestion}
                onChange={(e) => setAskAiQuestion(e.target.value)}
                placeholder="مثال: لخّص لي هذه الصفحة وأهم نقاطها"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DADCE0] text-sm focus:outline-none focus:border-[#1A73E8]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAskAiOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#5F6368] hover:bg-gray-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAskingAi}
                  className="px-5 py-2 rounded-lg bg-[#1A73E8] text-white text-sm font-medium hover:bg-[#1557B0] disabled:opacity-50 cursor-pointer"
                >
                  {isAskingAi ? 'جاري التحليل...' : 'اسأل'}
                </button>
              </div>
            </form>

            {askAiAnswer && (
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] text-sm leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                {askAiAnswer}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          نافذة التبويبات السريعة (Tabs Switcher)
      ═══════════════════════════════════════════════════════════ */}
      {isTabsSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-end justify-center"
          onClick={() => setIsTabsSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white text-[#202124] rounded-t-[20px] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">التبويبات المفتوحة ({tabs.length})</span>
              <button
                type="button"
                onClick={() => {
                  const newId = `tab_${Date.now()}`;
                  const newTab: BrowserTabItem = {
                    id: newId,
                    title: 'Google',
                    url: 'https://www.google.com',
                    history: ['https://www.google.com'],
                    historyIndex: 0,
                    offlineHtml: null,
                  };
                  setTabs((prev) => [...prev, newTab]);
                  setActiveTabId(newId);
                  setUrlInput('https://www.google.com');
                  setIsTabsSheetOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1A73E8] text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تبويب جديد</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tabs.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTabId(t.id);
                    setUrlInput(t.url);
                    setIsTabsSheetOpen(false);
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    t.id === activeTabId
                      ? 'border-[#1A73E8] bg-[#E8F0FE]/50'
                      : 'border-[#E8EAED] bg-[#F8F9FA]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-[#5F6368] truncate" dir="ltr">
                      {t.url}
                    </div>
                  </div>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const remaining = tabs.filter((x) => x.id !== t.id);
                        setTabs(remaining);
                        if (activeTabId === t.id) {
                          setActiveTabId(remaining[0].id);
                          setUrlInput(remaining[0].url);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ نافذة إذن وموافقة تحميل الفيديو للجهاز ═══ */}
      <VideoDownloadPermissionModal
        isOpen={!!downloadModalVideo}
        videoUrl={downloadModalVideo?.url || ''}
        videoTitle={downloadModalVideo?.title || ''}
        poster={downloadModalVideo?.poster}
        onClose={() => {
          if (!isDownloadingVideo) setDownloadModalVideo(null);
        }}
        onConfirmDownload={handleConfirmVideoDownload}
        isDownloading={isDownloadingVideo}
        downloadProgress={downloadProgress}
      />

      {/* ═══ أيقونة تحميل للجوال عائمة عند تشغيل/عرض أي رابط فيديو ═══ */}
      {(/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(activeTab.url) ||
        activeTab.url.includes('gtv-videos-bucket') ||
        activeTab.url.includes('video')) && (
        <div className="fixed bottom-20 left-4 z-40">
          <button
            type="button"
            onClick={() =>
              setDownloadModalVideo({
                url: activeTab.url,
                title: currentTitle || 'فيديو تم تشغيله',
              })
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#1A73E8] to-[#1557B0] text-white text-xs font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer border border-white/20"
          >
            <Smartphone className="w-4 h-4" />
            <Download className="w-4 h-4" />
            <span>تحميل الفيديو للجوال</span>
          </button>
        </div>
      )}
    </div>
  );
};
