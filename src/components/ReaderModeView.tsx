import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  BookOpen,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Moon,
  Sparkles,
  Download,
  Share2,
  Copy,
  Printer,
  Clock,
  Globe,
  Check,
  Play,
  Film,
  ExternalLink,
  Layers,
  Bookmark,
  ShieldCheck,
} from 'lucide-react';

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'black';
export type ReaderFont = 'cairo' | 'amiri' | 'system';

export interface ReaderContentData {
  url: string;
  title: string;
  siteName?: string;
  author?: string;
  publishedDate?: string;
  heroImage?: string;
  isVideo?: boolean;
  videoEmbedUrl?: string;
  videoDirectUrl?: string;
  videoId?: string;
  paragraphs: string[];
  textContent: string;
  wordCount: number;
  readingTime: string;
}

interface ReaderModeViewProps {
  url: string;
  title: string;
  rawText: string;
  onClose: () => void;
  onPlayTts: (text: string) => void;
  onSaveOffline: (entry: { url: string; title: string; content: string }) => void;
  onDownloadVideo?: (video: { url: string; title: string; poster?: string }) => void;
  isSaved?: boolean;
}

export const ReaderModeView: React.FC<ReaderModeViewProps> = ({
  url,
  title,
  rawText,
  onClose,
  onPlayTts,
  onSaveOffline,
  onDownloadVideo,
  isSaved = false,
}) => {
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    try {
      return (localStorage.getItem('reader_theme') as ReaderTheme) || 'sepia';
    } catch {
      return 'sepia';
    }
  });

  const [font, setFont] = useState<ReaderFont>(() => {
    try {
      return (localStorage.getItem('reader_font') as ReaderFont) || 'cairo';
    } catch {
      return 'cairo';
    }
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('reader_font_size'));
      return saved >= 14 && saved <= 28 ? saved : 18;
    } catch {
      return 18;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [readerData, setReaderData] = useState<ReaderContentData | null>(null);
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch clean reader content or construct from fallback
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/reader-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        titleFallback: title,
        textFallback: rawText,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Reader API response error');
        return res.json();
      })
      .then((data: ReaderContentData) => {
        if (!isMounted) return;
        setReaderData(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        // Client fallback
        const cleanParagraphs = (rawText || '')
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 20);

        const words = (rawText || title).split(/\s+/).filter(Boolean).length;
        const estMinutes = Math.max(1, Math.ceil(words / 180));

        let hostname = '';
        try {
          hostname = new URL(url).hostname.replace(/^www\./, '');
        } catch {}

        const ytMatch = url.match(
          /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );

        setReaderData({
          url,
          title: title || hostname || 'مقال للقراءة المركزة',
          siteName: hostname,
          isVideo: Boolean(ytMatch || /\.(mp4|webm|m4v)(\?.*)?$/i.test(url)),
          videoEmbedUrl: ytMatch
            ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
            : undefined,
          videoDirectUrl: !ytMatch && /\.(mp4|webm|m4v)/i.test(url) ? url : undefined,
          paragraphs:
            cleanParagraphs.length > 0
              ? cleanParagraphs
              : [
                  'تم تنظيف هذا المحتوى وإزالة كافة الإعلانات والقوائم الجانبية المشتتة لتمكين القراءة المركزة والهادئة.',
                  rawText || 'المحتوى متاح للقراءة في بيئة نظيفة خالية من الإعلانات والمقاطعات.',
                ],
          textContent: rawText || title,
          wordCount: words,
          readingTime: `${estMinutes} دقائق قراءة`,
        });
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url, title, rawText]);

  // Handle scroll progress
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const total = scrollHeight - clientHeight;
    if (total <= 0) {
      setScrollProgress(100);
    } else {
      setScrollProgress(Math.min(100, Math.round((scrollTop / total) * 100)));
    }
  };

  const handleCopyText = async () => {
    if (!readerData) return;
    try {
      const full = `${readerData.title}\n\n${readerData.paragraphs.join('\n\n')}\n\nالمصدر: ${readerData.url}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleToggleTts = () => {
    if (!readerData) return;
    if (isPlayingTts) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingTts(false);
    } else {
      const sampleText = `${readerData.title}. ${readerData.paragraphs.slice(0, 5).join(' ')}`;
      onPlayTts(sampleText);
      setIsPlayingTts(true);
      setTimeout(() => setIsPlayingTts(false), 20000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Theme styling configurations
  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'sepia':
        return {
          wrapper: 'bg-[#FBF0D9] text-[#433422]',
          header: 'bg-[#F4E4C1]/90 border-[#E8D4A8] text-[#433422]',
          toolbar: 'bg-[#EFE0BC] border-[#DFD0AB]',
          article: 'text-[#433422]',
          meta: 'text-[#7D6B53]',
          videoCard: 'bg-[#F4E4C1] border-[#E8D4A8]',
          badge: 'bg-[#EBD8B0] text-[#5C4A32]',
          buttonActive: 'bg-[#5C4A32] text-white',
          buttonIdle: 'hover:bg-[#EBD8B0] text-[#5C4A32]',
        };
      case 'dark':
        return {
          wrapper: 'bg-[#1E1F22] text-[#E8EAED]',
          header: 'bg-[#2B2D31]/95 border-[#383A40] text-[#E8EAED]',
          toolbar: 'bg-[#2B2D31] border-[#383A40]',
          article: 'text-[#DBDEE1]',
          meta: 'text-[#949BA4]',
          videoCard: 'bg-[#2B2D31] border-[#383A40]',
          badge: 'bg-[#35373C] text-[#DBDEE1]',
          buttonActive: 'bg-[#5865F2] text-white',
          buttonIdle: 'hover:bg-[#35373C] text-[#DBDEE1]',
        };
      case 'black':
        return {
          wrapper: 'bg-[#000000] text-[#D1D5DB]',
          header: 'bg-[#111111]/95 border-[#222222] text-[#E5E7EB]',
          toolbar: 'bg-[#111111] border-[#222222]',
          article: 'text-[#D1D5DB]',
          meta: 'text-[#9CA3AF]',
          videoCard: 'bg-[#111111] border-[#222222]',
          badge: 'bg-[#1F2937] text-[#9CA3AF]',
          buttonActive: 'bg-white text-black font-semibold',
          buttonIdle: 'hover:bg-[#1F2937] text-[#D1D5DB]',
        };
      case 'light':
      default:
        return {
          wrapper: 'bg-[#FFFFFF] text-[#202124]',
          header: 'bg-[#F8F9FA]/95 border-[#E8EAED] text-[#202124]',
          toolbar: 'bg-[#F1F3F4] border-[#DADCE0]',
          article: 'text-[#202124]',
          meta: 'text-[#5F6368]',
          videoCard: 'bg-[#F8F9FA] border-[#E8EAED]',
          badge: 'bg-[#E8F0FE] text-[#1967D2]',
          buttonActive: 'bg-[#1A73E8] text-white',
          buttonIdle: 'hover:bg-[#E8EAED] text-[#3C4043]',
        };
    }
  }, [theme]);

  // Font family class
  const fontClass = useMemo(() => {
    switch (font) {
      case 'amiri':
        return "font-['Amiri',serif]";
      case 'system':
        return 'font-sans';
      case 'cairo':
      default:
        return "font-['Cairo','Segoe_UI',sans-serif]";
    }
  }, [font]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`h-full w-full overflow-y-auto overflow-x-hidden flex flex-col transition-colors duration-200 select-text ${themeStyles.wrapper} ${fontClass}`}
      dir="rtl"
    >
      {/* ─── Reading Scroll Progress Indicator (Topmost) ─── */}
      <div className="sticky top-0 z-50 h-[3px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ─── Reader Top Control Bar (Clean & Professional) ─── */}
      <header
        className={`sticky top-[3px] z-40 backdrop-blur-md border-b px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm ${themeStyles.header}`}
      >
        {/* Back / Exit Reader Mode */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-black/5 hover:bg-black/10 transition cursor-pointer"
            title="الخروج من وضع القراءة والعودة للمتصفح"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمتصفح</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>مفلتر ونظيف من الإعلانات</span>
          </div>
        </div>

        {/* Reader Customization Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Audio TTS Read Aloud */}
          <button
            type="button"
            onClick={handleToggleTts}
            className={`p-2 rounded-lg text-sm transition cursor-pointer flex items-center gap-1.5 ${
              isPlayingTts ? 'bg-red-500 text-white animate-pulse' : themeStyles.buttonIdle
            }`}
            title={isPlayingTts ? 'إيقاف الاستماع' : 'استمع للمقال بالذكاء الاصطناعي'}
          >
            {isPlayingTts ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden md:inline text-xs font-medium">
              {isPlayingTts ? 'إيقاف' : 'استمع'}
            </span>
          </button>

          {/* Font Size Controls */}
          <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => {
                const next = Math.max(14, fontSize - 2);
                setFontSize(next);
                try {
                  localStorage.setItem('reader_font_size', String(next));
                } catch {}
              }}
              className="px-2 py-1 text-xs font-bold hover:bg-black/5 rounded cursor-pointer"
              title="تصغير حجم الخط"
            >
              A-
            </button>
            <span className="text-[11px] px-1 font-mono text-gray-500">{fontSize}</span>
            <button
              type="button"
              onClick={() => {
                const next = Math.min(28, fontSize + 2);
                setFontSize(next);
                try {
                  localStorage.setItem('reader_font_size', String(next));
                } catch {}
              }}
              className="px-2 py-1 text-xs font-bold hover:bg-black/5 rounded cursor-pointer"
              title="تكبير حجم الخط"
            >
              A+
            </button>
          </div>

          {/* Font Family Selector */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => {
                setFont('cairo');
                try {
                  localStorage.setItem('reader_font', 'cairo');
                } catch {}
              }}
              className={`px-2 py-1 text-xs rounded transition cursor-pointer ${
                font === 'cairo' ? themeStyles.buttonActive : 'hover:bg-black/5'
              }`}
            >
              عصري
            </button>
            <button
              type="button"
              onClick={() => {
                setFont('amiri');
                try {
                  localStorage.setItem('reader_font', 'amiri');
                } catch {}
              }}
              className={`px-2 py-1 text-xs rounded font-serif transition cursor-pointer ${
                font === 'amiri' ? themeStyles.buttonActive : 'hover:bg-black/5'
              }`}
            >
              أميري
            </button>
          </div>

          {/* Theme Palette Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-black/10 dark:border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                try {
                  localStorage.setItem('reader_theme', 'light');
                } catch {}
              }}
              className={`w-6 h-6 rounded-full border border-gray-300 bg-white transition cursor-pointer ${
                theme === 'light' ? 'ring-2 ring-blue-500' : ''
              }`}
              title="الوضع الفاتح"
            />
            <button
              type="button"
              onClick={() => {
                setTheme('sepia');
                try {
                  localStorage.setItem('reader_theme', 'sepia');
                } catch {}
              }}
              className={`w-6 h-6 rounded-full border border-amber-300 bg-[#FBF0D9] transition cursor-pointer ${
                theme === 'sepia' ? 'ring-2 ring-amber-600' : ''
              }`}
              title="وضع القراءة الورقي (مريح للعين)"
            />
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                try {
                  localStorage.setItem('reader_theme', 'dark');
                } catch {}
              }}
              className={`w-6 h-6 rounded-full border border-gray-600 bg-[#1E1F22] transition cursor-pointer ${
                theme === 'dark' ? 'ring-2 ring-blue-400' : ''
              }`}
              title="الوضع الداكن"
            />
            <button
              type="button"
              onClick={() => {
                setTheme('black');
                try {
                  localStorage.setItem('reader_theme', 'black');
                } catch {}
              }}
              className={`w-6 h-6 rounded-full border border-gray-700 bg-black transition cursor-pointer ${
                theme === 'black' ? 'ring-2 ring-white' : ''
              }`}
              title="الوضع الأسود الصرف (AMOLED)"
            />
          </div>

          {/* Save Offline */}
          <button
            type="button"
            onClick={() => {
              if (readerData) {
                onSaveOffline({
                  url: readerData.url,
                  title: readerData.title,
                  content: readerData.paragraphs.join('\n\n'),
                });
              }
            }}
            className={`p-2 rounded-lg transition cursor-pointer ${themeStyles.buttonIdle}`}
            title="حفظ للقراءة بدون إنترنت"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'text-blue-500 fill-blue-500' : ''}`} />
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopyText}
            className={`p-2 rounded-lg transition cursor-pointer ${themeStyles.buttonIdle}`}
            title="نسخ المقال كاملاً"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className={`hidden md:flex p-2 rounded-lg transition cursor-pointer ${themeStyles.buttonIdle}`}
            title="طباعة المقال"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── Reader Main Body ─── */}
      <main className="flex-1 w-full max-w-[820px] mx-auto px-4 sm:px-8 py-8 sm:py-12 transition-all">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
            <div className="text-base font-medium">جاري تنظيف وتجهيز وضع القراءة...</div>
            <div className="text-xs text-gray-400">إزالة الإعلانات والنصوص المشتتة وتنسيق المحتوى</div>
          </div>
        ) : readerData ? (
          <article className="space-y-6">
            {/* Meta Tags: Source, Reading Time, Date */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium pb-2 border-b border-black/5 dark:border-white/5">
              {readerData.siteName && (
                <span className={`px-2.5 py-1 rounded-md ${themeStyles.badge}`}>
                  {readerData.siteName}
                </span>
              )}
              <span className={`flex items-center gap-1 ${themeStyles.meta}`}>
                <Clock className="w-3.5 h-3.5" />
                {readerData.readingTime}
              </span>
              {readerData.author && (
                <span className={`before:content-['•'] before:mx-1 ${themeStyles.meta}`}>
                  الكاتب: {readerData.author}
                </span>
              )}
              {readerData.wordCount > 0 && (
                <span className={`before:content-['•'] before:mx-1 ${themeStyles.meta}`}>
                  {readerData.wordCount} كلمة
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug tracking-tight"
              style={{ fontSize: `${fontSize * 1.5}px` }}
            >
              {readerData.title}
            </h1>

            {/* ═══ VIDEO FOCUSED DISPLAY (If Page has Video) ═══ */}
            {readerData.isVideo && (
              <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm ${themeStyles.videoCard}`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Film className="w-4 h-4 text-rose-500" />
                    <span>وضع الفيديو النقي (بدون إعلانات جانبية أو اقتراحات)</span>
                  </div>
                  {onDownloadVideo && (
                    <button
                      type="button"
                      onClick={() =>
                        onDownloadVideo({
                          url: readerData.videoDirectUrl || readerData.url,
                          title: readerData.title,
                          poster: readerData.heroImage,
                        })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                      title="تحميل هذا الفيديو للجهاز"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل الفيديو</span>
                    </button>
                  )}
                </div>

                {/* Embedded Responsive Player */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                  {readerData.videoEmbedUrl ? (
                    <iframe
                      src={readerData.videoEmbedUrl}
                      title={readerData.title}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads allow-pointer-lock allow-orientation-lock"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  ) : readerData.videoDirectUrl ? (
                    <video
                      controls
                      autoPlay
                      playsInline
                      crossOrigin="anonymous"
                      preload="auto"
                      className="w-full h-full object-contain"
                      poster={readerData.heroImage}
                    >
                      <source src={readerData.videoDirectUrl} type="video/mp4; codecs='avc1.42E01E, mp4a.40.2'" />
                      <source src={readerData.videoDirectUrl.replace(/\.mp4$/i, '.webm')} type="video/webm; codecs='vp8, vorbis'" />
                      <source src={readerData.videoDirectUrl.replace(/\.mp4$/i, '.ogv')} type="video/ogg; codecs='theora, vorbis'" />
                      <p className="p-4 text-xs text-white">متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.</p>
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/70 text-sm">
                      مشغل الفيديو النقي متاح ومجهّز
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hero Image (if article has clean hero image and not video) */}
            {readerData.heroImage && !readerData.isVideo && (
              <div className="rounded-2xl overflow-hidden my-4 border border-black/5 dark:border-white/5 shadow-sm">
                <img
                  src={readerData.heroImage}
                  alt={readerData.title}
                  className="w-full max-h-[420px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* ═══ ARTICLE PARAGRAPHS (Cleaned & Focused) ═══ */}
            <div
              className={`space-y-6 transition-all ${themeStyles.article}`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.9',
              }}
            >
              {readerData.paragraphs.map((para, idx) => (
                <p key={idx} className="leading-relaxed whitespace-pre-line text-justify">
                  {para}
                </p>
              ))}
            </div>

            {/* Article Footer & Source Reference */}
            <div className="mt-12 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5 break-all">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <a
                  href={readerData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  <span>المصدر الأصلي: {readerData.siteName || readerData.url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 font-bold transition cursor-pointer"
                >
                  العودة للمتصفح
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-500">تعذر تحميل محتوى المقال للقراءة.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer"
            >
              العودة للمتصفح
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
