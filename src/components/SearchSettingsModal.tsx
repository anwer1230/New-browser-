import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Languages,
  Sparkles,
  Shield,
  Wifi,
  Search,
  CheckCircle2,
  Database,
  Moon,
  Sun,
  Flame,
} from 'lucide-react';

interface SearchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultArabicTranslate: boolean;
  onToggleTranslate: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onShowSnack: (msg: string) => void;
}

export const SearchSettingsModal: React.FC<SearchSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultArabicTranslate,
  onToggleTranslate,
  darkMode,
  onToggleDarkMode,
  onShowSnack,
}) => {
  const [turboSpeed, setTurboSpeed] = useState(true);
  const [offlineCache, setOfflineCache] = useState(true);
  const [safeSearch, setSafeSearch] = useState<'strict' | 'moderate' | 'off'>('strict');
  const [searchEngine, setSearchEngine] = useState('google');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/user-settings')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (typeof data.turboSpeed100x === 'boolean') setTurboSpeed(data.turboSpeed100x);
            if (typeof data.offlineCacheEnabled === 'boolean') setOfflineCache(data.offlineCacheEnabled);
            if (data.safeSearch) setSafeSearch(data.safeSearch);
            if (data.defaultSearchEngine) setSearchEngine(data.defaultSearchEngine);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turboSpeed100x: turboSpeed,
          offlineCacheEnabled: offlineCache,
          safeSearch,
          defaultSearchEngine: searchEngine,
        }),
      });
      onShowSnack('✓ تم حفظ إعدادات البحث والتعريب بنجاح');
    } catch {}
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-right"
        dir="rtl"
      >
        {/* مقبض سحب الموبايل */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* رأس النافذة */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#202124]">
                إعدادات البحث والتعريب الفوري ⚙️
              </h3>
              <p className="text-[11.5px] text-[#5F6368]">
                تخصيص سرعة التصفح، الترجمة التلقائية، والتخزين بدون إنترنت
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5F6368] hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* قائمة الخيارات والإعدادات */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. الترجمة التلقائية للعربية */}
          <div className="p-4 rounded-[18px] bg-emerald-50/60 border border-emerald-200/80 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-[14.5px] text-emerald-950">
                  الترجمة التلقائية إلى العربية
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  افتراضي ثابت ✓
                </span>
              </div>
              <p className="text-[12px] text-emerald-800/80 mt-1.5 leading-relaxed">
                تعريب فوري وشامل لأي صفحة أو نتيجة بحث أجنبية كإجراء افتراضي ثابت دون الحاجة للنقر يدوياً في كل مرة.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTranslate}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer ${
                defaultArabicTranslate ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 2. محرك السرعة الفائقة Turbo 100x */}
          <div className="p-4 rounded-[18px] bg-amber-50/60 border border-amber-200/80 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600 shrink-0" />
                <h4 className="font-bold text-[14.5px] text-amber-950">
                  محرك السرعة الفائقة (Turbo 100x)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  سرعة 100x ⚡
                </span>
              </div>
              <p className="text-[12px] text-amber-800/80 mt-1.5 leading-relaxed">
                مضاعفة سرعة التحميل والعرض حتى 100 مرة عبر التخزين المؤقت الذكي وضغط البيانات، مع مقاومة شبكات 2G والإنترنت الضعيف.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTurboSpeed(!turboSpeed)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer ${
                turboSpeed ? 'bg-amber-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 3. العمل بدون إنترنت Offline Cache */}
          <div className="p-4 rounded-[18px] bg-blue-50/60 border border-blue-200/80 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 shrink-0" />
                <h4 className="font-bold text-[14.5px] text-blue-950">
                  التشغيل في أضعف حالات الإنترنت وأوفلاين
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Offline Ready 💾
                </span>
              </div>
              <p className="text-[12px] text-blue-800/80 mt-1.5 leading-relaxed">
                تخزين واسترجاع الصفحات والوسائط وسجل البحث تلقائياً حتى عند انقطاع الاتصال بالشبكة تماماً.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOfflineCache(!offlineCache)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer ${
                offlineCache ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* 4. تصفية البحث الآمن SafeSearch */}
          <div className="p-4 rounded-[18px] border border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#1A73E8]" />
              <h4 className="font-bold text-[14px] text-[#202124]">
                تصفية البحث الآمن (SafeSearch)
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['strict', 'moderate', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSafeSearch(mode)}
                  className={`py-2 px-3 rounded-xl text-[12.5px] font-medium border text-center transition-all cursor-pointer ${
                    safeSearch === mode
                      ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8] font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mode === 'strict' && 'مشدد (موصى به)'}
                  {mode === 'moderate' && 'معتدل'}
                  {mode === 'off' && 'إيقاف التصفية'}
                </button>
              ))}
            </div>
          </div>

          {/* 5. المظهر (الوضع الليلي والنهاري) */}
          <div className="p-4 rounded-[18px] border border-gray-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {darkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <h4 className="font-bold text-[14px] text-[#202124]">
                  مظهر المتصفح (السمة)
                </h4>
                <p className="text-[11.5px] text-[#5F6368]">
                  {darkMode ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-[12.5px] font-semibold text-[#202124] transition-colors cursor-pointer"
            >
              {darkMode ? 'تبديل للنهاري ☀️' : 'تبديل لليلي 🌙'}
            </button>
          </div>
        </div>

        {/* الشريط السفلي */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-[#F8F9FA] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 text-[13px] font-medium cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[13px] font-bold cursor-pointer transition-colors shadow-xs"
          >
            حفظ التغييرات ✓
          </button>
        </div>
      </div>
    </div>
  );
};
