# 🎬 محرك البحث الذكي عن الترجمات العربية داخل متصفحك (Smart Subtitle Engine)

التطبيق الكامل والنهائي لمحرك البحث عن الترجمات العربية المدمج بالمتصفح.

## 🏗️ الهيكل الكامل للمشروع
```
smart-subtitle-engine/
├── core/
│   ├── parser.js              # استخراج الأكواد من العنوان
│   ├── search-aggregator.js   # البحث في المصادر المتعددة
│   ├── ranker.js              # ترتيب النتائج (عربي أولاً)
│   ├── translator.js          # الترجمة الآلية (Fallback)
│   └── index.js               # الواجهة الموحدة
├── ui/
│   ├── results-renderer.js    # عرض النتائج في المتصفح
│   └── styles.css             # تنسيقات الواجهة المخصصة
├── browser/
│   ├── omnibox-hook.js        # ربط شريط العنوان
│   └── webview-injector.js    # حقن الكود في WebView
└── server/                    # اختياري (لتجاوز CORS)
    ├── server.js
    └── package.json
```
