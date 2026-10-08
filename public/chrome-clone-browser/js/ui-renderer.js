/**
 * عرض النتائج بتصميم يشبه جوجل لكن مع إبراز الترجمات
 */
export class UIRenderer {
  constructor() {
    this.container = document.getElementById('resultsContainer');
    this.metaEl = document.getElementById('resultsMeta');
  }

  render(results, query) {
    // إخفاء الصفحة الرئيسية و WebView
    document.getElementById('newTabPage').style.display = 'none';
    document.getElementById('webView').style.display = 'none';
    document.getElementById('subtitleResults').style.display = 'block';

    // عرض المعلومات الوصفية
    const arabicCount = results.filter(r => r.isArabicSubtitle).length;
    if (this.metaEl) {
      this.metaEl.textContent = 
        `تم العثور على ${results.length} نتيجة، منها ${arabicCount} تحتوي على ترجمة عربية`;
    }

    // عرض البطاقات
    if (this.container) {
      this.container.innerHTML = results.map(r => this.renderCard(r)).join('');
      // ربط الأحداث
      this.attachHandlers();
    }
  }

  renderCard(result) {
    const hasArabic = result.isArabicSubtitle;
    const codes = result.codes || [];
    
    return `
      <div class="result-card" data-url="${result.url}">
        <div class="result-thumbnail">
          ${this.getIcon(result.domain)}
          ${hasArabic ? '<span class="subtitle-badge">🇸🇦 عربي</span>' : ''}
        </div>
        <div class="result-info">
          <div class="result-url">${result.domain}</div>
          <div class="result-title">${this.escapeHtml(result.title)}</div>
          <div class="result-snippet">${this.escapeHtml(result.snippet)}</div>
          <div class="result-badges">
            ${hasArabic ? '<span class="badge badge-arabic">✓ ترجمة عربية</span>' : ''}
            ${codes.map(c => 
              `<span class="badge badge-code">${c}</span>`
            ).join('')}
            ${result.isSubtitleSite ? 
              '<span class="badge badge-source">موقع ترجمات</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  getIcon(domain) {
    // أيقونة افتراضية حسب النطاق
    const icons = {
      'youtube.com': '▶️',
      'opensubtitles.org': '📁',
      'subdl.com': '📁',
      'subscene.com': '📁',
      'bestjavporn.com': '🎬',
      'javxxx.me': '🎬',
      'javtrailers.com': '🎬'
    };
    return icons[domain] || '🌐';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  attachHandlers() {
    this.container.querySelectorAll('.result-card').forEach(card => {
      card.addEventListener('click', () => {
        const url = card.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });
  }
}
