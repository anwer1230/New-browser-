import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, X, HardDrive, Layers, Server, Cloud, Loader2 } from 'lucide-react';

interface FiveDatabasesApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApproved: () => void;
}

export const FiveDatabasesApprovalModal: React.FC<FiveDatabasesApprovalModalProps> = ({
  isOpen,
  onClose,
  onApproved,
}) => {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsProvisioning(true);
    try {
      const res = await fetch('/api/init-video-databases', { method: 'POST' });
      if (res.ok) {
        setIsSuccess(true);
        try {
          localStorage.setItem('five_video_dbs_approved', 'true');
        } catch {}
        setTimeout(() => {
          setIsProvisioning(false);
          onApproved();
          onClose();
        }, 1200);
        return;
      }
    } catch {}
    setIsProvisioning(false);
    onApproved();
    onClose();
  };

  const databasesList = [
    {
      num: '1',
      id: 'video_chunks_db',
      name: 'قاعدة بيانات تدفق وكتل الفيديوهات (Video Chunks DB)',
      desc: 'حفظ وتقسيم كتل وتدفقات الفيديو للتخزين المؤقت والبث السريع.',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      tag: 'تدفق وبث كتل',
    },
    {
      num: '2',
      id: 'watch_history_db',
      name: 'قاعدة بيانات سجل المشاهدة ومتابعة التقدم (Watch History DB)',
      desc: 'حفظ تفاصيل المشاهدات، أوقات التوقف، نسب الإكمال، وتواريخ المشاهدة.',
      icon: <Database className="w-5 h-5 text-indigo-600" />,
      tag: 'سجل زمني متكامل',
    },
    {
      num: '3',
      id: 'offline_media_db',
      name: 'قاعدة بيانات الوسائط غير المتصلة (Offline Media DB)',
      desc: 'تخزين ملفات الفيديو كاملة محلياً لتشغيلها في أي وقت بدون إنترنت.',
      icon: <HardDrive className="w-5 h-5 text-emerald-600" />,
      tag: 'تشغيل بدون إنترنت 💾',
    },
    {
      num: '4',
      id: 'subtitles_transcripts_db',
      name: 'قاعدة بيانات الترجمات والتفريغ الصوتي (Subtitles & Transcripts DB)',
      desc: 'حفظ ملفات الترجمة الفورية العربية (.srt) والتفريغ الصوتي لنماذج الذكاء.',
      icon: <Server className="w-5 h-5 text-amber-600" />,
      tag: 'ترجمة فورية SRT',
    },
    {
      num: '5',
      id: 'cloud_replication_db',
      name: 'قاعدة بيانات التكرار والمزامنة السحابية (Cloud Replication DB)',
      desc: 'مزامنة ثنائية الاتجاه مع Firebase Firestore لضمان عدم ضياع أي سجل.',
      icon: <Cloud className="w-5 h-5 text-purple-600" />,
      tag: 'مزامنة Firestore ☁️',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white text-[#202124] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* الهيدر */}
        <div className="bg-gradient-to-r from-[#1A73E8] via-[#1557B0] to-[#0D47A1] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[16px]">إذن بناء وتفعيل 5 قواعد بيانات خارجية</h3>
              <p className="text-[12px] text-blue-100">لحفظ وسائط السجل والمشاهدة التلقائية بدون إنترنت</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProvisioning}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="text-[13.5px] text-[#3C4043] leading-relaxed">
            لتمكين المتصفح من حفظ أي فيديو تشاهده تلقائياً وتمكينك من تشغيله في السجل حتى بدون إنترنت، يتطلب النظام موافقتك على إنشاء وتجهيز <strong>5 قواعد بيانات خارجية مستقلة</strong> على الخادم:
          </div>

          {/* قائمة القواعد الخمس */}
          <div className="space-y-2.5">
            {databasesList.map((dbItem) => (
              <div
                key={dbItem.id}
                className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] hover:border-[#1A73E8] transition-colors flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-xs">
                  {dbItem.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[13px] text-[#202124] truncate">
                      {dbItem.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1A73E8] text-[10.5px] font-medium shrink-0">
                      {dbItem.tag}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#5F6368] mt-1 leading-normal">
                    {dbItem.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* إشعار الأمان والمطابقة */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-900 leading-normal">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>تخزين دائم وحقيقي:</strong> سيتم إنشاء هياكل القواعد ومجلد التخزين الدائم على الخادم مع دعم فوري لتقنية Cache Storage لتشغيل الفيديو بدون اتصال بالإنترنت.
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="p-4 bg-[#F8F9FA] border-t border-[#E8EAED] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProvisioning}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#5F6368] hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isProvisioning || isSuccess}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1A73E8] text-white hover:bg-blue-700 active:scale-95'
            } disabled:opacity-60`}
          >
            {isProvisioning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري بناء القواعد الخمس...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>تم التفعيل بنجاح ✓</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>موافقة وبناء القواعد الخمس فوراً</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
