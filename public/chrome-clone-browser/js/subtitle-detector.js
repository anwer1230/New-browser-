/**
 * كاشف الترجمات العربية
 * يحلل HTML نتائج جوجل ويستخرج النتائج ذات الترجمات
 */
export class SubtitleDetector {
  constructor() {
    // كلمات تدل على وجود ترجمة عربية
    this.arabicKeywords = [
      'ترجمة', 'مترجم', 'عربي', 'العربية', 'arabic',
      'subtitle', 'subtitles', 'srt', 'sub'
    ];
    
    // مواقع ترجمات موثوقة
    this.subtitleSites = [
      'opensubtitles.org',
      'subdl.com',
      'subtitlecat.com',
      'avsubtitles.com',
      'javsubtitle.com',
      'subscene.com',
      'assrt.net',
      'subhd.tv'
    ];
  }

  /**
   * يحلل صفحة نتائج جوجل ويستخرج النتائج
   */
  parseGoogleResults(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results = [];
    
    // جوجل يستخدم div.g لكل نتيجة
    doc.querySelectorAll('div.g').forEach(el => {
      const titleEl = el.querySelector('h3');
      const linkEl = el.querySelector('a');
      const snippetEl = el.querySelector('.VwiC3b, .IsZvec');
      
      if (!titleEl || !linkEl) return;
      
      const title = titleEl.textContent;
      const url = linkEl.href;
      const snippet = snippetEl ? snippetEl.textContent : '';
      
      // تحليل النتيجة
      const analysis = this.analyzeResult({ title, url, snippet });
      
      results.push({
        title,
        url,
        snippet,
        ...analysis
      });
    });
    
    return results;
  }

  /**
   * يحلل نتيجة ويحدد إذا كانت تحتوي على ترجمة عربية
   */
  analyzeResult({ title, url, snippet }) {
    const text = `${title} ${snippet}`.toLowerCase();
    
    // 1. هل العنوان يحتوي على كلمات عربية؟
    const hasArabic = /[\u0600-\u06FF]/.test(title + snippet);
    
    // 2. هل يحتوي على كلمة "ترجمة" أو "subtitle"؟
    const hasSubtitleKeyword = this.arabicKeywords.some(kw => 
      text.includes(kw.toLowerCase())
    );
    
    // 3. هل الموقع من مواقع الترجمات المعروفة؟
    const domain = this.extractDomain(url);
    const isSubtitleSite = this.subtitleSites.some(site => 
      domain.includes(site)
    );
    
    // 4. هل يحتوي على كود؟
    const codes = this.extractCodes(title + ' ' + snippet);
    
    // حساب النقاط
    let score = 0;
    if (hasArabic) score += 50;
    if (hasSubtitleKeyword) score += 30;
    if (isSubtitleSite) score += 40;
    if (codes.length > 0) score += 20;
    
    return {
      hasArabic,
      hasSubtitleKeyword,
      isSubtitleSite,
      codes,
      domain,
      score,
      isArabicSubtitle: hasArabic && (hasSubtitleKeyword || isSubtitleSite)
    };
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  extractCodes(text) {
    const codes = [];
    const pattern = /\b([A-Z]{2,6})-?(\d{2,5})\b/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.push(`${match[1]}-${match[2]}`);
    }
    return [...new Set(codes)];
  }

  /**
   * يرتب النتائج: العربي أولاً
   */
  rank(results) {
    return results.sort((a, b) => {
      // 1. العربي أولاً
      if (a.isArabicSubtitle && !b.isArabicSubtitle) return -1;
      if (b.isArabicSubtitle && !a.isArabicSubtitle) return 1;
      
      // 2. ثم حسب النقاط
      return b.score - a.score;
    });
  }

  /**
   * يفلتر النتائج العربية فقط
   */
  filterArabic(results) {
    return results.filter(r => r.isArabicSubtitle);
  }
}
