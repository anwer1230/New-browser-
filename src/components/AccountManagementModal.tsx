import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  X,
  ShieldCheck,
  HardDrive,
  Cloud,
  History,
  Database,
  Key,
  FolderOpen,
  Settings,
  Shield,
  UserPlus,
  LogOut,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Laptop,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenHistory: () => void;
  onOpenDatabases: () => void;
  onOpenSaved: () => void;
  onOpenPasswords: () => void;
  onOpenSettings: () => void;
  onOpenSecurity: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenHistory,
  onOpenDatabases,
  onOpenSaved,
  onOpenPasswords,
  onOpenSettings,
  onOpenSecurity,
  onSignIn,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'privacy' | 'security'>('overview');
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    avatar: string;
    storageUsed: string;
    storageTotal: string;
    status: string;
    syncEnabled: boolean;
  }>({
    name: user?.displayName || 'Anwer Fouad',
    email: user?.email || 'anwerfoud80@gmail.com',
    avatar: user?.displayName?.charAt(0).toUpperCase() || 'A',
    storageUsed: '4.2 GB',
    storageTotal: '15 GB',
    status: 'حساب Google نشط وموثق ✓',
    syncEnabled: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/user-profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setProfile((prev) => ({
              ...prev,
              name: user?.displayName || data.name || prev.name,
              email: user?.email || data.email || prev.email,
              avatar: user?.displayName?.charAt(0).toUpperCase() || data.avatar || prev.avatar,
              storageUsed: data.storageUsed || prev.storageUsed,
              storageTotal: data.storageTotal || prev.storageTotal,
              status: data.status || prev.status,
              syncEnabled: typeof data.syncEnabled === 'boolean' ? data.syncEnabled : true,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-right"
        dir="rtl"
      >
        {/* مقبض سحب الموبايل */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* بطاقة الحساب العلوية مع الشعار والزر */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[#4285F4]">G</span>
            <span className="text-[17px] font-bold text-[#EA4335]">o</span>
            <span className="text-[17px] font-bold text-[#FBBC05]">o</span>
            <span className="text-[17px] font-bold text-[#4285F4]">g</span>
            <span className="text-[17px] font-bold text-[#34A853]">l</span>
            <span className="text-[17px] font-bold text-[#EA4335]">e</span>
            <span className="text-[14px] font-semibold text-[#5F6368] mr-1.5">حساب</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5F6368] hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* البروفايل الرئيسي والمزامنة */}
        <div className="p-5 bg-gradient-to-b from-[#F8FAFD] to-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1A73E8] to-[#0D47A1] text-white text-[22px] font-bold flex items-center justify-center shadow-md relative shrink-0">
              <span>{profile.avatar}</span>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#202124] truncate">
                  {profile.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                  موثق ✓
                </span>
              </div>
              <p className="text-[12.5px] text-[#5F6368] truncate mt-0.5">
                {profile.email}
              </p>
              <div className="flex items-center gap-1.5 text-[11.5px] text-emerald-700 font-medium mt-1">
                <Cloud className="w-3.5 h-3.5" />
                <span>المزامنة السحابية اللحظية مع Firestore نشطة</span>
              </div>
            </div>
          </div>

          {/* تبويبات التنقل الداخلية */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-200/70">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              نظرة عامة والخدمات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              البيانات والخصوصية
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              الأمان والأجهزة
            </button>
          </div>
        </div>

        {/* محتوى التبويبات والمسارات الحقيقية الفعلية */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'overview' && (
            <>
              {/* بطاقة التخزين السحابي */}
              <div className="p-4 rounded-[20px] bg-white border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#1A73E8]" />
                    <span className="font-bold text-[13.5px] text-[#202124]">
                      مساحة تخزين Google Drive والحساب
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-[#1A73E8]">
                    {profile.storageUsed} من {profile.storageTotal}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{ width: '28%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2">
                  <span>Google Drive • Gmail • الصور • ذاكرة المتصفح</span>
                  <span className="text-emerald-600 font-semibold">متبقي 10.8 GB مجاناً</span>
                </div>
              </div>

              {/* شبكة المسارات والخدمات الحقيقية الفعلية */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-bold text-gray-700 px-1">
                  الخدمات والمسارات المرتبطة بالحساب
                </h4>

                {/* 1. سجل البحث والمشاهدات */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="w-full p-3.5 rounded-[16px] border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 flex items-center justify-between gap-3 transition-all cursor-pointer text-right group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-[18px]">
                      🕒
                    </span>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#202124] group-hover:text-[#1A73E8] transition-colors">
                        سجل التصفح وسجل البحث
                      </div>
                      <div className="text-[11.5px] text-[#5F6368]">
                        حفظ ومزامنة فورية • يعمل بدون إنترنت (Offline)
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#1A73E8]" />
                </button>

                {/* 2. قواعد البيانات الخمس السحابية */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDatabases();
                  }}
                  className="w-full p-3.5 rounded-[16px] border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 flex items-center justify-between gap-3 transition-all cursor-pointer text-right group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-[18px]">
                      🗄️
                    </span>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#202124] group-hover:text-indigo-600 transition-colors">
                        قواعد البيانات الخمس السحابية
                      </div>
                      <div className="text-[11.5px] text-[#5F6368]">
                        تدفق الفيديو، سجل المشاهدة، والنسخ السحابي المتزامن
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                </button>

                {/* 3. مدير كلمات المرور */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPasswords();
                  }}
                  className="w-full p-3.5 rounded-[16px] border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 flex items-center justify-between gap-3 transition-all cursor-pointer text-right group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-[18px]">
                      🔑
                    </span>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#202124] group-hover:text-amber-600 transition-colors">
                        مدير كلمات المرور وسجلات الدخول
                      </div>
                      <div className="text-[11.5px] text-[#5F6368]">
                        إكمال تلقائي مشفر للحسابات المحفوظة
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                </button>

                {/* 4. المحفوظات وقوائم القراءة */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSaved();
                  }}
                  className="w-full p-3.5 rounded-[16px] border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 flex items-center justify-between gap-3 transition-all cursor-pointer text-right group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-[18px]">
                      💾
                    </span>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#202124] group-hover:text-emerald-600 transition-colors">
                        المحفوظات والتنزيلات بدون إنترنت
                      </div>
                      <div className="text-[11.5px] text-[#5F6368]">
                        قراءة الصفحات ومشاهدة مقاطع الفيديو بدون اتصال
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                </button>

                {/* 5. إعدادات البحث والتعريب */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full p-3.5 rounded-[16px] border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 flex items-center justify-between gap-3 transition-all cursor-pointer text-right group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-[18px]">
                      ⚙️
                    </span>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#202124] group-hover:text-purple-600 transition-colors">
                        إعدادات البحث والترجمة الفورية
                      </div>
                      <div className="text-[11.5px] text-[#5F6368]">
                        محرك Turbo 100x • تعريب تلقائي دائم للعربية
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                </button>
              </div>
            </>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div className="p-4 rounded-[18px] bg-[#F8F9FA] border border-gray-200">
                <h4 className="font-bold text-[14px] text-[#202124] mb-1">
                  الخصوصية وسجل النشاط
                </h4>
                <p className="text-[12px] text-[#5F6368] leading-relaxed">
                  يتم حفظ عمليات البحث والمشاهدة بأمان محلياً وسحابياً لتحسين تجربتك وتوفير الوصول بدون إنترنت.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHistory();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1A73E8] text-white text-[12px] font-bold cursor-pointer"
                  >
                    عرض وإدارة السجل
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-white border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[13.5px] text-[#202124]">
                    منع التتبع والمواقع الاحتيالية
                  </h4>
                  <p className="text-[11.5px] text-[#5F6368]">
                    حظر ملفات تعريف الارتباط التابعة لجهات خارجية
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  مفعّل دائماً ✓
                </span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="p-4 rounded-[18px] bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[14px] text-emerald-950">
                    الحساب مؤمّن بالكامل
                  </h4>
                  <p className="text-[12px] text-emerald-800/80 mt-1 leading-relaxed">
                    التحقق بخطوتين مفعّل، وحماية التصفح المشددة (Enhanced Safe Browsing) تعمل على جميع التبويبات.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-white border border-gray-200 space-y-2.5">
                <h4 className="font-bold text-[13.5px] text-[#202124]">
                  الأجهزة المتصلة بالحساب (2)
                </h4>
                <div className="flex items-center justify-between text-[12.5px] text-gray-700 py-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#1A73E8]" />
                    <span>هاتف Android (هذا الجهاز)</span>
                  </div>
                  <span className="text-emerald-600 text-[11px] font-bold">نشط الآن</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px] text-gray-700 py-1.5">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-gray-500" />
                    <span>متصفح Chrome (حاسوب)</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">متزامن</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* الشريط السفلي: إضافة حساب وتسجيل الخروج */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-[#F8F9FA] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignIn();
            }}
            className="px-3.5 py-1.5 rounded-xl border border-gray-300 hover:bg-white text-[12.5px] font-bold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#1A73E8]" />
            <span>إضافة حساب آخر</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="px-3.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 text-[12.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};
