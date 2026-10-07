/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  db,
  signInWithGoogle,
  signOutUser,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  StoredWatchHistoryItem,
  StoredCloudInfrastructure,
} from './firebase';
import { ProjectFilesExplorer } from './components/ProjectFilesExplorer';
import {
  HybridBrowserWorkspace,
  BrowserSectionView,
} from './components/HybridBrowserWorkspace';
import { InfrastructureApprovalModal } from './components/InfrastructureApprovalModal';
import {
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

type MainViewTab = BrowserSectionView | 'files';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainViewTab>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Infrastructure Approval Modal & State (Oracle Cloud Free + WireGuard VPN + Permanent Groq Key)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [hasExistingInfraDoc, setHasExistingInfraDoc] = useState(false);

  // Watch History State (Cross-Device Sync for Hybrid Browser)
  const [watchHistory, setWatchHistory] = useState<StoredWatchHistoryItem[]>([]);

  // Programmatically activate Oracle Cloud Free, WireGuard VPN, and GROQ_API_KEY on boot
  useEffect(() => {
    fetch('/api/provision-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointIp: '129.151.142.88',
        port: 51820,
        region: 'eu-frankfurt-1 (Always Free)',
      }),
    }).catch(() => {});
  }, []);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // 2. Firestore Watch History & Cloud Infrastructure Listeners (when signed in)
  useEffect(() => {
    if (!authReady || !user) {
      setWatchHistory([]);
      setHasExistingInfraDoc(false);
      return;
    }

    const historyPath = 'watch_history';
    const qHistory = query(collection(db, historyPath), where('ownerId', '==', user.uid));
    const unsubHistory = onSnapshot(
      qHistory,
      (snapshot) => {
        const list: StoredWatchHistoryItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StoredWatchHistoryItem, 'id'>),
        }));
        setWatchHistory(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, historyPath);
      }
    );

    const infraPath = 'cloud_infrastructure';
    const qInfra = query(collection(db, infraPath), where('ownerId', '==', user.uid));
    const unsubInfra = onSnapshot(
      qInfra,
      (snapshot) => {
        const docs: StoredCloudInfrastructure[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StoredCloudInfrastructure, 'id'>),
        }));
        setHasExistingInfraDoc(docs.some((d) => d.id === `infra_${user.uid}`));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, infraPath);
      }
    );

    return () => {
      unsubHistory();
      unsubInfra();
    };
  }, [authReady, user]);

  // Play Arabic TTS (via /api/tts or SpeechSynthesis fallback) for translated pages & subtitles
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
    } catch {
      // Fallback to browser SpeechSynthesis
    }
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  };

  const navItems: Array<{ id: MainViewTab; label: string }> = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'browser', label: 'متصفح الويب' },
    { id: 'search', label: 'بحث الوسائط' },
    { id: 'player', label: 'المشغل والترجمة' },
    { id: 'downloads', label: 'التحميلات' },
    { id: 'vpn', label: 'الحماية VPN' },
    { id: 'files', label: 'ملفات المشروع' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0A0E1A] text-[#F8FAFC]"
      style={{ fontFamily: "'Cairo', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-[#2A3348] bg-[#0A0E1A]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap"
        >
          Hybrid Browser
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#94A3B8]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === item.id
                  ? 'text-white border-[#6366F1]'
                  : 'border-transparent hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsApprovalModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#6366F1] rounded-lg hover:bg-[#5558E6] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            title="اعتماد وتجهيز Oracle Cloud Free + WireGuard VPN + مفتاح Groq الدائم"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نوافذ الموافقة والتجهيز</span>
          </button>

          {user ? (
            <button
              onClick={() => signOutUser()}
              className="px-3 py-2 text-xs font-medium text-[#94A3B8] border border-[#2A3348] rounded-lg hover:bg-[#151B2E] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              title={user.email || 'حساب متصل'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-3 py-2 text-xs font-medium text-[#F8FAFC] border border-[#2A3348] rounded-lg hover:bg-[#151B2E] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>مزامنة سحابية</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Nav Switcher for small screens */}
      <div className="flex md:hidden items-center gap-1 px-4 py-2 border-b border-[#2A3348] overflow-x-auto bg-[#151B2E]/60">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === item.id ? 'bg-[#6366F1] text-white' : 'text-[#94A3B8]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 flex flex-col">
        {activeTab === 'files' ? (
          <ProjectFilesExplorer />
        ) : (
          <HybridBrowserWorkspace
            activeSubView={activeTab}
            onChangeSubView={(view) => setActiveTab(view)}
            user={user}
            watchHistory={watchHistory}
            onPlayTts={handlePlayTts}
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          />
        )}
      </main>

      {/* Interactive Approval & Provisioning Modal for Oracle Cloud Free, WireGuard VPN & Permanent Groq Key */}
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
