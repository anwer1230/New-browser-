/**
 * محرك ترتيب النتائج
 * يعطي أولوية لـ:
 * 1. النتائج العربية
 * 2. مطابقة الكود بالضبط
 * 3. مواقع الترجمات المعروفة
 * 4. عدد التحميلات/التقييمات
 */
export class ResultRanker {
  constructor() {
    // مواقع الترجمات الموثوقة (وزن أعلى)
    this.trustedSites = {
      'opensubtitles.org': 100,
      'subdl.com': 95,
      'subscene.com': 90,
      'subtitlecat.com': 85,
      'avsubtitles.com': 80,
      'javsubtitle.com': 80,
      'assrt.net': 75,
      'subhd.tv': 70
    };
  }

  rank(results, intent) {
    const scored = results.map(r => ({
      ...r,
      score: this.calculateScore(r, intent)
    }));

    return scored.sort((a, b) => b.score - a.score);
  }

  calculateScore(result, intent) {
    let score = 0;

    // 1. عربي (أعلى وزن)
    if (result.isArabic || /[\u0600-\u06FF]/.test(result.title || '')) {
      score += 1000;
    }

    // 2. مطابقة الكود بالضبط
    if (intent.primaryCode && result.code === intent.primaryCode) {
      score += 500;
    }

    // 3. نوع الكود (JAV أعلى)
    if (result.codeType === 'jav') score += 200;
    if (result.codeType === 'imdb') score += 150;

    // 4. موقع موثوق
    if (result.displayLink) {
      for (const [site, weight] of Object.entries(this.trustedSites)) {
        if (result.displayLink.includes(site)) {
          score += weight;
          break;
        }
      }
    }

    // 5. عدد التحميلات
    if (result.downloads) {
      score += Math.min(result.downloads / 1000, 50);
    }

    // 6. التقييم
    if (result.rating) {
      score += result.rating * 10;
    }

    // 7. أولوية الاستعلام
    if (result.priority) {
      score += (10 - result.priority) * 5;
    }

    // 8. حداثة
    if (result.year) {
      score += Math.max(0, (result.year - 2000) / 2);
    }

    return score;
  }

  /**
   * تجميع النتائج في فئات (للعرض)
   */
  group(results) {
    const groups = {
      arabicSubtitles: [],
      subtitleSites: [],
      videoPlayers: [],
      generalWeb: []
    };

    for (const r of results) {
      if (r.isArabic || /[\u0600-\u06FF]/.test(r.title || '')) {
        groups.arabicSubtitles.push(r);
      } else if (r.displayLink && this.isSubtitleSite(r.displayLink)) {
        groups.subtitleSites.push(r);
      } else if (/youtube|vimeo|dailymotion|player|watch|stream/i.test(r.url || '')) {
        groups.videoPlayers.push(r);
      } else {
        groups.generalWeb.push(r);
      }
    }

    return groups;
  }

  isSubtitleSite(domain) {
    return Object.keys(this.trustedSites).some(site => domain.includes(site));
  }
}
