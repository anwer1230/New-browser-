import { SmartSubtitleEngine } from '../core/index.js';

/**
 * ربط محرك البحث الذكي بشريط عنوان المتصفح
 */
export class BrowserIntegration {
  constructor(config) {
    this.engine = new SmartSubtitleEngine(config);
    this.config = config;
  }

  /**
   * يتم استدعاؤها عند ضغط Enter في شريط العنوان
   */
  async handleOmniboxInput(query) {
    // 1. تحقق: هل هو URL؟
    if (this.isUrl(query)) {
      return { action: 'navigate', url: this.normalizeUrl(query) };
    }

    // 2. تحقق: هل هو أمر بحث ترجمات؟
    if (this.isSubtitleCommand(query)) {
      const title = query.replace(/^(sub|subs|ترجمة)\s+/i, '');
      return await this.searchSubtitles(title);
    }

    // 3. تحقق: هل هو كود فيلم؟
    if (this.looksLikeCode(query)) {
      // ابحث عن الترجمات + اعرض نتائج ويب
      const [subtitles, webResults] = await Promise.all([
        this.searchSubtitles(query),
        this.webSearch(query)
      ]);
      return { action: 'show', subtitles, webResults };
    }

    // 4. بحث عادي
    return { action: 'navigate', url: this.buildGoogleUrl(query) };
  }

  /**
   * بحث متخصص عن ترجمات
   */
  async searchSubtitles(title) {
    const data = await this.engine.findSubtitles(title, {
      autoTranslate: true
    });
    return { action: 'show_subtitles', data };
  }

  /**
   * بحث ويب عادي (Google مباشرة)
   */
  async webSearch(query) {
    // ✅ لا تفسر الاستعلام! أرسله كما هو
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar&num=20`;
    return { action: 'navigate', url };
  }

  // ==========================================
  // أدوات مساعدة
  // ==========================================
  isUrl(str) {
    if (!str) return false;
    const trimmed = str.trim();
    if (trimmed.includes(' ')) return false;
    
    // لا تعتبر الأكواد URLs
    if (/^[A-Z]{2,6}-?\d{2,5}$/i.test(trimmed)) return false;
    if (/^tt\d+$/i.test(trimmed)) return false;

    return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed);
  }

  normalizeUrl(str) {
    return str.startsWith('http') ? str : `https://${str}`;
  }

  isSubtitleCommand(query) {
    return /^(sub|subs|subtitle|ترجمة)\s+/i.test(query);
  }

  looksLikeCode(query) {
    return /^[A-Z]{2,6}-?\d{2,5}$/i.test(query.trim()) ||
           /^tt\d{7,8}$/i.test(query.trim());
  }

  buildGoogleUrl(query) {
    // ✅ الحفاظ على الرموز
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar&num=20`;
  }
}
