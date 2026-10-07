/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  const [activeSubView, setActiveSubView] = useState<BrowserSectionView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Infrastructure Approval Modal & State (Oracle Cloud Free + WireGuard VPN + Permanent Groq Key)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [hasExistingInfraDoc, setHasExistingInfraDoc] = useState(false);

  // Watch History & Cloud Saved Pages State
  const [watchHistory, setWatchHistory] = useState<StoredWatchHistoryItem[]>([]);
  const [cloudSavedPages, setCloudSavedPages] = useState<StoredSavedPage[]>([]);

  // Silently activate Oracle Cloud Free, WireGuard VPN, and GROQ_API_KEY in the background on boot
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

  // 2. Firestore Listeners (Saved Pages + Watch History + Cloud Infrastructure)
  useEffect(() => {
    if (!authReady || !user) {
      setWatchHistory([]);
      setCloudSavedPages([]);
      setHasExistingInfraDoc(false);
      return;
    }

    const savedPagesPath = 'saved_pages';
    const qSaved = query(collection(db, savedPagesPath), where('ownerId', '==', user.uid));
    const unsubSaved = onSnapshot(
      qSaved,
      (snapshot) => {
        const list: StoredSavedPage[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StoredSavedPage, 'id'>),
        }));
        setCloudSavedPages(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, savedPagesPath);
      }
    );

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
      unsubSaved();
      unsubHistory();
      unsubInfra();
    };
  }, [authReady, user]);

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

  // قاطع التكرار الذاتي: منع تشغيل واجهة المتصفح والأشرطة داخل إطار iframe متداخل
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
      className="h-[100dvh] min-h-[100dvh] w-full max-w-full overflow-hidden flex flex-col bg-[#F8F9FA] text-[#202124]"
      style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif" }}
    >
      {/* إشعار تثبيت التطبيق PWA مثل AI Studio */}
      <PWAInstallBanner />

      {/* الواجهة الوحيدة الموحّدة مثل Chrome */}
      <AnwerBrowserWorkspace
        activeSubView={activeSubView}
        onChangeSubView={(view) => setActiveSubView(view)}
        user={user}
        watchHistory={watchHistory}
        cloudSavedPages={cloudSavedPages}
        onPlayTts={handlePlayTts}
        onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
      />

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
