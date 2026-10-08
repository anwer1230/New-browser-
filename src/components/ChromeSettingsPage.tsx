import React, { useState } from 'react';
import {
  Settings,
  Search,
  Shield,
  Palette,
  Globe,
  Download,
  Info,
  User,
  Key,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface ChromeSettingsProps {
  onNavigate: (url: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showBookmarksBar: boolean;
  onToggleBookmarksBar: () => void;
}

export const ChromeSettingsPage: React.FC<ChromeSettingsProps> = ({
  onNavigate,
  isDarkMode,
  onToggleDarkMode,
  showBookmarksBar,
  onToggleBookmarksBar,
}) => {
  const [activeSection, setActiveSection] = useState<'you' | 'autofill' | 'privacy' | 'appearance' | 'search' | 'startup' | 'about'>('you');
  const [searchEngine, setSearchEngine] = useState('Google');
  const [startupOption, setStartupOption] = useState<'newtab' | 'continue'>('newtab');
  const [clearDataSuccess, setClearDataSuccess] = useState(false);

  const handleClearBrowsingData = () => {
    localStorage.removeItem('chrome_history');
    setClearDataSuccess(true);
    setTimeout(() => setClearDataSuccess(false), 3000);
  };

  const navItems = [
    { id: 'you', label: 'أنت و Google', icon: <User className="w-5 h-5" /> },
    { id: 'autofill', label: 'الملء التلقائي وكلمات المرور', icon: <Key className="w-5 h-5" /> },
    { id: 'privacy', label: 'الخصوصية والأمان', icon: <Shield className="w-5 h-5" /> },
    { id: 'appearance', label: 'المظهر', icon: <Palette className="w-5 h-5" /> },
    { id: 'search', label: 'محرك البحث', icon: <Search className="w-5 h-5" /> },
    { id: 'startup', label: 'عند بدء التشغيل', icon: <Laptop className="w-5 h-5" /> },
    { id: 'about', label: 'لمحة عن Chrome', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-full bg-[#F8F9FA] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED]" dir="rtl">
      {/* القائمة الجانبية لإعدادات كروم */}
      <div className="w-64 border-l border-[#DADCE0] dark:border-[#3C4043] p-4 flex flex-col gap-1 bg-white dark:bg-[#292A2D]">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 font-bold text-lg text-[#1A73E8]">
          <Settings className="w-6 h-6" />
          <span>الإعدادات</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-r-full text-sm font-medium transition ${
              activeSection === item.id
                ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#394457] dark:text-[#8AB4F8]'
                : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* المحتوى الرئيسي للإعدادات */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl">
        {activeSection === 'you' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium border-b border-[#DADCE0] dark:border-[#3C4043] pb-3">أنت و Google</h2>
            <div className="bg-white dark:bg-[#292A2D] rounded-xl p-6 border border-[#DADCE0] dark:border-[#3C4043] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-xl font-bold">
                  A
                </div>
                <div>
                  <h3 className="font-medium text-base">مستخدم Google الحسابي</h3>
                  <p className="text-sm text-[#5F6368] dark:text-[#9AA0A6]">المزامنة مفعّلة لحفظ الإشارات، السجل، وكلمات المرور</p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-[#E6F4EA] text-[#137333] text-xs font-semibold rounded-full border border-[#CEEAD6]">
                متصل بحساب Google
              </span>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium border-b border-[#DADCE0] dark:border-[#3C4043] pb-3">الخصوصية والأمان</h2>
            <div className="bg-white dark:bg-[#292A2D] rounded-xl border border-[#DADCE0] dark:border-[#3C4043] shadow-xs divide-y divide-[#DADCE0] dark:divide-[#3C4043]">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">محو بيانات التصفح</h4>
                  <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">مسح السجل، ملفات تعريف الارتباط، والتخزين المؤقت</p>
                </div>
                <button
                  onClick={handleClearBrowsingData}
                  className="px-4 py-2 bg-[#EA4335] text-white text-xs font-medium rounded-md hover:bg-[#D93025] transition"
                >
                  {clearDataSuccess ? 'تم المحو بنجاح ✓' : 'محو البيانات الآن'}
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">التصفح الآمن (Safe Browsing)</h4>
                  <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">حماية قياسية ضد المواقع الخطرة وعمليات التنزيل الضارة</p>
                </div>
                <span className="text-xs text-[#137333] font-medium">مفعّل (موصى به)</span>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium border-b border-[#DADCE0] dark:border-[#3C4043] pb-3">المظهر</h2>
            <div className="bg-white dark:bg-[#292A2D] rounded-xl border border-[#DADCE0] dark:border-[#3C4043] shadow-xs divide-y divide-[#DADCE0] dark:divide-[#3C4043]">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">المظهر الداكن (Dark Mode)</h4>
                  <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">التبديل بين الوضع الليلي والوضع الفاتح لكروم</p>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className="px-4 py-1.5 bg-[#F1F3F4] dark:bg-[#3C4043] text-xs font-medium rounded-md border border-[#DADCE0] dark:border-[#5F6368]"
                >
                  {isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">إظهار شريط الإشارات (Bookmarks Bar)</h4>
                  <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">عرض شريط الإشارات المرجعية تحت شريط العناوين دائماً</p>
                </div>
                <input
                  type="checkbox"
                  checked={showBookmarksBar}
                  onChange={onToggleBookmarksBar}
                  className="w-4 h-4 text-[#1A73E8] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'search' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium border-b border-[#DADCE0] dark:border-[#3C4043] pb-3">محرك البحث</h2>
            <div className="bg-white dark:bg-[#292A2D] rounded-xl p-4 border border-[#DADCE0] dark:border-[#3C4043] shadow-xs flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">محرك البحث المستخدم في شريط العناوين</h4>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">Google هو محرك البحث الافتراضي المعتمد</p>
              </div>
              <select
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value)}
                className="bg-[#F1F3F4] dark:bg-[#3C4043] border border-[#DADCE0] dark:border-[#5F6368] rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="Google">Google (الافتراضي)</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'startup' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium border-b border-[#DADCE0] dark:border-[#3C4043] pb-3">عند بدء التشغيل</h2>
            <div className="bg-white dark:bg-[#292A2D] rounded-xl p-4 border border-[#DADCE0] dark:border-[#3C4043] shadow-xs space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="startup"
                  checked={startupOption === 'newtab'}
                  onChange={() => setStartupOption('newtab')}
                  className="text-[#1A73E8]"
                />
                <span>فتح صفحة علامة تبويب جديدة (Google New Tab)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="startup"
                  checked={startupOption === 'continue'}
                  onChange={() => setStartupOption('continue')}
                  className="text-[#1A73E8]"
                />
                <span>المتابعة من حيث توقفت</span>
              </label>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium border-b border-[#DADCE0] dark:border-[#3C4043] pb-3">لمحة عن Chrome</h2>
            <div className="bg-white dark:bg-[#292A2D] rounded-xl p-6 border border-[#DADCE0] dark:border-[#3C4043] shadow-xs flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#1A73E8]/10 flex items-center justify-center text-3xl">
                🌐
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#202124] dark:text-white">Google Chrome</h3>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-1">الإصدار 128.0.6613.120 (بنية رسمية) (64 بت)</p>
                <div className="flex items-center gap-1.5 text-xs text-[#137333] font-medium mt-2">
                  <Check className="w-4 h-4" />
                  <span>Google Chrome محدث إلى أحدث إصدار</span>
                </div>
                <p className="text-[11px] text-[#70757A] mt-3">
                  حقوق الطبع والنشر لعام 2026 محفوظة لشركة Google LLC. جميع الحقوق محفوظة.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
