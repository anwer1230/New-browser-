/**
 * Subtitle Intelligence Services & Parsing Engine
 * مخصص لاستخراج الأكواد بدقة، تنظيف العناوين، وتحليل ملفات SRT
 */

export interface ParsedCodeItem {
  type: 'code' | 'imdb' | 'title';
  value: string;
  priority: number;
}

export interface SubtitleItem {
  id: string;
  title: string;
  language: string;
  languageName: string;
  downloads: number;
  rating?: number;
  source: 'OpenSubtitles' | 'SubDL' | 'LocalAI' | 'Cache';
  matchedBy: 'code' | 'imdb' | 'title';
  matchedValue: string;
  fileId?: string;
  url?: string;
  downloadUrl?: string;
  isMachineTranslated?: boolean;
}

export interface SubtitleCue {
  id?: number | string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

/**
 * 1. استخراج الأكواد المفيدة من عنوان الفيديو
 * مثل: BNSPS-427, JUY-111, SSIS-001, IPX-292, FC2-PPV-1234567, tt1234567
 */
export function extractVideoCodes(title: string): string[] {
  if (!title) return [];
  const codes: string[] = [];

  // أنماط الأكواد القياسية مثل BNSPS-427, JUY-111, SSIS-001, MIDV-024, IPX-292
  const codePattern = /\b([A-Za-z]{2,7})[-_ ]?(\d{2,6})\b/g;
  let match: RegExpExecArray | null;
  while ((match = codePattern.exec(title)) !== null) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    // تجاهل الكلمات الشائعة التي تصادف أرقاماً عشوائية
    if (!['MP4', 'MKV', 'AVI', 'WEB', 'RIP', 'AAC', 'X264', 'H264', 'H265', 'HEVC', '1080P', '720P', '480P', 'HDR', 'DTS'].includes(prefix)) {
      codes.push(`${prefix}-${num}`);
    }
  }

  // نمط FC2 PPV
  const fc2Pattern = /\bFC2[-_ ]?PPV[-_ ]?(\d{5,8})\b/gi;
  while ((match = fc2Pattern.exec(title)) !== null) {
    codes.push(`FC2-${match[1]}`);
  }

  // نمط IMDb ID: tt1234567 أو tt12345678
  const imdbPattern = /\b(tt\d{6,9})\b/gi;
  while ((match = imdbPattern.exec(title)) !== null) {
    codes.push(match[1].toLowerCase());
  }

  return Array.from(new Set(codes));
}

/**
 * 2. تنظيف العنوان من الكلمات الشائعة والعشوائية والرموز
 */
export function cleanVideoTitle(rawTitle: string): string {
  if (!rawTitle) return '';

  const stopWords = [
    'complete', 'uncut', 'version', 'omnibus', 'first time',
    'hd', '1080p', '720p', '480p', '2160p', '4k', 'uhd',
    'x264', 'x265', 'h264', 'h265', 'hevc', 'web-dl', 'webrip',
    'bluray', 'brrip', 'hdrip', 'dvdrip', 'aac', 'ac3', 'dts',
    'full movie', 'official video', 'official audio', 'remastered',
    'trailer', 'subtitles', 'subbed', 'arabic sub', 'eng sub',
    'translated', 'مترجم', 'كامل', 'نسخة أصلية', 'حصريا'
  ];

  let cleaned = rawTitle.toLowerCase();

  // إزالة المعرفات العشوائية بين أقواس مربعة مثل [LAag92qoswC]
  cleaned = cleaned.replace(/\[[a-zA-Z0-9_\-]{8,20}\]/g, ' ');
  cleaned = cleaned.replace(/\([a-zA-Z0-9_\-]{8,20}\)/g, ' ');

  // حذف أسماء الدومينات ومواقع الويب مثل eporner.com, youtube.com
  cleaned = cleaned.replace(/[a-zA-Z0-9-]+\.(com|net|org|io|cc|to|tv|co|me|xyz)\b/gi, ' ');

  stopWords.forEach((word) => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  });

  // استبدال الرموز الخاصة بمسافات
  cleaned = cleaned.replace(/[\[\]\(\)\{\}\|\\\/_#@!$%^&*+=":;?~<>]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * 3. بناء قائمة استعلامات البحث مرتبة حسب الأولوية الصارمة: الأكواد أولاً ثم العنوان
 */
export function buildSearchQueries(rawTitle: string): ParsedCodeItem[] {
  const queries: ParsedCodeItem[] = [];
  const codes = extractVideoCodes(rawTitle);

  // الأكواد ذات الأولوية القصوى (Priority 1)
  codes.forEach((code) => {
    queries.push({
      type: code.startsWith('tt') ? 'imdb' : 'code',
      value: code,
      priority: 1,
    });
  });

  // العنوان المنظف (Priority 2)
  const cleaned = cleanVideoTitle(rawTitle);
  if (cleaned.length >= 3) {
    queries.push({
      type: 'title',
      value: cleaned,
      priority: 2,
    });
  }

  return queries.sort((a, b) => a.priority - b.priority);
}

/**
 * 4. محلل ملفات SRT ومحول التوقيت
 */
export function parseSRT(srtContent: string): SubtitleCue[] {
  if (!srtContent || typeof srtContent !== 'string') return [];

  // توحيد نهايات الأسطر
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = normalized.split(/\n\n+/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIndex = i;
        break;
      }
    }

    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.join('\n').replace(/<[^>]*>/g, '').trim();

    const parts = timeLine.split('-->');
    if (parts.length !== 2) continue;

    const start = parseSrtTimestamp(parts[0].trim());
    const end = parseSrtTimestamp(parts[1].trim());

    if (!isNaN(start) && !isNaN(end) && end >= start) {
      cues.push({
        id: cues.length + 1,
        start,
        end,
        text,
      });
    }
  }

  return cues;
}

/**
 * تحويل 00:01:23,456 إلى ثوانٍ
 */
export function parseSrtTimestamp(timeStr: string): number {
  if (!timeStr) return 0;
  // أخذ فقط الجزء الزمني الصالح
  const match = timeStr.match(/(\d{1,2}):(\d{2}):(\d{2})(?:[,\.](\d{1,3}))?/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[2], 10) || 0;
  const seconds = parseInt(match[3], 10) || 0;
  const millis = match[4] ? parseInt(match[4].padEnd(3, '0').slice(0, 3), 10) : 0;

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * تحويل ثوانٍ إلى صيغة SRT: 00:01:23,456
 */
export function formatSrtTimestamp(secondsTotal: number): string {
  const safeSec = Math.max(0, secondsTotal);
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = Math.floor(safeSec % 60);
  const millis = Math.floor((safeSec % 1) * 1000);

  const pad = (n: number, w: number = 2) => String(n).padStart(w, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/**
 * تحويل مصفوفة SubtitleCue إلى ملف SRT نصي
 */
export function cuesToSRT(cues: SubtitleCue[]): string {
  return cues
    .map((cue, idx) => {
      const startStr = formatSrtTimestamp(cue.start);
      const endStr = formatSrtTimestamp(cue.end);
      return `${idx + 1}\n${startStr} --> ${endStr}\n${cue.text}\n`;
    })
    .join('\n');
}
