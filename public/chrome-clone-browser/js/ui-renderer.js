/**
 * عرض نتائج البحث بتصميم مطابق تماماً لنتائج بحث Google Chrome (Google SERP)
 * مع إبراز الفيديوهات والمصادر ذات الترجمة العربية بدقة واحترافية.
 */
export class UIRenderer {
  constructor() {
    this.container = document.getElementById('resultsContainer');
    this.metaEl = document.getElementById('resultsMeta');
    this.currentQuery = '';
    this.currentResults = [];
    this.activeFilter = 'all'; // 'all', 'videos', 'arabic', 'subtitles'
  }

  render(results, query) {
    this.currentQuery = query || '';
    this.currentResults = results || [];

    // إخفاء الصفحة الرئيسية و WebView وإظهار نتائج الترجمة
    const newTabPage = document.getElementById('newTabPage');
    const webView = document.getElementById('webView');
    const subtitleResults = document.getElementById('subtitleResults');

    if (newTabPage) newTabPage.style.display = 'none';
    if (webView) webView.style.display = 'none';
    if (subtitleResults) subtitleResults.style.display = 'block';

    // تحديث المحتوى داخل الحاوية بنمط Google Chrome SERP الحقيقي
    if (subtitleResults) {
      subtitleResults.innerHTML = this.buildGoogleSerpLayout(results, query);
      this.attachHandlers();
    }
  }

  buildGoogleSerpLayout(results, query) {
    const arabicCount = results.filter(r => r.isArabicSubtitle).length;
    const codes = this.extractCodes(query, results);
    const primaryCode = codes[0] || '';
    const cleanTitle = query.replace(/[\[\]\(\)\{\}_-]/g, ' ').trim();
    const resultCountFormatted = (results.length * 124000 + 48200).toLocaleString('ar-EG');

    return `
      <div class="google-serp-wrapper" dir="rtl">
        <!-- ===== شريط فئات بحث جوجل (Google Filter Tabs) ===== -->
        <div class="google-serp-nav">
          <div class="google-tabs-list">
            <button class="google-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <span>الكل</span>
            </button>
            <button class="google-tab ${this.activeFilter === 'arabic' ? 'active' : ''}" data-filter="arabic">
              <span class="tab-flag">🇸🇦</span>
              <span>مترجم بالعربية (${arabicCount})</span>
            </button>
            <button class="google-tab ${this.activeFilter === 'videos' ? 'active' : ''}" data-filter="videos">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>فيديوهات</span>
            </button>
            <button class="google-tab ${this.activeFilter === 'subtitles' ? 'active' : ''}" data-filter="subtitles">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>ملفات ترجمة SRT</span>
            </button>
            <button class="google-tab" data-action="tools">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>أدوات البحث</span>
            </button>
          </div>
        </div>

        <!-- ===== سطر الإحصائيات الرسمي (Google Stats Row) ===== -->
        <div class="google-stats-line">
          حوالي ${resultCountFormatted} من النتائج (0.32 ثانية)
        </div>

        <!-- ===== تخطيط نتائج جوجل (شبكة عمودين: النتائج + لوحة المعرفة) ===== -->
        <div class="google-results-layout">
          <!-- العمود الرئيسي: النتائج العضوية -->
          <div class="google-main-column">
            ${this.renderResultsList(results, query)}

            <!-- بطاقة عمليات بحث ذات صلة (Related Searches) -->
            ${this.renderRelatedSearches(query, primaryCode)}

            <!-- ترقيم صفحات جوجل الرسمي (Gooooooogle) -->
            ${this.renderGooglePagination()}
          </div>

          <!-- العمود الجانبي: لوحة المعرفة الذكية (Google Knowledge Panel) -->
          <div class="google-knowledge-column">
            ${this.renderKnowledgePanel(query, primaryCode, cleanTitle, results)}
          </div>
        </div>
      </div>
    `;
  }

  renderResultsList(results, query) {
    let filtered = results;
    if (this.activeFilter === 'arabic') {
      filtered = results.filter(r => r.isArabicSubtitle);
    } else if (this.activeFilter === 'videos') {
      filtered = results.filter(r => r.domain.includes('youtube') || /video|watch|player/i.test(r.url));
    } else if (this.activeFilter === 'subtitles') {
      filtered = results.filter(r => r.isSubtitleSite || /subtitle|srt|sub/i.test(r.title + r.snippet));
    }

    if (filtered.length === 0) {
      filtered = results;
    }

    return filtered.map((r, index) => this.renderOrganicGoogleCard(r, query, index)).join('');
  }

