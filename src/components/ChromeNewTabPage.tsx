import React, { useState, useEffect } from 'react';
import {
  Search,
  Mic,
  Camera,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
  Film,
  Tv,
  Globe,
  Youtube,
  Mail,
  Compass,
  Check,
  X,
  Palette,
  BookOpen
} from 'lucide-react';

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  iconBg?: string;
  iconLetter?: string;
  customIcon?: string;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 'sc_yt', title: 'YouTube', url: 'https://www.youtube.com', iconBg: 'bg-red-600', iconLetter: 'YT' },
  { id: 'sc_egy', title: 'إيجي بست', url: 'https://egybest.vip', iconBg: 'bg-emerald-600', iconLetter: 'EB' },
  { id: 'sc_shahid', title: 'شاهد VIP', url: 'https://shahid.mbc.net', iconBg: 'bg-blue-600', iconLetter: 'SH' },
  { id: 'sc_elcinema', title: 'السينما.كوم', url: 'https://elcinema.com', iconBg: 'bg-amber-600', iconLetter: 'سين' },
  { id: 'sc_trans', title: 'ترجمة Google', url: 'https://translate.google.com', iconBg: 'bg-blue-500', iconLetter: 'G' },
  { id: 'sc_wiki', title: 'ويكيبيديا', url: 'https://ar.wikipedia.org', iconBg: 'bg-gray-700', iconLetter: 'W' },
  { id: 'sc_gmail', title: 'Gmail', url: 'https://mail.google.com', iconBg: 'bg-rose-500', iconLetter: 'M' },
  { id: 'sc_imdb', title: 'IMDb', url: 'https://www.imdb.com', iconBg: 'bg-yellow-500 text-black', iconLetter: 'IMDb' },
];

