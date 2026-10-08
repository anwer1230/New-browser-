import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Trash2,
  Shield,
  Sparkles,
  Languages,
  Database,
  Download,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'security' | 'speed' | 'translation' | 'database' | 'offline' | string;
  icon?: string;
  unread: boolean;
  timestamp: string;
  path?: string;
  actionType?: string;
  actionLabel?: string;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (actionType: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
    } catch {
      // fallback if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setUnreadCount(0);
      }
    } catch {
      setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
      setUnreadCount(0);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {}
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, unread: false } : i))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {}
    setItems((prev) => prev.filter((i) => i.id !== id));
    setUnreadCount((prev) => {
      const target = items.find((i) => i.id === id);
      return target?.unread ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleClearAll = async () => {
    if (!confirm('هل تريد مسح جميع الإشعارات؟')) return;
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch {}
    setItems([]);
    setUnreadCount(0);
  };

  const handleExecuteAction = (item: NotificationItem) => {
    handleMarkSingleRead(item.id);
    onClose();
    if (item.actionType && onAction) {
      onAction(item.actionType);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'unread') return item.unread;
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'security':
        return { label: 'أمان وتشفير', bg: 'bg-emerald-100 text-emerald-800' };
      case 'speed':
        return { label: 'سرعة Turbo', bg: 'bg-amber-100 text-amber-800' };
      case 'translation':
        return { label: 'تعريب تلقائي', bg: 'bg-blue-100 text-blue-800' };
      case 'database':
        return { label: 'قواعد سحابية', bg: 'bg-indigo-100 text-indigo-800' };
      case 'offline':
        return { label: 'متاح بدون نت', bg: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'تنبيه نظام', bg: 'bg-gray-100 text-gray-800' };
    }
  };

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
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EA4335] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#202124]">
                الإشعارات والتنبيهات 🔔
              </h3>
              <p className="text-[11.5px] text-[#5F6368]">
                {unreadCount > 0
                  ? `لديك ${unreadCount} تنبيهات غير مقروءة`
                  : 'جميع الإشعارات مقروءة بنجاح'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 text-[12px] font-medium text-[#1A73E8] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="تحديد الكل كمقروء"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#5F6368] hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* تبويبات التصفية */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-gray-100 bg-[#F8F9FA] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'bg-white text-[#5F6368] hover:bg-gray-200 border border-gray-200'
              }`}
            >
              الكل ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'bg-white text-[#5F6368] hover:bg-gray-200 border border-gray-200'
              }`}
            >
              غير المقروءة ({unreadCount})
            </button>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11.5px] text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
              <span>مسح الكل</span>
            </button>
          )}
        </div>

        {/* قائمة الإشعارات */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && items.length === 0 ? (
            <div className="py-12 text-center text-[#5F6368] text-sm">
              جاري تحميل الإشعارات...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h4 className="text-[15px] font-semibold text-[#202124]">
                لا توجد إشعارات حالياً
              </h4>
              <p className="text-[12px] text-[#5F6368] mt-1">
                {activeTab === 'unread'
                  ? 'لا توجد أي إشعارات جديدة غير مقروءة.'
                  : 'ستظهر هنا تحديثات الأمان، سرعة التحميل، وحفظ الوسائط.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const badge = getCategoryBadge(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkSingleRead(item.id)}
                  className={`p-3.5 rounded-[16px] border transition-all cursor-pointer relative ${
                    item.unread
                      ? 'bg-[#F0F4F9] border-[#D2E3FC] shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* شريط الإشعار العلوي */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[17px]">{item.icon || '🔔'}</span>
                      <span className="font-bold text-[14px] text-[#202124]">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
                        title="حذف الإشعار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* نص الرسالة */}
                  <p className="text-[12.5px] text-[#4D5156] leading-relaxed mb-2.5 pr-6">
                    {item.message}
                  </p>

                  {/* الإجراء والمسار الحقيقي */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 mt-1">
                    <span className="text-[11px] text-[#80868B] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>

                    {item.actionLabel && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteAction(item);
                        }}
                        className="px-3 py-1 rounded-[12px] bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* الشريط السفلي */}
        <div className="px-5 py-3 border-t border-gray-100 bg-[#F8F9FA] flex items-center justify-between text-[12px] text-[#5F6368] shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>نظام الإشعارات اللحظية نشط</span>
          </span>
          <button
            type="button"
            onClick={fetchNotifications}
            className="text-[#1A73E8] hover:underline cursor-pointer font-medium"
          >
            تحديث القائمة
          </button>
        </div>
      </div>
    </div>
  );
};