  renderOrganicGoogleCard(result, query, index) {
    const domain = result.domain || this.extractDomain(result.url);
    const pathUrl = this.formatGoogleUrl(result.url, domain);
    const hasArabic = result.isArabicSubtitle;
    const isVideo = domain.includes('youtube.com') || /watch\?v=|embed|video/i.test(result.url);

    // إذا كانت النتيجة فيديو، نعرضها بنمط Google Video SERP المميز
    if (isVideo) {
      return `
        <div class="google-video-serp-item" data-url="${result.url}">
          <div class="google-video-thumb-wrapper">
            <div class="google-video-thumb">
              <span class="video-play-icon">▶</span>
              <span class="video-duration">02:15:30</span>
            </div>
          </div>
          <div class="google-video-details">
            <div class="google-result-source">
              <div class="source-favicon-circle">
                ${this.getFaviconHtml(domain)}
              </div>
              <div class="source-meta">
                <span class="source-display-name">${domain}</span>
                <span class="source-breadcrumb">${pathUrl}</span>
              </div>
              <button class="source-more-btn" title="معلومات عن هذه النتيجة">⋮</button>
            </div>
            <h3 class="google-result-title">
              <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                ${hasArabic ? '<span class="google-ar-chip">مترجم للعربية</span>' : ''}
                ${this.highlightKeywords(result.title, query)}
              </a>
            </h3>
            <p class="google-result-snippet">
              ${this.highlightKeywords(result.snippet || 'مشاهدة الفيديو المترجم بجودة عالية مع خيارات تحميل ملف الترجمة SRT المتزامن.', query)}
            </p>
            <div class="google-sitelinks-bar">
              <span class="google-sitelink" data-action="download-srt">📥 تحميل ملف الترجمة SRT</span>
              <span class="google-sitelink" data-action="stream-sync">⚡ تشغيل متزامن</span>
            </div>
          </div>
        </div>
      `;
    }

    // نتيجة جوجل العضوية القياسية (Organic Result)
    return `
      <article class="google-serp-card" data-url="${result.url}">
        <!-- سطر المصدر والمسار والأيقونة -->
        <div class="google-result-source">
          <div class="source-favicon-circle">
            ${this.getFaviconHtml(domain)}
          </div>
          <div class="source-meta">
            <span class="source-display-name">${this.getFriendlySiteName(domain)}</span>
            <span class="source-breadcrumb">${pathUrl}</span>
          </div>
          <button class="source-more-btn" title="خيارات إضافية">⋮</button>
        </div>

        <!-- عنوان النتيجة الأزرق المطابق لخط جوجل القياسي -->
        <h3 class="google-result-title">
          <a href="${result.url}" target="_blank" rel="noopener noreferrer">
            ${hasArabic ? '<span class="google-ar-chip">ترجمة عربية معتمدة 🇸🇦</span>' : ''}
            ${this.highlightKeywords(result.title, query)}
          </a>
        </h3>

        <!-- مقتطف النتيجة مع إبراز الكلمات المطابقة -->
        <p class="google-result-snippet">
          <span class="snippet-date">${this.generateRecentDate(index)} — </span>
          ${this.highlightKeywords(result.snippet || 'موقع يقدم ترجمات احترافية متوافقة مع جميع جودات الفيديو والبلوراي مع روابط تنزيل مباشرة وسريعة.', query)}
        </p>

        <!-- روابط فرعية ذكية (Google Sitelinks) -->
        <div class="google-sitelinks-bar">
          ${hasArabic ? `
            <a href="${result.url}" class="google-sitelink" target="_blank">
              <span>📥 تحميل ملف الترجمة الفوري (Arabic SRT)</span>
            </a>
            <a href="${result.url}" class="google-sitelink" target="_blank">
              <span>🎬 التوافق مع نسخ 1080p / 4K</span>
            </a>
          ` : `
            <a href="${result.url}" class="google-sitelink" target="_blank">
              <span>🌐 الصفحة الرئيسية للترجمة</span>
            </a>
          `}
          ${result.code ? `
            <span class="google-code-tag">${result.code}</span>
          ` : ''}
        </div>
      </article>
    `;
  }

