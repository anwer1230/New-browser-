/**
 * محرك الترجمة الآلية
 * يدعم: Google Translate, DeepL, LibreTranslate
 */
export class SubtitleTranslator {
  constructor(config = {}) {
    this.provider = config.provider || 'google';
    this.apiKey = config.apiKey || null;
    this.backendProxy = config.backendProxy || null;
    this.cache = new Map();
  }

  // ==========================================
  // 1. ترجمة ملف SRT كامل
  // ==========================================
  async translateSRT(srtContent, targetLang = 'ar') {
    const cacheKey = this.hash(srtContent) + targetLang;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const blocks = this.parseSRT(srtContent);
    console.log(`📝 Translating ${blocks.length} blocks...`);

    // ترجمة على دفعات (لتقليل الطلبات)
    const batchSize = 50;
    const translated = [];

    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      const texts = batch.map(b => b.text);
      
      const translatedTexts = await this.translateBatch(texts, targetLang);
      
      batch.forEach((block, idx) => {
        translated.push({
          ...block,
          text: translatedTexts[idx] || block.text,
          original: block.text
        });
      });

      // تأخير بسيط لتجنب rate limiting
      if (i + batchSize < blocks.length) {
        await this.sleep(200);
      }
    }

    const result = this.buildSRT(translated);
    this.cache.set(cacheKey, result);
    return result;
  }

  // ==========================================
  // 2. ترجمة دفعة نصوص
  // ==========================================
  async translateBatch(texts, targetLang) {
    switch (this.provider) {
      case 'google':
        return await this.googleTranslate(texts, targetLang);
      case 'deepl':
        return await this.deeplTranslate(texts, targetLang);
      case 'libre':
        return await this.libreTranslate(texts, targetLang);
      case 'proxy':
        return await this.proxyTranslate(texts, targetLang);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  // ==========================================
  // 3. Google Translate API
  // ==========================================
  async googleTranslate(texts, targetLang) {
    if (!this.apiKey) throw new Error('Google API key required');

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texts,
          target: targetLang,
          format: 'text',
          source: 'auto'
        })
      }
    );

    if (!response.ok) throw new Error(`Google Translate: ${response.status}`);
    const data = await response.json();
    return data.data.translations.map(t => this.decodeHTML(t.translatedText));
  }

  // ==========================================
  // 4. DeepL API
  // ==========================================
  async deeplTranslate(texts, targetLang) {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texts,
        target_lang: targetLang.toUpperCase()
      })
    });

    const data = await response.json();
    return data.translations.map(t => t.text);
  }

  // ==========================================
  // 5. LibreTranslate (مجاني، مفتوح المصدر)
  // ==========================================
  async libreTranslate(texts, targetLang) {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: 'auto',
        target: targetLang,
        format: 'text'
      })
    });

    const data = await response.json();
    return Array.isArray(data.translatedText) 
      ? data.translatedText 
      : [data.translatedText];
  }

  // ==========================================
  // 6. عبر Backend Proxy
  // ==========================================
  async proxyTranslate(texts, targetLang) {
    const response = await fetch(`${this.backendProxy}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang })
    });
    const data = await response.json();
    return data.translations;
  }

  // ==========================================
  // 7. أدوات SRT
  // ==========================================
  parseSRT(srt) {
    const blocks = srt.trim().split(/\n\n+/);
    return blocks.map(block => {
      const lines = block.split('\n');
      if (lines.length < 3) return null;
      
      const index = lines[0];
      const timeLine = lines[1];
      const text = lines.slice(2).join(' ');
      
      const match = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
      );
      
      if (!match) return null;
      
      return {
        index,
        start: this.toSeconds(match[1], match[2], match[3], match[4]),
        end: this.toSeconds(match[5], match[6], match[7], match[8]),
        timeLine,
        text
      };
    }).filter(Boolean);
  }

  buildSRT(blocks) {
    return blocks.map(b => {
      const start = this.toTimeString(b.start);
      const end = this.toTimeString(b.end);
      return `${b.index}\n${start} --> ${end}\n${b.text}`;
    }).join('\n\n');
  }

  toSeconds(h, m, s, ms) {
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
  }

  toTimeString(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
  }

  decodeHTML(text) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h.toString(36);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
