import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, X, Share2, Smartphone, Loader2 } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallBannerProps {
  onInstalled?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstalled }) => {
  const {
    isInstalled,
    isInstalling,
    installSuccess,
    isIOS,
    triggerInstall,
  } = usePWAInstall();

  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  // Check if user dismissed recently
  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
      if (isDismissed) setDismissed(true);
    } catch {}
  }, []);

  if (isInstalled || (dismissed && !showIOSModal)) {
    return null;
  }

  const handleInstallClick = async () => {
    setStatusText('جاري التثبيت...');
    const result = await triggerInstall();

    if (result === 'accepted') {
      setStatusText('تم التثبيت بنجاح ✓');
      setTimeout(() => {
        setDismissed(true);
        if (onInstalled) onInstalled();
      }, 1600);
    } else if (result === 'ios') {
      setStatusText(null);
      setShowIOSModal(true);
    } else if (result === 'fallback') {
      setStatusText('جاري إتمام التثبيت...');
      setTimeout(() => {
        setStatusText('اضغط على رمز التثبيت (⊕) في شريط المتصفح العلوي');
        setTimeout(() => setStatusText(null), 4000);
      }, 1000);
    } else {
      setStatusText(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <>
      {/* ═══ إشعار تثبيت التطبيق PWA مثل AI Studio ═══ */}
      <div className="w-full bg-gradient-to-r from-[#1A73E8] via-[#1557B0] to-[#0D47A1] text-white shadow-md border-b border-blue-400/20 px-3 py-2.5 sm:px-4 sm:py-3 transition-all duration-300 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* الجانب الأيمن: أيقونة التطبيق والنصوص */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20 shrink-0 flex items-center justify-center shadow-inner">
              <img
                src="/icon.svg"
                alt="AnwerBrowser"
                className="w-full h-full object-contain drop-shadow"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14px] sm:text-[15px] truncate">
                  تثبيت AnwerBrowser كـ تطبيق (PWA)
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-medium tracking-wide">
                  تطبيق مستقل
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-blue-100/90 truncate">
                {statusText ||
                  'ثبّت التطبيق على جهازك للوصول الفوري والعمل بدون إنترنت وحماية VPN وتنزيل الوسائط'}
              </p>
            </div>
          </div>

          {/* الجانب الأيسر: أزرار التثبيت والإغلاق */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isInstalling || installSuccess}
              onClick={handleInstallClick}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all ${
                installSuccess
                  ? 'bg-emerald-500 text-white'
                  : isInstalling
                  ? 'bg-white/80 text-[#1A73E8] cursor-wait'
                  : 'bg-white text-[#1A73E8] hover:bg-blue-50 active:scale-95'
              }`}
            >
              {isInstalling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
                  <span>جاري التثبيت...</span>
                </>
              ) : installSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>تم التثبيت ✓</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#1A73E8]" />
                  <span>تثبيت</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ نافذة إرشادات تثبيت أجهزة آبل (iOS Safari) ═══ */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white text-[#202124] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <Smartphone className="w-5 h-5 text-[#1A73E8]" />
                <span>تثبيت على iPhone أو iPad</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#4D5156]">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  اضغط على زر <strong>المشاركة (Share)</strong>{' '}
                  <Share2 className="w-4 h-4 inline text-[#1A73E8]" /> في شريط
                  متصفح Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  مرر للأسفل واضغط على{' '}
                  <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home
                  Screen).
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-6 h-6 rounded-full bg-[#1A73E8] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <p>اضغط على <strong>«إضافة»</strong> (Add) في الزاوية العلوية.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1A73E8] text-white font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
