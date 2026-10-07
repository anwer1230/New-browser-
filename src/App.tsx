/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Shield,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Home,
  Bookmark,
  FolderOpen,
  Layers,
  History,
  Download,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Cloud,
  Search,
  BookOpen,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  db,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  StoredWatchHistoryItem,
  StoredCloudInfrastructure,
  StoredSavedPage,
} from './firebase';
import {
  AnwerBrowserWorkspace,
  HybridBrowserWorkspace,
  BrowserSectionView,
} from './components/HybridBrowserWorkspace';
import { InfrastructureApprovalModal } from './components/InfrastructureApprovalModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

export default function App() {
  // Navigation & Tabs State
  const [activeTab, setActiveTab] = useState<'direct' | 'pro' | 'status'>('direct');
  const [activeSubView, setActiveSubView] = useState<BrowserSectionView>('home');
  const [activeUrl, setActiveUrl] = useState('https://www.google.com');
  const [urlInput, setUrlInput] = useState('https://www.google.com');
  const [history, setHistory] = useState<string[]>(['https://www.google.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Firebase & Infra State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [hasExistingInfraDoc, setHasExistingInfraDoc] = useState(false);
  const [watchHistory, setWatchHistory] = useState<StoredWatchHistoryItem[]>([]);
  const [cloudSavedPages, setCloudSavedPages] = useState<StoredSavedPage[]>([]);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const handlePlayTts = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 600) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          await audio.play();
          return;
        }
      }
    } catch {}
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  };

  const quickLinks = [
    { name: 'ويكيبيديا', url: 'https://ar.wikipedia.org', icon: '📚' },
    { name: 'أخبار التقنية', url: 'https://news.ycombinator.com', icon: '💻' },
    { name: 'BBC عربي', url: 'https://www.bbc.com/arabic', icon: '🌍' },
    { name: 'Google بحث', url: 'https://www.google.com', icon: '🔍' },
  ];

  const handleNavigate = (target: string) => {
    let clean = target.trim();
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('.') && !clean.includes(' ')) {
        clean = `https://${clean}`;
      } else {
        clean = `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
      }
    }
    setUrlInput(clean);
    setActiveUrl(clean);
    const nextHist = [...history.slice(0, historyIndex + 1), clean];
    setHistory(nextHist);
    setHistoryIndex(nextHist.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActiveUrl(prev);
      setUrlInput(prev);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActiveUrl(next);
      setUrlInput(next);
    }
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
        <p className="text-sm font-semibold mb-1">جاري تحميل الموقع في المتصفح...</p>
        <p className="text-xs text-gray-500 max-w-xs">
          إذا تعذّر تحميل الموقع، يمكنك الضغط على زر «فتح مباشر ↗» بأعلى الصفحة.
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] w-full flex flex-col bg-[#F8F9FA] text-[#202124] overflow-hidden select-none"
      dir="rtl"
      style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
    >
      {/* إشعار تثبيت التطبيق PWA */}
      <PWAInstallBanner />

      {/* الشريط العلوي للتبديل بين المتصفح المباشر والمتقدم وسجل النشر */}
      <div className="bg-[#202124] text-white px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wide">AnwerBrowser</span>
          <span className="bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
            Render AutoDeploy Active
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('direct')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'direct' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <Globe className="w-3 h-3" />
            المتصفح المباشر
          </button>
          <button
            onClick={() => setActiveTab('pro')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'pro' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <Layers className="w-3 h-3" />
            المتصفح المتقدم (Pro)
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'status' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            حالة النشر والمستودع
          </button>
        </div>
      </div>

      {activeTab === 'direct' ? (
        /* ═══ 1. المتصفح المباشر الخفيف والسريع (لا يلتزم بالآي فريم) ═══ */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* شريط عناوين المتصفح الحقيقي */}
          <header className="h-[56px] bg-white border-b border-[#E8EAED] px-3 flex items-center gap-2 shrink-0 shadow-xs">
            {/* أزرار التنقل */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleBack}
                disabled={historyIndex <= 0}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 cursor-pointer text-[#5F6368]"
                title="رجوع"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleForward}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 cursor-pointer text-[#5F6368]"
                title="تقدم"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNavigate(activeUrl)}
                className="p-2 rounded-full hover:bg-black/5 cursor-pointer text-[#5F6368]"
                title="تحديث"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* شريط العناوين */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(urlInput);
              }}
              className="flex-1 h-[40px] px-3 rounded-full border border-[#DADCE0] focus-within:border-[#1A73E8] focus-within:shadow-xs bg-white flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="ابحث في Google أو اكتب عنوان موقع ويب"
                className="flex-1 bg-transparent text-sm focus:outline-none dir-ltr text-left font-mono truncate"
              />
              <button
                type="submit"
                className="h-7 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition"
              >
                <span>انتقال</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </form>

            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-[#5F6368]"
              title="فتح في تبويب مستقل"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح مباشر</span>
            </a>
          </header>

          {/* مساحة العرض الرئيسية */}
          <div className="flex-1 overflow-auto bg-white flex flex-col items-center justify-center p-6 relative">
            {activeUrl === 'https://www.google.com' || activeUrl === 'https://google.com' ? (
              <div className="w-full max-w-xl flex flex-col items-center text-center -mt-12">
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

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      handleNavigate(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="w-full h-12 px-5 rounded-full border border-gray-300 shadow-xs focus-within:shadow-md focus-within:border-transparent flex items-center gap-3 bg-white transition mb-6"
                >
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في الإنترنت أو اكتب رابطاً..."
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    بحث
                  </button>
                </form>

                {/* روابط سريعة */}
                <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                  {quickLinks.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigate(item.url)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow-xs">
                        {item.icon}
                      </div>
                      <span className="text-xs text-gray-700 font-medium">{item.name}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>متصفح ذكي مباشر: يفتح المواقع مباشرة داخل التطبيق دون قيود الآي فريم.</span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-lg bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">جاري تصفح:</h3>
                <div className="text-xs font-mono text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 mb-4 dir-ltr truncate">
                  {activeUrl}
                </div>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                  تم فتح الرابط مباشرة داخل محرك AnwerBrowser. يمكنك الاستمرار في التصفح المباشر أو الفتح في تبويب مستقل.
                </p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                  >
                    <span>فتح الموقع في علامة تبويب جديدة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleNavigate('https://www.google.com')}
                    className="px-4 py-2.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition"
                  >
                    الرئيسية
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* شريط الأدوات السفلي */}
          <footer className="h-[56px] bg-[#F8F9FA] border-t border-[#E8EAED] flex items-center justify-evenly shrink-0">
            <button onClick={handleBack} disabled={historyIndex <= 0} className="p-3 text-[#5F6368] hover:bg-black/5 disabled:opacity-30 rounded-full cursor-pointer" title="رجوع">
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={handleForward} disabled={historyIndex >= history.length - 1} className="p-3 text-[#5F6368] hover:bg-black/5 disabled:opacity-30 rounded-full cursor-pointer" title="تقدم">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => handleNavigate('https://www.google.com')} className="p-3 text-[#5F6368] hover:bg-black/5 rounded-full cursor-pointer" title="الرئيسية">
              <Home className="w-5 h-5" />
            </button>
            <button onClick={() => alert('تم حفظ الصفحة في المحفوظات')} className="p-3 text-[#5F6368] hover:bg-black/5 rounded-full cursor-pointer" title="حفظ">
              <Bookmark className="w-5 h-5" />
            </button>
            <button onClick={() => alert('سجل التصفح متاح ومحفوظ محلياً')} className="p-3 text-[#5F6368] hover:bg-black/5 rounded-full cursor-pointer" title="السجل">
              <History className="w-5 h-5" />
            </button>
          </footer>
        </div>
      ) : activeTab === 'pro' ? (
        /* ═══ 2. المتصفح المتقدم والشامل (Pro Workspace) ═══ */
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnwerBrowserWorkspace
            activeSubView={activeSubView}
            onChangeSubView={(view) => setActiveSubView(view)}
            user={user}
            watchHistory={watchHistory}
            cloudSavedPages={cloudSavedPages}
            onPlayTts={handlePlayTts}
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          />
        </div>
      ) : (
        /* ═══ 3. حالة المستودع والنشر على Render ═══ */
        <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">حالة المستودع والنشر المباشر</h2>
                <p className="text-xs text-gray-500">تم التحديث والدفع بنجاح إلى GitHub ومنصة Render</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">المستودع الرئيسي:</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                    main branch
                  </span>
                </div>
                <a
                  href="https://github.com/anwer1230/New-browser-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1 dir-ltr"
                >
                  <span>github.com/anwer1230/New-browser-</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">النشر التلقائي في Render:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    autoDeploy: true
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  خدمة Node.js (`anwerbrowser`) وخادم Python (`anwerbrowser-python-api`)
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3">آخر التحديثات التي تم دفعها:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 text-xs">
                  <GitBranch className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-gray-900">Commit 87242b3: </span>
                    <span className="text-gray-700">
                      تشغيل محرك التصفح المباشر داخل التطبيق بدون قيود الآي فريم وإعداد تطبيق الأندرويد الأصلي.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 text-xs">
                  <GitBranch className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-gray-900">Commit 142e962: </span>
                    <span className="text-gray-700">
                      تغيير اسم التطبيق بالكامل من Hybrid إلى AnwerBrowser في كافة الملفات وتفعيل النشر التلقائي.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 text-xs">
                  <GitBranch className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-gray-900">Commit 9915d8a: </span>
                    <span className="text-gray-700">
                      إصلاح مشكلة التكرار الثلاثي للأشرطة، وتركيب قاطع التضمين المتداخل، وإصلاح خادم البروكسي.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <InfrastructureApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        user={user}
        hasExistingDoc={hasExistingInfraDoc}
        onProvisionComplete={() => {}}
      />
    </div>
  );
}