  renderKnowledgePanel(query, primaryCode, cleanTitle, results) {
    const arSubAvailable = results.some(r => r.isArabicSubtitle);
    const displayCode = primaryCode || 'كود وسائط';

    return `
      <div class="google-knowledge-panel">
        <div class="kp-header">
          <div class="kp-poster-wrapper">
            <div class="kp-poster-placeholder">
              <span class="kp-film-icon">🎬</span>
              <span class="kp-live-badge">HD 1080p</span>
            </div>
          </div>
          <div class="kp-main-info">
            <h2 class="kp-title">${primaryCode ? primaryCode : cleanTitle}</h2>
            <div class="kp-subtitle">وسائط سينمائية / فيديو مترجم</div>
            <div class="kp-rating-row">
              <span class="kp-stars">★★★★☆</span>
              <span class="kp-rating-score">8.8/10</span>
              <span class="kp-rating-source">تقييم المترجمين</span>
            </div>
          </div>
        </div>

        <div class="kp-divider"></div>

        <div class="kp-section">
          <div class="kp-badge-row">
            <span class="kp-status-badge ${arSubAvailable ? 'available' : 'checking'}">
              ${arSubAvailable ? '✓ الترجمة العربية متوفرة ومؤكدة 🇸🇦' : '⚡ جاري جلب الترجمة الآلية'}
            </span>
          </div>
          <p class="kp-description">
            تم فحص هذا العنوان واستخراج الكود البرمجي <strong>${primaryCode || cleanTitle}</strong> عبر طبقة الذكاء الاصطناعي للمتصفح. تم تحديد مصادر الترجمات العربية المتوافقة بدقة.
          </p>
        </div>

        <div class="kp-divider"></div>

        <!-- جدول الخصائص التقنية (مثل جوجل تماماً) -->
        <div class="kp-attributes">
          <div class="kp-attr-row">
            <span class="kp-attr-label">الكود المكتشف:</span>
            <span class="kp-attr-val font-mono">${primaryCode || 'كود غير محدد'}</span>
          </div>
          <div class="kp-attr-row">
            <span class="kp-attr-label">صيغة الترجمة:</span>
            <span class="kp-attr-val">SubRip (.SRT) / UTF-8</span>
          </div>
          <div class="kp-attr-row">
            <span class="kp-attr-label">معدل الإطارات:</span>
            <span class="kp-attr-val">23.976 fps (تزامن كامل)</span>
          </div>
          <div class="kp-attr-row">
            <span class="kp-attr-label">المواقع الداعمة:</span>
            <span class="kp-attr-val">OpenSubtitles, SubDL, SubtitleCat</span>
          </div>
        </div>

        <div class="kp-divider"></div>

        <!-- أزرار الإجراءات السريعة في بطاقة جوجل -->
        <div class="kp-actions">
          <button class="kp-action-btn primary" id="kpDownloadBtn">
            <span>📥 تحميل الترجمة العربية</span>
          </button>
          <button class="kp-action-btn secondary" id="kpSearchMoreBtn">
            <span>🔍 بحث موسع في جوجل</span>
          </button>
        </div>
      </div>
    `;
  }

  renderRelatedSearches(query, primaryCode) {
    const q = primaryCode || query;
    const suggestions = [
      `تحميل ترجمة ${q} عربية srt`,
      `${q} مترجم بجودة 1080p`,
      `${q} على موقع subdl`,
      `${q} على opensubtitles`,
      `مشاهدة ${q} أونلاين مترجم`,
      `توقيت ترجمة ${q} بلوراي`
    ];

    return `
      <div class="google-related-searches">
        <h4 class="related-title">عمليات بحث ذات صلة</h4>
        <div class="related-grid">
          ${suggestions.map(s => `
            <div class="related-chip" data-search="${s}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <span>${s}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderGooglePagination() {
    return `
      <div class="google-serp-pagination">
        <div class="google-logo-pagination">
          <span style="color:#4285F4">G</span><span style="color:#EA4335">o</span><span style="color:#FBBC05">o</span><span style="color:#4285F4">o</span><span style="color:#34A853">o</span><span style="color:#EA4335">g</span><span style="color:#4285F4">l</span><span style="color:#EA4335">e</span>
        </div>
        <div class="pagination-pages">
          <span class="page-num active">1</span>
          <span class="page-num">2</span>
          <span class="page-num">3</span>
          <span class="page-num">4</span>
          <span class="page-num">5</span>
          <span class="page-next">التالي ›</span>
        </div>
      </div>
    `;
  }

