import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  Folder,
  ExternalLink,
  Trash2,
  Plus,
  MoreVertical,
  Globe
} from 'lucide-react';

export interface BookmarkEntry {
  id: string;
  title: string;
  url: string;
  folder?: string;
  favicon?: string;
}

interface ChromeBookmarksProps {
  bookmarks: BookmarkEntry[];
  onNavigate: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onAddBookmark: (title: string, url: string) => void;
}

export const ChromeBookmarksPage: React.FC<ChromeBookmarksProps> = ({
  bookmarks,
  onNavigate,
  onRemoveBookmark,
  onAddBookmark,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      onAddBookmark(newTitle.trim(), newUrl.trim());
      setNewTitle('');
      setNewUrl('');
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="flex h-full bg-[#F8F9FA] dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED]" dir="rtl">
      {/* القائمة الجانبية للمجلدات */}
      <div className="w-64 border-l border-[#DADCE0] dark:border-[#3C4043] p-4 bg-white dark:bg-[#292A2D]">
        <div className="flex items-center gap-2.5 px-3 py-3 mb-2 font-bold text-lg text-[#1A73E8]">
          <Bookmark className="w-6 h-6" />
          <span>الإشارات المرجعية</span>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#394457] dark:text-[#8AB4F8] rounded-r-full text-sm font-medium">
          <Folder className="w-4 h-4 text-[#1A73E8]" />
          <span>شريط الإشارات</span>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* شريط البحث عن الإشارات وأزرار الإضافة */}
        <div className="p-6 border-b border-[#DADCE0] dark:border-[#3C4043] bg-white dark:bg-[#292A2D] flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-[#5F6368]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في الإشارات المرجعية..."
              className="w-full pl-4 pr-10 py-2 rounded-full border border-[#DADCE0] dark:border-[#3C4043] bg-[#F1F3F4] dark:bg-[#3C4043] text-sm focus:outline-none focus:bg-white dark:focus:bg-[#202124]"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] text-white rounded-full text-xs font-medium hover:bg-[#1557B0] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إشارة جديدة</span>
          </button>
        </div>

        {/* قائمة الإشارات */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3.5 bg-white dark:bg-[#292A2D] border border-[#DADCE0] dark:border-[#3C4043] rounded-xl hover:shadow-md transition group"
              >
                <div
                  onClick={() => onNavigate(b.url)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F1F3F4] dark:bg-[#3C4043] flex items-center justify-center shrink-0 text-[#1A73E8]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium truncate text-[#1A73E8] group-hover:underline">
                      {b.title}
                    </h4>
                    <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] truncate direction-ltr text-right">
                      {b.url}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveBookmark(b.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                  title="حذف الإشارة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* مودال إضافة إشارة */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#292A2D] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#DADCE0] dark:border-[#3C4043]">
            <h3 className="font-bold text-lg mb-4 text-[#202124] dark:text-white">إضافة إشارة مرجعية</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1">الاسم</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: Google"
                  className="w-full px-3 py-2 rounded-lg border border-[#DADCE0] dark:border-[#3C4043] bg-transparent text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1">الرابط (URL)</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.google.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#DADCE0] dark:border-[#3C4043] bg-transparent text-sm focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5F6368] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-[#1A73E8] text-white rounded-lg hover:bg-[#1557B0]"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
