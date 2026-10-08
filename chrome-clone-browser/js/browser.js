import { SearchEngine } from './search-engine.js';
import { SubtitleDetector } from './subtitle-detector.js';
import { UIRenderer } from './ui-renderer.js';
import { TabManager } from './tabs.js';

// ============================================
// التهيئة
// ============================================
const searchEngine = new SearchEngine();
const detector = new SubtitleDetector();
const renderer = new UIRenderer();
const tabManager = new TabManager();

// الحالة
const state = {
  subtitleMode: false,  // وضع الترجمة
  history: [],
  historyIndex: -1,
  currentUrl: ''
};

// ============================================
// عناصر الواجهة
// ============================================
const omnibox = document.getElementById('omnibox');
const newTabSearch = document.getElementById('newTabSearch');
const webView = document.getElementById('webView');
const newTabPage = document.getElementById('newTabPage');
const subtitleResults = document.getElementById('subtitleResults');
const subtitleModeBtn = document.getElementById('subtitleModeBtn');
const statusBar = document.getElementById('statusBar');
const newTabBtn = document.getElementById('newTabBtn');

// إنشاء أول تبويب
tabManager.createTab(null, 'علامة تبويب جديدة');

if (newTabBtn) {
  newTabBtn.addEventListener('click', () => {
    tabManager.createTab(null, 'علامة تبويب جديدة');
    showNewTabPage();
  });
}

window.addEventListener('tab-activated', (e) => {
  const tab = e.detail;
  if (tab && tab.url) {
    navigateTo(tab.url, false);
  } else {
    showNewTabPage();
  }
});

function showNewTabPage() {
  if (newTabPage) newTabPage.style.display = 'flex';
  if (webView) webView.style.display = 'none';
  if (subtitleResults) subtitleResults.style.display = 'none';
  if (omnibox) omnibox.value = '';
  if (statusBar) statusBar.textContent = 'جاهز';
}

// ============================================
// تفعيل وضع الترجمة
// ============================================
if (subtitleModeBtn) {
  subtitleModeBtn.addEventListener('click', () => {
    state.subtitleMode = !state.subtitleMode;
    subtitleModeBtn.classList.toggle('active', state.subtitleMode);
    if (omnibox) {
      omnibox.placeholder = state.subtitleMode
        ? '🔍 ابحث عن فيديو بترجمة عربية...'
        : 'ابحث في Google أو اكتب عنوان URL';
    }
  });
}

// ============================================
// البحث الرئيسي
// ============================================
async function handleSearch(query) {
  if (!query || !query.trim()) return;

  // 1. تحقق: هل هو URL؟
  if (isUrl(query)) {
    navigateTo(normalizeUrl(query));
    return;
  }

  // 2. إذا كان وضع الترجمة مفعلاً
  if (state.subtitleMode) {
    await searchWithSubtitles(query);
    return;
  }

  // 3. بحث عادي (مثل كروم بالضبط)
  const url = searchEngine.buildNormalUrl(query);
  navigateTo(url);
}

// ============================================
// البحث مع الترجمات (الوظيفة الخاصة)
// ============================================
async function searchWithSubtitles(query) {
  if (statusBar) statusBar.textContent = '🔍 جاري البحث عن الترجمات...';
  
  // 1. استخرج الأكواد
  const codes = searchEngine.extractCodes(query);
  console.log('🎯 الأكواد:', codes);

  // 2. ابحث في جوجل عن النتائج العامة
  const searchUrl = searchEngine.buildSubtitleUrl(query);
  
  // 3. حمّل الصفحة في WebView (مخفي)
  if (webView) {
    webView.style.display = 'block';
    if (newTabPage) newTabPage.style.display = 'none';
    if (subtitleResults) subtitleResults.style.display = 'none';
    webView.src = searchUrl;

    // 4. انتظر التحميل
    webView.onload = () => {
      try {
        // 5. حلل النتائج
        const html = webView.contentDocument.documentElement.outerHTML;
        const results = detector.parseGoogleResults(html);
        
        // 6. رتب النتائج (العربي أولاً)
        const ranked = detector.rank(results);
        
        // 7. اعرض النتائج
        renderer.render(ranked, query);
        
        if (statusBar) statusBar.textContent = `✅ تم العثور على ${ranked.length} نتيجة`;
      } catch (error) {
        // بسبب CORS، قد لا نستطيع قراءة المحتوى
        // في هذه الحالة، نعرض النتائج مباشرة
        console.warn('Cannot read iframe content (CORS), falling back:', error);
        showFallbackResults(query, codes);
      }
    };
  }

  // 8. بعد 5 ثوانٍ، اعرض النتائج البديلة إذا لم يتم التحميل
  setTimeout(() => {
    if (subtitleResults && subtitleResults.style.display === 'none') {
      showFallbackResults(query, codes);
    }
  }, 2500);
}

