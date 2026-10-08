/**
 * محرك البحث الذكي
 * - يتصل بجوجل مباشرة (مثل كروم)
 * - لكن يضيف فلترة للترجمات العربية
 */
export class SearchEngine {
  constructor() {
    this.baseUrl = 'https://www.google.com/search';
    this.defaultParams = {
      hl: 'ar',      // لغة الواجهة
      num: '20',     // عدد النتائج
      safe: 'off'    // البحث الآمن (يمكن تفعيله)
    };
  }

  /**
   * يبني رابط بحث عادي (مثل كروم بالضبط)
   */
  buildNormalUrl(query) {
    const params = new URLSearchParams({
      q: query,
      ...this.defaultParams
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * يبني رابط بحث مع فلترة الترجمات العربية
   * هذا هو الفرق عن كروم العادي
   */
  buildSubtitleUrl(query) {
    // استخرج الأكواد من الاستعلام
    const codes = this.extractCodes(query);
    
    // إذا وُجد كود، استخدمه للبحث الدقيق
    if (codes.length > 0) {
      const code = codes[0];
      // بحث مركب: الكود + كلمات عربية
      const enhancedQuery = `"${code}" (ترجمة OR subtitle OR srt) arabic`;
      const params = new URLSearchParams({
        q: enhancedQuery,
        ...this.defaultParams
      });
      return `${this.baseUrl}?${params.toString()}`;
    }
    
    // بحث عام عن الترجمات
    const enhancedQuery = `${query} ترجمة عربية subtitle`;
    const params = new URLSearchParams({
      q: enhancedQuery,
      ...this.defaultParams
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * يبني رابط بحث في مواقع الترجمات مباشرة
   */
  buildSubtitleSitesUrl(code) {
    // بحث في 8 مواقع ترجمات دفعة واحدة
    const sites = [
      'opensubtitles.org',
      'subdl.com',
      'subtitlecat.com',
      'avsubtitles.com',
      'javsubtitle.com',
      'subscene.com',
      'assrt.net',
      'subhd.tv'
    ];
    
    const siteQuery = sites.map(s => `site:${s}`).join(' OR ');
    const enhancedQuery = `"${code}" (${siteQuery})`;
    
    const params = new URLSearchParams({
      q: enhancedQuery,
      ...this.defaultParams
    });
    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * يستخرج الأكواد من النص
   */
  extractCodes(text) {
    const codes = [];
    
    // JAV codes: BNSPS-427, JUY-111
    const javPattern = /\b([A-Z]{2,6})-?(\d{2,5})\b/g;
    let match;
    while ((match = javPattern.exec(text)) !== null) {
      codes.push(`${match[1]}-${match[2]}`);
    }
    
    // IMDb: tt1234567
    const imdbPattern = /\b(tt\d{7,8})\b/gi;
    while ((match = imdbPattern.exec(text)) !== null) {
      codes.push(match[1].toLowerCase());
    }
    
    return [...new Set(codes)];
  }

  /**
   * يبحث (يفتح الرابط في WebView)
   */
  async search(query, mode = 'normal') {
    let url;
    
    if (mode === 'subtitle') {
      url = this.buildSubtitleUrl(query);
    } else {
      url = this.buildNormalUrl(query);
    }
    
    return { action: 'navigate', url };
  }
}
