# 🚀 دليل النشر السريع على منصة Render.com

تم تجهيز المستودع بالكامل للنشر الفوري على منصة **Render** بطريقتين (تلقائية عبر Blueprint أو يدوية كخدمة ويب):

---

## الطريقة الأولى: النشر التلقائي بضغطة واحدة (Render Blueprint) — موصى بها
1. افتح لوحة تحكم **[Render Dashboard](https://dashboard.render.com/)**.
2. اضغط على زر **New +** أعلى الصفحة واختر **Blueprint**.
3. اختر مستودعك: **`anwer1230/New-browser-`**.
4. سيتعرف Render تلقائياً على ملف `render.yaml` ويقوم بإنشاء:
   - **`new-browser-unified`**: المتصفح الموحّد الكامل (الواجهة الشبيهة بـ Chrome + خادم فتح المواقع `/api/web-proxy` + الترجمة التلقائية الفورية `/api/translate` + مساعد الذكاء `/api/ai/ask` + قاعدة بيانات الحفظ `/api/saved-pages`).
   - **`new-browser-python-api`**: خادم FastAPI المستقل في `hybrid_browser/server/media_server.py`.
5. اضغط **Apply** وسيبدأ البناء والتشغيل تلقائياً (مفتاح Groq مدمج بالفعل داخل النظام، ويمكنك أيضاً إضافته في `GROQ_API_KEY` إذا رغبت).

---

## الطريقة الثانية: إنشاء Web Service عادي على Render
إذا اخترت **New +** ثم **Web Service**:
- **Environment / Runtime**: `Node` (أو `Docker`)
- **Build Command**:
  ```bash
  npm install --include=dev && npm run build
  ```
- **Start Command**:
  ```bash
  npm run start
  ```
- **Plan**: `Free`

---

## ربط تطبيق Flutter بالرابط المنشور على Render
بعد اكتمال النشر على Render وحصولك على الرابط (مثلاً `https://new-browser-unified.onrender.com`)، ضع الرابط في:
- `hybrid_browser/lib/services/background_service.dart` (`_serverUrl`)
- `hybrid_browser/lib/services/save_service.dart` (`_serverUrl`)
