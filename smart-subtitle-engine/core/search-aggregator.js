import { buildSearchQueries, analyzeIntent } from './parser.js';

/**
 * وكيل البحث (Search Aggregator)
 * يبحث في: Google, OpenSubtitles, SubDL, SubtitleCat, وبحث ويب عام
 */
export class SearchAggregator {
  constructor(config = {}) {
    this.config = {
      googleApiKey: config.googleApiKey || null,
      googleCx: config.googleCx || null,
      subdlApiKey: config.subdlApiKey || null,
      backendProxy: config.backendProxy || null, // لتفادي CORS
      timeout: config.timeout || 10000,
      maxConcurrent: config.maxConcurrent || 5,
      ...config
    };
  }

  // ==========================================
  // 1. البحث الرئيسي
  // ==========================================
  async search(title, options = {}) {
    const intent = analyzeIntent(title);
    const queries = buildSearchQueries(title, options);
    
    console.log('🎯 Intent:', intent);
    console.log('🔍 Queries:', queries.length);

    // تشغيل البحث بالتوازي (مع حد أقصى)
    const results = await this.parallelSearch(queries, options);
    
    // دمج النتائج وإزالة التكرار
    return this.mergeResults(results);
  }

  // ==========================================
  // 2. بحث متوازي مع حد أقصى
  // ==========================================
  async parallelSearch(queries, options) {
    const results = [];
    const queue = [...queries];
    const workers = [];

    for (let i = 0; i < this.config.maxConcurrent; i++) {
      workers.push(this.worker(queue, results, options));
    }

    await Promise.all(workers);
    return results;
  }

  async worker(queue, results, options) {
    while (queue.length > 0) {
      const query = queue.shift();
      if (!query) break;

      try {
        const result = await this.executeQuery(query, options);
        if (result && result.length > 0) {
          results.push(...result);
        }
      } catch (error) {
        console.warn(`⚠️ Query failed: ${query.query}`, error.message);
      }
    }
  }

  // ==========================================
  // 3. تنفيذ استعلام واحد
  // ==========================================
  async executeQuery(query, options) {
    switch (query.type) {
      case 'code_ar':
      case 'code_en':
      case 'code_srt':
      case 'code_zh':
      case 'site_search':
      case 'title':
        return await this.webSearch(query, options);
      
      default:
        return [];
    }
  }

  // ==========================================
  // 4. بحث ويب (Google Custom Search أو scraping عبر proxy)
  // ==========================================
  async webSearch(query, options) {
    // الطريقة 1: Google Custom Search API (موصى به)
    if (this.config.googleApiKey && this.config.googleCx) {
      return await this.googleApiSearch(query);
    }

    // الطريقة 2: عبر backend proxy (لمنع CORS)
    if (this.config.backendProxy) {
      return await this.proxySearch(query);
    }

    // الطريقة 3: فتح الرابط مباشرة (fallback)
    return [{
      type: 'link',
      query: query.query,
      url: `https://www.google.com/search?q=${encodeURIComponent(query.query)}`,
      source: 'Google',
      title: query.query,
      priority: query.priority,
      code: query.code || null
    }];
  }

  // ==========================================
  // 5. Google Custom Search API
  // ==========================================
  async googleApiSearch(query) {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', this.config.googleApiKey);
    url.searchParams.set('cx', this.config.googleCx);
    url.searchParams.set('q', query.query);
    url.searchParams.set('num', '10');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Google API: ${response.status}`);
    const data = await response.json();

    return (data.items || []).map(item => ({
      type: 'web',
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      source: 'Google',
      query: query.query,
      priority: query.priority,
      code: query.code || null,
      isArabic: /[\u0600-\u06FF]/.test(item.title + ' ' + item.snippet)
    }));
  }

  // ==========================================
  // 6. بحث عبر Backend Proxy
  // ==========================================
  async proxySearch(query) {
    const url = `${this.config.backendProxy}/api/search?q=${encodeURIComponent(query.query)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.config.timeout)
    });
    if (!response.ok) throw new Error(`Proxy: ${response.status}`);
    return await response.json();
  }

  // ==========================================
  // 7. دمج النتائج وإزالة التكرار
  // ==========================================
  mergeResults(resultsArrays) {
    const flat = resultsArrays.flat();
    const seen = new Set();
    const merged = [];

    for (const result of flat) {
      const key = result.url || result.title || JSON.stringify(result);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(result);
    }

    return merged;
  }
}