// ============================================
// عرض النتائج البديلة (عند فشل قراءة iframe)
// ============================================
function showFallbackResults(query, codes) {
  if (statusBar) statusBar.textContent = '⚠️ عرض النتائج الذكية للترجمات...';
  
  const results = [];
  
  // 1. نتائج البحث في مواقع الترجمات
  if (codes.length > 0) {
    codes.forEach(code => {
      // OpenSubtitles
      results.push({
        title: `${code} - OpenSubtitles`,
        url: `https://www.opensubtitles.org/en/search2/sublanguageid-ara/moviename-${code}`,
        snippet: `ابحث عن ترجمة عربية للكود ${code} في OpenSubtitles`,
        domain: 'opensubtitles.org',
        isArabicSubtitle: true,
        isSubtitleSite: true,
        codes: [code],
        score: 100
      });
      
      // SubDL
      results.push({
        title: `${code} - SubDL`,
        url: `https://subdl.com/search/${code}`,
        snippet: `ترجمات عربية للكود ${code} في SubDL`,
        domain: 'subdl.com',
        isArabicSubtitle: true,
        isSubtitleSite: true,
        codes: [code],
        score: 95
      });
      
      // Google search for the code
      results.push({
        title: `${code} ترجمة عربية - بحث جوجل`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`"${code}" ترجمة عربية`)}`,
        snippet: `ابحث في جوجل عن ترجمة عربية للكود ${code}`,
        domain: 'google.com',
        isArabicSubtitle: true,
        isSubtitleSite: false,
        codes: [code],
        score: 90
      });
    });
  } else {
    results.push({
      title: `${query} - ترجمة عربية على OpenSubtitles`,
      url: `https://www.opensubtitles.org/en/search2/sublanguageid-ara/moviename-${encodeURIComponent(query)}`,
      snippet: `بحث مباشر عن ملفات SRT والترجمات العربية لـ ${query}`,
      domain: 'opensubtitles.org',
      isArabicSubtitle: true,
      isSubtitleSite: true,
      codes: [],
      score: 95
    });
    results.push({
      title: `${query} - ترجمة عربية على SubDL`,
      url: `https://subdl.com/search/${encodeURIComponent(query)}`,
      snippet: `تحميل ترجمات عربية احترافية لـ ${query}`,
      domain: 'subdl.com',
      isArabicSubtitle: true,
      isSubtitleSite: true,
      codes: [],
      score: 90
    });
  }
  
  // 2. نتائج عامة
  results.push({
    title: `بحث جوجل: ${query} (ترجمات عربية)`,
    url: `https://www.google.com/search?q=${encodeURIComponent(`"${query}" ترجمة عربية subtitle srt`)}`,
    snippet: `عرض جميع نتائج جوجل المتخصصة بالترجمات لهذا الاستعلام`,
    domain: 'google.com',
    isArabicSubtitle: true,
    isSubtitleSite: false,
    codes: codes,
    score: 85
  });

  // عرض النتائج
  renderer.render(results, query);
}

// ============================================
// التنقل إلى URL
// ============================================
function navigateTo(url, updateTab = true) {
  state.currentUrl = url;
  if (newTabPage) newTabPage.style.display = 'none';
  if (subtitleResults) subtitleResults.style.display = 'none';
  if (webView) {
    webView.style.display = 'block';
    webView.src = url;
  }
  if (omnibox) omnibox.value = url;
  if (statusBar) statusBar.textContent = `📄 ${url}`;
  
  if (updateTab && tabManager.activeTabId) {
    try {
      const hostname = new URL(url).hostname;
      tabManager.updateTab(tabManager.activeTabId, { url, title: hostname });
    } catch {
      tabManager.updateTab(tabManager.activeTabId, { url, title: url });
    }
  }

  // أضف إلى السجل
  if (state.history[state.historyIndex] !== url) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(url);
    state.historyIndex = state.history.length - 1;
  }
}

// ============================================
// أدوات مساعدة
// ============================================
function isUrl(str) {
  if (!str) return false;
  const trimmed = str.trim();
  if (trimmed.includes(' ')) return false;
  if (/^[A-Z]{2,6}-?\d{2,5}$/i.test(trimmed)) return false;
  return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed);
}

function normalizeUrl(str) {
  return str.startsWith('http') ? str : `https://${str}`;
}

// ============================================
// ربط الأحداث
// ============================================

// Omnibox
if (omnibox) {
  omnibox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch(omnibox.value);
      omnibox.blur();
    }
  });
}

// صفحة التبويب الجديد
if (newTabSearch) {
  newTabSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch(newTabSearch.value);
      newTabSearch.value = '';
    }
  });
}

// أزرار التنقل
document.getElementById('backBtn')?.addEventListener('click', () => {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    navigateTo(state.history[state.historyIndex]);
  }
});

document.getElementById('forwardBtn')?.addEventListener('click', () => {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    navigateTo(state.history[state.historyIndex]);
  }
});

document.getElementById('refreshBtn')?.addEventListener('click', () => {
  if (webView && webView.style.display !== 'none') {
    webView.src = webView.src;
  }
});

document.getElementById('homeBtn')?.addEventListener('click', () => {
  showNewTabPage();
});

// الاختصارات
document.querySelectorAll('.shortcut').forEach(shortcut => {
  shortcut.addEventListener('click', () => {
    const targetUrl = shortcut.getAttribute('data-url');
    if (targetUrl) navigateTo(targetUrl);
  });
});

// شريط الإشارات
document.querySelectorAll('.bookmark-item').forEach(bm => {
  bm.addEventListener('click', () => {
    const text = bm.textContent.replace('📌', '').trim();
    if (text.includes('Google')) navigateTo('https://www.google.com');
    else if (text.includes('YouTube')) navigateTo('https://www.youtube.com');
    else if (text.includes('OpenSubtitles')) navigateTo('https://www.opensubtitles.org');
  });
});

// ============================================
// التهيئة الأولية
// ============================================
console.log('🚀 المتصفح جاهز');
console.log('💡 نصيحة: اضغط على أيقونة الترجمة في شريط العنوان لتفعيل وضع البحث عن الترجمات العربية');

export { searchEngine, detector, renderer, tabManager, state, handleSearch, navigateTo };
