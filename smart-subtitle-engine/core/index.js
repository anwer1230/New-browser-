import { SearchAggregator } from './search-aggregator.js';
import { ResultRanker } from './ranker.js';
import { SubtitleTranslator } from './translator.js';
import { analyzeIntent } from './parser.js';

/**
 * محرك البحث الذكي عن الترجمات
 * الواجهة الموحدة التي ستستخدمها في متصفحك
 */
export class SmartSubtitleEngine {
  constructor(config = {}) {
    this.search = new SearchAggregator(config);
    this.ranker = new ResultRanker();
    this.translator = new SubtitleTranslator(config);
    this.config = config;
  }

  /**
   * الطريقة الرئيسية: ابحث عن ترجمات
   */
  async findSubtitles(title, options = {}) {
    const startTime = Date.now();
    
    // 1. تحليل النية
    const intent = analyzeIntent(title);
    console.log('🎯 Intent:', intent);

    // 2. البحث
    const rawResults = await this.search.search(title, options);
    console.log(`📊 Found ${rawResults.length} raw results`);

    // 3. الترتيب
    const ranked = this.ranker.rank(rawResults, intent);
    console.log(`🏆 Ranked ${ranked.length} results`);

    // 4. التجميع
    const grouped = this.ranker.group(ranked);

    // 5. إذا لم توجد نتائج عربية، جرب الترجمة الآلية
    let autoTranslated = null;
    if (grouped.arabicSubtitles.length === 0 && options.autoTranslate !== false) {
      autoTranslated = await this.tryAutoTranslate(grouped, options);
    }

    return {
      intent,
      results: ranked,
      grouped,
      autoTranslated,
      elapsed: Date.now() - startTime,
      total: ranked.length
    };
  }

  /**
   * محاولة الترجمة الآلية عند غياب الترجمة العربية
   */
  async tryAutoTranslate(grouped, options) {
    // ابحث عن أي ترجمة إنجليزية أو صينية
    const candidate = 
      grouped.subtitleSites[0] || 
      grouped.generalWeb.find(r => /subtitle|srt|sub/i.test(r.title || ''));

    if (!candidate || !candidate.url) return null;

    try {
      // حمّل SRT
      const srtContent = await this.fetchSubtitle(candidate.url);
      if (!srtContent) return null;

      // ترجم
      const translated = await this.translator.translateSRT(srtContent, 'ar');
      
      return {
        source: candidate,
        srt: translated,
        note: 'تمت الترجمة آلياً - قد تحتوي على أخطاء'
      };
    } catch (error) {
      console.error('Auto-translate failed:', error);
      return null;
    }
  }

  async fetchSubtitle(url) {
    // تحقق إذا كان ملف SRT مباشر
    if (url.endsWith('.srt')) {
      const response = await fetch(url);
      return await response.text();
    }
    return null;
  }
}