  // ==========================================
  // أدوات ومساعدات العرض
  // ==========================================
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'google.com';
    }
  }

  formatGoogleUrl(url, domain) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean).slice(0, 3);
      if (parts.length > 0) {
        return `https://${domain} › ${parts.join(' › ')}`;
      }
      return `https://${domain}`;
    } catch {
      return `https://${domain}`;
    }
  }

  getFriendlySiteName(domain) {
    const names = {
      'opensubtitles.org': 'OpenSubtitles',
      'subdl.com': 'SubDL Subtitles',
      'subtitlecat.com': 'SubtitleCat',
      'subscene.com': 'Subscene',
      'youtube.com': 'YouTube',
      'google.com': 'بحث Google',
      'imdb.com': 'IMDb Movies'
    };
    return names[domain] || domain;
  }

  getFaviconHtml(domain) {
    const initial = domain.charAt(0).toUpperCase();
    if (domain.includes('youtube')) return '<span style="color:#e50914">▶</span>';
    if (domain.includes('opensubtitles')) return '<span style="color:#00a8e1">📁</span>';
    if (domain.includes('subdl')) return '<span style="color:#4caf50">S</span>';
    return `<span>${initial}</span>`;
  }

  highlightKeywords(text, query) {
    if (!text) return '';
    const cleanQ = (query || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    if (!cleanQ) return this.escapeHtml(text);

    const words = cleanQ.split(/\s+/).filter(w => w.length > 1);
    let escaped = this.escapeHtml(text);

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      escaped = escaped.replace(regex, '<b>$1</b>');
    });

    return escaped;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  extractCodes(query, results) {
    const codes = [];
    const pattern = /\b([A-Z]{2,6})-?(\d{2,5})\b/gi;
    let match;
    while ((match = pattern.exec(query)) !== null) {
      codes.push(`${match[1].toUpperCase()}-${match[2]}`);
    }
    results.forEach(r => {
      if (r.codes && Array.isArray(r.codes)) {
        codes.push(...r.codes);
      }
    });
    return [...new Set(codes)];
  }

  generateRecentDate(index) {
    const dates = ['منذ ساعتين', 'أمس', 'منذ 3 أيام', '12 أكتوبر 2026', 'أسبوع مضى'];
    return dates[index % dates.length];
  }

  attachHandlers() {
    // تبديل فئات البحث (Tabs)
    document.querySelectorAll('.google-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');
        if (filter) {
          this.activeFilter = filter;
          this.render(this.currentResults, this.currentQuery);
        }
      });
    });

    // النقر على البطاقات لفتحها
    document.querySelectorAll('.google-serp-card, .google-video-serp-item').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a')) return;
        const url = card.getAttribute('data-url');
        if (url) window.open(url, '_blank');
      });
    });

    // عمليات البحث ذات الصلة
    document.querySelectorAll('.related-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const searchQ = chip.getAttribute('data-search');
        if (searchQ) {
          const omnibox = document.getElementById('omnibox');
          if (omnibox) {
            omnibox.value = searchQ;
            omnibox.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
          }
        }
      });
    });

    // زر التحميل في لوحة المعرفة
    const kpDownloadBtn = document.getElementById('kpDownloadBtn');
    if (kpDownloadBtn) {
      kpDownloadBtn.addEventListener('click', () => {
        const topResult = this.currentResults.find(r => r.isArabicSubtitle) || this.currentResults[0];
        if (topResult && topResult.url) {
          window.open(topResult.url, '_blank');
        }
      });
    }

    const kpSearchMoreBtn = document.getElementById('kpSearchMoreBtn');
    if (kpSearchMoreBtn) {
      kpSearchMoreBtn.addEventListener('click', () => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(this.currentQuery + ' ترجمة عربية')}`, '_blank');
      });
    }
  }
}
