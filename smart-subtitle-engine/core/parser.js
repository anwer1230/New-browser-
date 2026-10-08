/**
 * محرك تحليل العناوين واستخراج الأكواد
 * يدعم: JAV codes, IMDb, TMDB, موقع محددة
 */

// ==========================================
// 1. أنماط الأكواد المدعومة
// ==========================================
const CODE_PATTERNS = [
  // أكواد JAV اليابانية: BNSPS-427, JUY-111, SSIS-001
  { name: 'jav', regex: /\b([A-Z]{2,6})-?(\d{2,5})\b/g, priority: 1 },
  
  // أكواد IMDb: tt1234567
  { name: 'imdb', regex: /\b(tt\d{7,8})\b/gi, priority: 2 },
  
  // أكواد TMDB: movie/12345
  { name: 'tmdb', regex: /(?:movie|tv)\/(\d{2,8})/gi, priority: 3 },
  
  // أكواد سنة: (2024), [2023]
  { name: 'year', regex: /[\(\[](\d{4})[\)\]]/g, priority: 4 },
];

// كلمات يجب تجاهلها من العنوان
const STOP_WORDS = new Set([
  'complete', 'uncut', 'version', 'omnibus', 'first', 'time',
  'hd', '1080p', '720p', '480p', '4k', 'x264', 'x265',
  'web', 'webdl', 'web-dl', 'bluray', 'brrip', 'hdrip',
  'dvdrip', 'hdtv', 'aac', 'ac3', 'dts', 'hevc', 'avc',
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'by', 'from', 'and', 'or', 'but', 'is', 'are'
]);

// معرفات المواقع التي يجب تجاهلها
const SITE_ID_PATTERNS = [
  /EPORNER\.COM/gi,
  /\[LA[a-z0-9]{8,}\]/gi,        // [LAag92qoswC]
  /\[[A-Za-z0-9]{10,}\]/g,       // أي معرف طويل بين أقواس
  /\.(com|net|org|tv|me|xxx)/gi  // امتدادات النطاقات
];

// ==========================================
// 2. استخراج الأكواد
// ==========================================
export function extractCodes(title) {
  if (!title || typeof title !== 'string') return [];
  
  const codes = [];
  const seen = new Set();
  
  for (const pattern of CODE_PATTERNS) {
    // إعادة تعيين lastIndex لأن regex فيه g
    pattern.regex.lastIndex = 0;
    
    let match;
    while ((match = pattern.regex.exec(title)) !== null) {
      let code;
      
      if (pattern.name === 'jav') {
        code = `${match[1].toUpperCase()}-${match[2]}`;
      } else if (pattern.name === 'year') {
        // تجاهل السنوات غير المنطقية
        const year = parseInt(match[1]);
        if (year < 1950 || year > 2030) continue;
        code = match[1];
      } else {
        code = match[1].toLowerCase();
      }
      
      if (!seen.has(code)) {
        seen.add(code);
        codes.push({
          value: code,
          type: pattern.name,
          priority: pattern.priority,
          raw: match[0]
        });
      }
    }
  }
  
  // ترتيب حسب الأولوية
  return codes.sort((a, b) => a.priority - b.priority);
}

// ==========================================
// 3. تنظيف العنوان
// ==========================================
export function cleanTitle(title) {
  let cleaned = title;
  
  // إزالة معرفات المواقع
  SITE_ID_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });
  
  // إزالة الرموز والأقواس
  cleaned = cleaned.replace(/[\[\]\(\)\{\}\|\/\\_]/g, ' ');
  
  // إزالة الكلمات الشائعة
  const words = cleaned.split(/\s+/).filter(word => {
    const lower = word.toLowerCase().trim();
    return lower.length > 1 && !STOP_WORDS.has(lower);
  });
  
  // إزالة التكرار مع الحفاظ على الترتيب
  const unique = [];
  const seenLower = new Set();
  for (const word of words) {
    const lower = word.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      unique.push(word);
    }
  }
  
  return unique.join(' ').trim();
}

// ==========================================
// 4. بناء استعلامات البحث (مرتبة حسب الأولوية)
// ==========================================
export function buildSearchQueries(title, options = {}) {
  const codes = extractCodes(title);
  const cleaned = cleanTitle(title);
  const queries = [];
  
  // استعلامات الأكواد (الأعلى أولوية)
  for (const code of codes) {
    // 1. الكود + ترجمة عربية
    queries.push({
      query: `"${code.value}" ترجمة عربية`,
      type: 'code_ar',
      code: code.value,
      codeType: code.type,
      priority: 1
    });
    
    // 2. الكود + arabic subtitle
    queries.push({
      query: `"${code.value}" arabic subtitle`,
      type: 'code_en',
      code: code.value,
      codeType: code.type,
      priority: 2
    });
    
    // 3. الكود + arabic srt
    queries.push({
      query: `"${code.value}" arabic srt`,
      type: 'code_srt',
      code: code.value,
      codeType: code.type,
      priority: 3
    });
    
    // 4. الكود + بحث في مواقع الترجمات
    const subtitleSites = [
      'opensubtitles.org',
      'subdl.com',
      'subtitlecat.com',
      'avsubtitles.com',
      'javsubtitle.com',
      'subscene.com',
      'assrt.net',
      'subhd.tv'
    ];
    
    for (const site of subtitleSites) {
      queries.push({
        query: `site:${site} "${code.value}"`,
        type: 'site_search',
        code: code.value,
        site: site,
        priority: 5
      });
    }
    
    // 5. البحث بالصينية (للكودات اليابانية)
    if (code.type === 'jav') {
      queries.push({
        query: `"${code.value}" 中文字幕`,
        type: 'code_zh',
        code: code.value,
        priority: 6
      });
    }
  }
  
  // استعلام بالعنوان المنظف
  if (cleaned.length > 3) {
    queries.push({
      query: `"${cleaned}" arabic subtitle`,
      type: 'title',
      priority: 10
    });
  }
  
  // إزالة التكرار
  const seen = new Set();
  return queries.filter(q => {
    if (seen.has(q.query)) return false;
    seen.add(q.query);
    return true;
  }).sort((a, b) => a.priority - b.priority);
}

// ==========================================
// 5. استخراج "نية البحث"
// ==========================================
export function analyzeIntent(title) {
  const codes = extractCodes(title);
  const hasJavCode = codes.some(c => c.type === 'jav');
  const hasImdb = codes.some(c => c.type === 'imdb');
  
  return {
    codes,
    hasCode: codes.length > 0,
    isJav: hasJavCode,
    isMovie: hasImdb,
    primaryCode: codes[0]?.value || null,
    cleanedTitle: cleanTitle(title)
  };
}