const GOOGLE_APPS = [
  { name: 'بحث Google', url: 'https://www.google.com', icon: '🔍', color: 'bg-blue-50' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️', color: 'bg-red-50' },
  { name: 'الخرائط', url: 'https://maps.google.com', icon: '🗺️', color: 'bg-emerald-50' },
  { name: 'الأخبار', url: 'https://news.google.com', icon: '📰', color: 'bg-sky-50' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉️', color: 'bg-rose-50' },
  { name: 'Meet', url: 'https://meet.google.com', icon: '📹', color: 'bg-teal-50' },
  { name: 'Google Drive', url: 'https://drive.google.com', icon: '📁', color: 'bg-amber-50' },
  { name: 'التقويم', url: 'https://calendar.google.com', icon: '📅', color: 'bg-blue-50' },
  { name: 'ترجمة Google', url: 'https://translate.google.com', icon: '🌐', color: 'bg-indigo-50' },
  { name: 'الصور', url: 'https://photos.google.com', icon: '🖼️', color: 'bg-orange-50' },
  { name: 'Play Store', url: 'https://play.google.com', icon: '🛍️', color: 'bg-cyan-50' },
  { name: 'المستندات', url: 'https://docs.google.com', icon: '📄', color: 'bg-blue-50' },
];

export const CHROME_THEMES = [
  { id: 'default', name: 'كروم الكلاسيكي', bgClass: 'bg-white dark:bg-[#202124]', preview: 'bg-[#F1F3F4] dark:bg-[#202124]' },
  { id: 'ocean', name: 'أزرق المحيط الهادئ', bgClass: 'bg-gradient-to-b from-[#E3F2FD] to-[#BBDEFB] dark:from-[#0D47A1]/40 dark:to-[#1A237E]/40', preview: 'bg-blue-400' },
  { id: 'sunset', name: 'غروب دافئ', bgClass: 'bg-gradient-to-b from-[#FFF3E0] to-[#FFE0B2] dark:from-[#E65100]/30 dark:to-[#BF360C]/30', preview: 'bg-orange-400' },
  { id: 'midnight', name: 'سماء منتصف الليل', bgClass: 'bg-gradient-to-b from-[#1E1B4B] to-[#0F172A] text-white', preview: 'bg-indigo-900' },
  { id: 'emerald', name: 'واحة الزمرد', bgClass: 'bg-gradient-to-b from-[#E8F5E9] to-[#C8E6C9] dark:from-[#1B5E20]/30 dark:to-[#004D40]/30', preview: 'bg-emerald-500' },
];

interface ChromeNewTabPageProps {
  onNavigate: (url: string) => void;
  onSearch: (query: string) => void;
  onOpenVoiceSearch?: () => void;
}

export const ChromeNewTabPage: React.FC<ChromeNewTabPageProps> = ({
  onNavigate,
  onSearch,
  onOpenVoiceSearch,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const saved = localStorage.getItem('chrome_ntp_shortcuts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SHORTCUTS;
  });

  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem('chrome_ntp_theme') || 'default';
    } catch {}
    return 'default';
  });

  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isAddShortcutModalOpen, setIsAddShortcutModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutItem | null>(null);
  const [newShortcutName, setNewShortcutName] = useState('');
  const [newShortcutUrl, setNewShortcutUrl] = useState('');
  const [activeMenuShortcutId, setActiveMenuShortcutId] = useState<string | null>(null);

  // حفظ الاختصارات
  useEffect(() => {
    try {
      localStorage.setItem('chrome_ntp_shortcuts', JSON.stringify(shortcuts));
    } catch {}
  }, [shortcuts]);

  // حفظ الثيم
  useEffect(() => {
    try {
      localStorage.setItem('chrome_ntp_theme', activeThemeId);
    } catch {}
  }, [activeThemeId]);

  const activeTheme = CHROME_THEMES.find((t) => t.id === activeThemeId) || CHROME_THEMES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;

    // إذا كان رابطاً مباشراً
    if (
      clean.startsWith('http://') ||
      clean.startsWith('https://') ||
      (clean.includes('.') && !clean.includes(' '))
    ) {
      const targetUrl = clean.startsWith('http') ? clean : `https://${clean}`;
      onNavigate(targetUrl);
    } else {
      onSearch(clean);
    }
  };

  const handleSaveShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcutName.trim() || !newShortcutUrl.trim()) return;

    let formattedUrl = newShortcutUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (editingShortcut) {
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === editingShortcut.id
            ? { ...s, title: newShortcutName.trim(), url: formattedUrl }
            : s
        )
      );
    } else {
      const newSc: ShortcutItem = {
        id: `sc_${Date.now()}`,
        title: newShortcutName.trim(),
        url: formattedUrl,
        iconBg: 'bg-blue-600',
        iconLetter: newShortcutName.trim().slice(0, 2).toUpperCase(),
      };
      setShortcuts((prev) => [...prev, newSc]);
    }

    setEditingShortcut(null);
    setNewShortcutName('');
    setNewShortcutUrl('');
    setIsAddShortcutModalOpen(false);
  };

  const handleDeleteShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
    setActiveMenuShortcutId(null);
  };

  return (
    <div
      className={`min-h-full w-full flex flex-col justify-between transition-colors duration-300 relative select-none ${activeTheme.bgClass}`}
      onClick={() => {
        setIsAppsMenuOpen(false);
        setActiveMenuShortcutId(null);
      }}
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════════════
          رأس صفحة علامة التبويب الجديدة في كروم (Chrome NTP Header)
      ═══════════════════════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-6 py-4 z-20">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>متصفح Chrome الرسمي</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-gray-700 dark:text-gray-200">
          <button
            type="button"
            onClick={() => onNavigate('https://mail.google.com')}
            className="hover:underline cursor-pointer"
          >
            Gmail
          </button>
          <button
            type="button"
            onClick={() => onNavigate('https://images.google.com')}
            className="hover:underline cursor-pointer"
          >
            صور
          </button>

          {/* شبكة تطبيقات جوجل (Google Apps 9-dots Waffle) */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAppsMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer text-gray-600 dark:text-gray-300"
              title="تطبيقات Google"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z" />
              </svg>
            </button>

            {isAppsMenuOpen && (
              <div
                className="absolute left-0 top-11 w-76 bg-white dark:bg-[#2B2D30] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 grid grid-cols-3 gap-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {GOOGLE_APPS.map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => {
                      onNavigate(app.url);
                      setIsAppsMenuOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-1.5 shadow-2xs group-hover:scale-110 transition ${app.color}`}
                    >
                      {app.icon}
                    </div>
                    <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate w-full text-center">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* صورة الحساب الدائري (Google Profile Avatar) */}
          <button
            type="button"
            onClick={() => onNavigate('https://myaccount.google.com')}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1A73E8] to-[#4285F4] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-blue-400 cursor-pointer"
            title="حساب Google"
          >
            A
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          المحتوى الأوسط: شعار جوجل الحقيقي وشريط البحث والاختصارات
      ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full -mt-8">
        {/* شعار Google الحقيقي المتطابق */}
        <div className="mb-7 flex items-center justify-center select-none">
          <span className="text-[64px] sm:text-[76px] font-bold tracking-tight font-sans flex items-center">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </span>
        </div>

        {/* شريط بحث Chrome الحقيقي (Omnibox Capsule) */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[620px] relative mb-8 group"
        >
          <div className="flex items-center h-12 sm:h-13 px-4 rounded-full bg-white dark:bg-[#303134] border border-[#DFE1E5] dark:border-transparent shadow-[0_1px_6px_rgba(32,33,36,0.18)] hover:shadow-[0_2px_8px_rgba(32,33,36,0.28)] focus-within:shadow-[0_2px_8px_rgba(32,33,36,0.28)] transition-all gap-3">
            {/* أيقونة البحث */}
            <Search className="w-5 h-5 text-[#9AA0A6] shrink-0" />

            {/* حقل الإدخال */}
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في Google أو اكتب عنوان URL"
              className="flex-1 bg-transparent text-sm sm:text-base text-[#202124] dark:text-[#E8EAED] focus:outline-none placeholder-[#80868B]"
              autoFocus
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* أيقونة البحث الصوتي (Voice Search) بألوان جوجل */}
            <button
              type="button"
              onClick={() => {
                if (onOpenVoiceSearch) {
                  onOpenVoiceSearch();
                } else {
                  // محاكاة أو تشغيل البحث الصوتي
                  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (SpeechRec) {
                    try {
                      const rec = new SpeechRec();
                      rec.lang = 'ar-SA';
                      rec.onresult = (evt: any) => {
                        const transcript = evt.results[0][0].transcript;
                        setSearchInput(transcript);
                        onSearch(transcript);
                      };
                      rec.start();
                    } catch {
                      onSearch('أفلام مترجمة بالعربي');
                    }
                  } else {
                    onSearch('أفلام مترجمة بالعربي');
                  }
                }
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
              title="البحث الصوتي"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path fill="#34A853" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>

            {/* أيقونة عدسة جوجل (Google Lens) */}
            <button
              type="button"
              onClick={() => {
                onSearch('صور وأفلام حديثة');
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
              title="البحث بالصور عبر Google Lens"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
                <path fill="#4285F4" d="M19.5 5h-2.17l-.87-1.42c-.41-.66-1.12-1.08-1.91-1.08h-5.1c-.79 0-1.5.42-1.91 1.08L6.67 5H4.5C3.12 5 2 6.12 2 7.5v11C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-11C22 6.12 20.88 5 19.5 5zm.5 13.5c0 .28-.22.5-.5.5h-15c-.28 0-.5-.22-.5-.5v-11c0-.28.22-.5.5-.5h2.89l1.15-1.89c.14-.22.38-.36.65-.36h5.1c.27 0 .51.14.65.36l1.15 1.89H19.5c.28 0 .5.22.5.5v11z" />
              </svg>
            </button>
          </div>
        </form>

        {/* ═══════════════════════════════════════════════════════════════
            شبكة اختصارات المواقع (Speed Dial Shortcuts Grid)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="w-full max-w-[580px] grid grid-cols-4 sm:grid-cols-4 gap-y-5 gap-x-3 justify-items-center">
          {shortcuts.map((sc) => (
            <div
              key={sc.id}
              onClick={() => onNavigate(sc.url)}
              className="group relative flex flex-col items-center justify-center w-22 sm:w-24 p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer select-none"
            >
              {/* الدائرة الحاملة للأيقونة */}
              <div
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-2xs font-bold text-sm text-white mb-1.5 group-hover:scale-105 transition ${
                  sc.iconBg || 'bg-[#F1F3F4] text-[#202124] dark:bg-[#303134] dark:text-white'
                }`}
              >
                <span>{sc.iconLetter || sc.title.slice(0, 2)}</span>
              </div>

              {/* عنوان الاختصار */}
              <span className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate max-w-full text-center">
                {sc.title}
              </span>

              {/* زر الخيارات على الاختصار (3-dots menu) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuShortcutId(activeMenuShortcutId === sc.id ? null : sc.id);
                }}
                className="absolute top-1 left-1 p-1 rounded-full bg-white dark:bg-[#202124] shadow-xs text-gray-500 opacity-0 group-hover:opacity-100 hover:text-black dark:hover:text-white transition"
                title="تعديل الاختصار"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* القائمة المنبثقة للتعديل والحذف */}
              {activeMenuShortcutId === sc.id && (
                <div
                  className="absolute left-0 top-10 bg-white dark:bg-[#2B2D30] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-40 w-36 text-xs text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingShortcut(sc);
                      setNewShortcutName(sc.title);
                      setNewShortcutUrl(sc.url);
                      setIsAddShortcutModalOpen(true);
                      setActiveMenuShortcutId(null);
                    }}
                    className="w-full px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-between text-gray-700 dark:text-gray-200"
                  >
                    <span>تعديل الاختصار</span>
                    <Pencil className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteShortcut(sc.id, e)}
                    className="w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center justify-between font-semibold"
                  >
                    <span>إزالة</span>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* زر إضافة اختصار جديد (+) */}
          {shortcuts.length < 10 && (
            <div
              onClick={() => {
                setEditingShortcut(null);
                setNewShortcutName('');
                setNewShortcutUrl('');
                setIsAddShortcutModalOpen(true);
              }}
              className="flex flex-col items-center justify-center w-22 sm:w-24 p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer select-none group"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#F1F3F4] dark:bg-[#303134] text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-2xs group-hover:bg-gray-200 dark:group-hover:bg-[#3C4043] transition mb-1.5">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                إضافة اختصار
              </span>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          أسفل الصفحة: زر تخصيص Chrome في الزاوية اليسرى (أو اليمنى بالإنجليزية)
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="flex items-center justify-between px-6 py-4 z-20">
        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span>Google Chrome 128.0 (محرك تصفح متكامل)</span>
        </div>

        {/* زر تخصيص Chrome (Customize Chrome) */}
        <button
          type="button"
          onClick={() => setIsCustomizeOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#303134]/80 hover:bg-white dark:hover:bg-[#303134] border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>تخصيص Chrome</span>
        </button>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════
          نافذة إضافة / تعديل الاختصار
      ═══════════════════════════════════════════════════════════════ */}
      {isAddShortcutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAddShortcutModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#2B2D30] rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {editingShortcut ? 'تعديل الاختصار' : 'إضافة اختصار جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddShortcutModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShortcut} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  الاسم:
                </label>
                <input
                  type="text"
                  value={newShortcutName}
                  onChange={(e) => setNewShortcutName(e.target.value)}
                  placeholder="مثال: يوتيوب، إيجي بست، نتفليكس..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  عنوان URL:
                </label>
                <input
                  type="text"
                  value={newShortcutUrl}
                  onChange={(e) => setNewShortcutUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dir-ltr text-left"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddShortcutModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1A73E8] hover:bg-blue-700 text-white shadow-xs"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          لوحة تخصيص Chrome (Customize Chrome Drawer)
      ═══════════════════════════════════════════════════════════════ */}
      {isCustomizeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-start"
          onClick={() => setIsCustomizeOpen(false)}
        >
          <div
            className="w-80 h-full bg-white dark:bg-[#2B2D30] shadow-2xl p-6 flex flex-col justify-between border-l border-gray-200 dark:border-gray-700 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    تخصيص Chrome
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomizeOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* اختيار مظهر وثيم المتصفح */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                  مظهر وخلفية الصفحة الرئيسية:
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {CHROME_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setActiveThemeId(th.id)}
                      className={`p-2.5 rounded-2xl border text-right transition cursor-pointer flex flex-col gap-2 ${
                        activeThemeId === th.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className={`w-full h-10 rounded-xl ${th.preview} shadow-2xs`} />
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                        {th.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                تم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
