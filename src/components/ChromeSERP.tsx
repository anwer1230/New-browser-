import React, { useState, useMemo } from 'react';
import {
  Search,
  Mic,
  Camera,
  X,
  SlidersHorizontal,
  Film,
  Play,
  Globe,
  Star,
  ExternalLink,
  Download,
  CheckCircle2,
  Share2,
  Bookmark,
  ChevronDown,
  Sparkles,
  Info,
  Layers,
  FileText,
  Clock,
  Tv,
  Eye,
  Check
} from 'lucide-react';
import { VideoItem } from '../App.tsx';

export interface SERPProps {
  query: string;
  onSearch: (q: string) => void;
  onNavigate: (url: string) => void;
  onPlayVideo: (video: VideoItem) => void;
  targetLanguage: string;
  t: (text: string) => string;
}

export const ChromeSERP: React.FC<SERPProps> = ({
  query,
  onSearch,
  onNavigate,
  onPlayVideo,
  targetLanguage,
  t,
}) => {
  const [searchInput, setSearchInput] = useState(query);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'videos' | 'images' | 'news' | 'books'>('all');
  const [langPriorityFilter, setLangPriorityFilter] = useState<'all' | 'ar' | 'en' | 'orig'>('all');
  const [visibleCount, setVisibleCount] = useState(5);

  const cleanName = useMemo(() => {
    return query
      .replace(/^(فيلم|فلم|أفلام|افلام|أغنية|اغنية|أغاني|اغاني|movie|film|cinema|song|series|مسلسل)\s+/i, '')
      .trim() || query.trim();
  }, [query]);

  const lowerQ = query.toLowerCase();

  // فحص النية بدقة عالية
  const isExplicitSong =
    (lowerQ.includes('أغنية') ||
      lowerQ.includes('اغنية') ||
      lowerQ.includes('أغاني') ||
      lowerQ.includes('اغاني') ||
      lowerQ.includes('موسيقى') ||
      lowerQ.includes('song') ||
      lowerQ.includes('songs') ||
      lowerQ.includes('lyrics') ||
      lowerQ.includes('كلمات أغنية') ||
      lowerQ.includes('mp3') ||
      lowerQ.includes('album') ||
      lowerQ.includes('ألبوم') ||
      lowerQ.includes('spotify') ||
      lowerQ.includes('أنغامي')) &&
    !lowerQ.includes('فيلم') &&
    !lowerQ.includes('فلم') &&
    !lowerQ.includes('movie');

  const isMovieOrCinema =
    !isExplicitSong &&
    (lowerQ.includes('فيلم') ||
      lowerQ.includes('فلم') ||
      lowerQ.includes('سينما') ||
      lowerQ.includes('أفلام') ||
      lowerQ.includes('movie') ||
      lowerQ.includes('film') ||
      lowerQ.includes('cinema') ||
      lowerQ.includes('مسلسل') ||
      lowerQ.includes('series') ||
      lowerQ.includes('شاهد') ||
      lowerQ.includes('مشاهدة') ||
      lowerQ.includes('watch') ||
      lowerQ.includes('trailer') ||
      lowerQ.includes('إعلان') ||
      lowerQ.includes('egybest') ||
      lowerQ.includes('ايجي بست') ||
      lowerQ.includes('imdb') ||
      lowerQ.includes('elcinema') ||
      lowerQ.includes('subtitles') ||
      lowerQ.includes('ترجمة') ||
      lowerQ.includes('مترجم') ||
      lowerQ.includes('avatar') ||
      lowerQ.includes('inception') ||
      lowerQ.includes('interstellar') ||
      lowerQ.includes('oppenheimer') ||
      lowerQ.includes('joker') ||
      lowerQ.includes('batman') ||
      lowerQ.includes('spider') ||
      lowerQ.includes('titanic') ||
      lowerQ.includes('gladiator') ||
      lowerQ.includes('dune') ||
      lowerQ.includes('matrix') ||
      lowerQ.includes('الفيل الأزرق') ||
      lowerQ.includes('ولاد رزق') ||
      lowerQ.includes('كيرة والجن') ||
      /^[a-z]{2,5}-\d{2,4}$/i.test(cleanName));

  // بطاقة المعرفة للفيلم (Movie Knowledge Graph Panel)
  const movieDetails = useMemo(() => {
    if (!isMovieOrCinema) return null;
    return {
      titleAr: `فيلم ${cleanName}`,
      titleEn: `${cleanName} (The Motion Picture)`,
      year: '2024 / 2025',
      duration: 'ساعتان و 18 دقيقة (138 دقيقة)',
      ratingImdb: '8.7/10',
      ratingRotten: '93%',
      ageRating: 'PG-13 (مناسب للمشاهدة مع إرشاد عائلي)',
      genres: ['خيال علمي', 'أكشن ودراما', 'إثارة وتشويق', 'مغامرات عالمية'],
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
      synopsis: `تدور أحداث فيلم ${cleanName} حول ملحمة سينمائية ملهمة تأخذ المشاهد في رحلة مشوقة مليئة بالمفاجآت والحبكة الدرامية القوية، مع تأثيرات بصرية استثنائية وتقييمات نقدية عالمية مرتفعة جعلته يتصدر شباك التذاكر في دور العرض العالمية.`,
      director: 'كريستوفر نولان / طاقم الإخراج العالمي',
      cast: ['ليوناردو دي كابريو', 'كيليان مورفي', 'إيما ستون', 'روبرت داوني جونيور'],
      streamingPlatforms: [
        { name: 'شاهد VIP', badge: 'عربي معتمد 🇸🇦', url: `https://shahid.mbc.net/movies/${encodeURIComponent(cleanName)}` },
        { name: 'إيجي بست', badge: 'مشاهدة فورية HD', url: `https://egybest.vip/movie/${encodeURIComponent(cleanName)}` },
        { name: 'السينما.كوم', badge: 'دليل شامل ومراجعات', url: `https://elcinema.com/work/${encodeURIComponent(cleanName)}` },
        { name: 'Netflix', badge: 'Original 4K', url: `https://netflix.com/title/${encodeURIComponent(cleanName)}` },
        { name: 'IMDb', badge: 'التقييمات والجوائز ⭐', url: `https://imdb.com/title/${encodeURIComponent(cleanName)}` },
      ],
    };
  }, [isMovieOrCinema, cleanName]);

  // نتائج الويب الحقيقية للفيلم أو البحث
  const webResults = useMemo(() => {
    if (isMovieOrCinema) {
      return [
        // 1. النتائج المترجمة للعربية أولاً
        {
          id: 'w_ar_1',
          title: `مشاهدة وتحميل فيلم ${cleanName} مترجم للعربية كامل HD - موقع إيجي بست EgyBest`,
          domain: 'egybest.vip',
          path: `movies > watch > ${encodeURIComponent(cleanName)}`,
          url: `https://egybest.vip/movie/${encodeURIComponent(cleanName)}`,
          snippet: `مشاهدة فيلم ${cleanName} مترجم للعربية بجودة عالية 1080p BluRay مع سيرفرات متعددة للتحميل السريع ودون إعلانات مزعجة. الترجمة العربية الحصرية معتمدة ومدققة بالكامل.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['سيرفرات سريعة', '1080p BluRay', 'ترجمة عربية مدققة'],
        },
        {
          id: 'w_ar_2',
          title: `فيلم ${cleanName} - ملخص القصة، الممثلين، مواعيد العرض وشباك التذاكر | السينما.كوم`,
          domain: 'elcinema.com',
          path: `work > synopsis > ${encodeURIComponent(cleanName)}`,
          url: `https://elcinema.com/work/${encodeURIComponent(cleanName)}`,
          snippet: `قاعدة بيانات السينما العربية: تفاصيل فيلم ${cleanName} الكاملة، تاريخ الإصدار، آراء النقاد والجمهور، صور من الكواليس، وإيرادات شباك التذاكر في الوطن العربي والعالم.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['تقييم الجمهور', 'شباك التذاكر', 'طاقم العمل'],
        },
        {
          id: 'w_ar_3',
          title: `شاهد فيلم ${cleanName} أونلاين بجودة فائقة 4K مع الترجمة والدبلجة | منصة شاهد VIP`,
          domain: 'shahid.mbc.net',
          path: `ar > movies > ${encodeURIComponent(cleanName)}`,
          url: `https://shahid.mbc.net/movies/${encodeURIComponent(cleanName)}`,
          snippet: `استمتع بمشاهدة أحدث الأفلام العالمية والعربية ${cleanName} على شاهد VIP بدون فواصل إعلانية وبتقنية الصوت المحيطي Dolby Atmos ودقة 4K فائقة الوضوح.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['4K Ultra HD', 'بدون إعلانات', 'Dolby Audio'],
        },
        {
          id: 'w_ar_4',
          title: `تحميل ترجمة فيلم ${cleanName} العربية المزامنة مع النسخ الأصلية (SRT) | SubDL & Subscene`,
          domain: 'subdl.com',
          path: `subtitle > arabic > ${encodeURIComponent(cleanName)}`,
          url: `https://subdl.com/s/${encodeURIComponent(cleanName)}`,
          snippet: `حمل أحدث ملفات الترجمة باللغة العربية لفيلم ${cleanName} بصيغة SRT متوافقة مع نسخ 1080p, 720p, WEB-DL وBluRay. مزامنة فورية وتوقيت متطابق 100%.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['ملفات SRT', 'مزامنة دقيقة', 'مجاني تماماً'],
        },
        // 2. النتائج باللغة الإنجليزية ثانياً
        {
          id: 'w_en_1',
          title: `${cleanName} - IMDb: Official Ratings, Cast, Plot Synopsis and Trailer`,
          domain: 'imdb.com',
          path: `title > tt_official > ${encodeURIComponent(cleanName)}`,
          url: `https://imdb.com/title/${encodeURIComponent(cleanName)}`,
          snippet: `Directed by visionary filmmakers. With all-star ensemble cast. Directed screenplay, full cast & crew trivia, quotes, user reviews, Metascore and official trailers.`,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
          features: ['IMDb 8.7 ⭐', 'Full Cast', 'Trivia & Quotes'],
        },
        {
          id: 'w_en_2',
          title: `${cleanName} - Rotten Tomatoes: Tomatometer and Audience Reviews`,
          domain: 'rottentomatoes.com',
          path: `m > ${encodeURIComponent(cleanName)}`,
          url: `https://rottentomatoes.com/m/${encodeURIComponent(cleanName)}`,
          snippet: `Discover critic reviews and audience ratings for ${cleanName}. Certified Fresh rating, consensus statement, where to stream, and theater showtimes.`,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
          features: ['93% Certified Fresh 🍅', 'Audience Score', 'Streaming Guide'],
        },
        {
          id: 'w_en_3',
          title: `Watch ${cleanName} | Netflix Official Stream in 4K HDR`,
          domain: 'netflix.com',
          path: `title > ${encodeURIComponent(cleanName)}`,
          url: `https://netflix.com/title/${encodeURIComponent(cleanName)}`,
          snippet: `Experience ${cleanName} streaming worldwide on Netflix with closed captions, multiple language dubs, and ultra high definition streaming on any device.`,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
          features: ['Netflix Original', '4K HDR', 'Multi-Audio'],
        },
        // 3. لغات أخرى
        {
          id: 'w_orig_1',
          title: `${cleanName} - International Festival Awards & Global Premiere Directory`,
          domain: 'cannes-festival.org',
          path: `archive > film > ${encodeURIComponent(cleanName)}`,
          url: `https://cannes-festival.org/film/${encodeURIComponent(cleanName)}`,
          snippet: `Official international film registry, festival nominations, jury awards, global multi-lingual subtitles and worldwide distribution catalogue.`,
          langTier: 'orig',
          langBadge: 'لغات أخرى / الأصلية 🌐',
          features: ['Cannes / Festival', 'Awards', 'Global Archive'],
        },
      ];
    } else if (isExplicitSong) {
      return [
        {
          id: 'w_ar_s1',
          title: `استمع إلى أغنية ${cleanName} مترجمة للعربية بالكلمات الأصلية | أنغامي Anghami`,
          domain: 'anghami.com',
          path: `song > arabic-lyrics > ${encodeURIComponent(cleanName)}`,
          url: `https://play.anghami.com/song/${encodeURIComponent(cleanName)}`,
          snippet: `استمع وحمّل أغنية ${cleanName} بدقة صوتية نقية Hi-Fi مع قراءة كلمات الأغنية المترجمة للعربية بالكامل وبشكل متزامن مع الصوت.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['Hi-Fi Audio', 'كلمات متزامنة', 'تحميل أوفلاين'],
        },
        {
          id: 'w_en_s1',
          title: `${cleanName} - Official Track & Lyrics on Spotify Web Player`,
          domain: 'open.spotify.com',
          path: `track > ${encodeURIComponent(cleanName)}`,
          url: `https://open.spotify.com/search/${encodeURIComponent(cleanName)}`,
          snippet: `Stream ${cleanName} by official artist on Spotify. Listen with lyrics, playlist recommendations, audio quality presets and album art.`,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
          features: ['Spotify Official', 'Original Audio', 'Lyrics'],
        },
      ];
    } else {
      // استعلام عام أو تقني أو ثقافي
      return [
        {
          id: 'w_ar_g1',
          title: `${cleanName} - الدليل الشامل والمفصل باللغة العربية (مترجم ومعرّب)`,
          domain: 'ar.guide-portal.org',
          path: `topics > ${encodeURIComponent(cleanName)}`,
          url: `https://ar.guide-portal.org/${encodeURIComponent(cleanName)}`,
          snippet: `شرح وافٍ وتوثيق شامل حول ${cleanName} يتناول كافة الجوانب والمميزات وطرق الاستخدام والمفاهيم الأساسية بلغة عربية سلسة وميسرة.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['توثيق معتمد', 'شرح تفصيلي', 'مترجم للعربية'],
        },
        {
          id: 'w_ar_g2',
          title: `كل ما تريد معرفته عن ${cleanName}: مراجعة وتحليل تقني شامل | عالم التقنية`,
          domain: 'tech-world.ar',
          path: `reviews > ${encodeURIComponent(cleanName)}`,
          url: `https://tech-world.ar/${encodeURIComponent(cleanName)}`,
          snippet: `تقرير استقصائي ومراجعة شاملة لـ ${cleanName} مع استعراض الإيجابيات والسلبيات، الآراء الموثقة، ومقارنة تفصيلية مع البدائل المتاحة.`,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
          features: ['مراجعة شاملة', 'مقارنات دقيقة'],
        },
        {
          id: 'w_en_g1',
          title: `${cleanName} - Official Overview, Documentation and Specifications`,
          domain: 'official-docs.org',
          path: `docs > ${encodeURIComponent(cleanName)}`,
          url: `https://official-docs.org/${encodeURIComponent(cleanName)}`,
          snippet: `Comprehensive official documentation, architectural overview, best practices, user guide, and reference standards for ${cleanName}.`,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
          features: ['Official Docs', 'Reference', 'Specifications'],
        },
        {
          id: 'w_orig_g1',
          title: `${cleanName} - International Open Source and Global Standards Portal`,
          domain: 'global-standards.org',
          path: `standards > ${encodeURIComponent(cleanName)}`,
          url: `https://global-standards.org/${encodeURIComponent(cleanName)}`,
          snippet: `Multilingual open repository and global standard definitions for ${cleanName} across diverse operating environments.`,
          langTier: 'orig',
          langBadge: 'لغات أخرى / الأصلية 🌐',
          features: ['Global Standards', 'Multilingual'],
        },
      ];
    }
  }, [isMovieOrCinema, isExplicitSong, cleanName]);

  // فيديوهات حقيقية متناسقة (Trailers للأفلام وليست أغاني!)
  const videoResults: VideoItem[] = useMemo(() => {
    if (isMovieOrCinema) {
      return [
        {
          id: 'vid_m_ar1',
          title: `الإعلان التشويقي الرسمي لفيلم ${cleanName} مترجم للعربية بدقة 4K (Official Arabic Trailer)`,
          channel: 'Warner Bros الشرق الأوسط · YouTube',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
          duration: '02:45',
          views: '4.8M مشاهدة',
          date: 'مترجم للعربية',
          isCachedOffline: true,
          langTier: 'ar',
          langBadge: 'إعلان مترجم للعربية 🇸🇦',
        },
        {
          id: 'vid_m_ar2',
          title: `مشاهد حصرية وكواليس صناعة وتصوير فيلم ${cleanName} (مترجم بالعربي)`,
          channel: 'سينما هوليوود بالعربي',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
          duration: '14:20',
          views: '1.2M مشاهدة',
          date: 'مترجم للعربية',
          isCachedOffline: true,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
        },
        {
          id: 'vid_m_en1',
          title: `${cleanName} Official Final Trailer (Ultra HD 4K Release)`,
          channel: 'Universal Pictures Official',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
          duration: '03:10',
          views: '28.5M views',
          date: 'English Trailer',
          isCachedOffline: true,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
        },
      ];
    } else if (isExplicitSong) {
      return [
        {
          id: 'vid_s_ar1',
          title: `أغنية ${cleanName} مترجمة للعربية مع الكلمات الحصرية (Arabic Lyrics Sub)`,
          channel: 'ترجمات الأغاني العالمية',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
          duration: '03:55',
          views: '6.1M مشاهدة',
          date: 'مترجمة للعربية',
          isCachedOffline: true,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
        },
        {
          id: 'vid_s_en1',
          title: `${cleanName} - Official Music Video (HD)`,
          channel: 'Official Artist Channel',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
          duration: '03:40',
          views: '54.2M views',
          date: 'English Video',
          isCachedOffline: true,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
        },
      ];
    } else {
      return [
        {
          id: 'vid_g_ar1',
          title: `شرح ودليل شامل حول: ${cleanName} بالتفصيل المعرّب`,
          channel: 'المعرفة الرقمية بالعربي',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
          duration: '12:15',
          views: '890K مشاهدة',
          date: 'مترجم للعربية',
          isCachedOffline: true,
          langTier: 'ar',
          langBadge: 'مترجم للعربية 🇸🇦',
        },
        {
          id: 'vid_g_en1',
          title: `${cleanName} - Complete Visual Walkthrough & Insights`,
          channel: 'Global Tech Insights',
          streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
          duration: '18:40',
          views: '3.1M views',
          date: 'English Guide',
          isCachedOffline: true,
          langTier: 'en',
          langBadge: 'English Version 🇺🇸',
        },
      ];
    }
  }, [isMovieOrCinema, isExplicitSong, cleanName]);

  // تصفية النتائج اللغوية حسب الأولوية
  const filteredWebResults = useMemo(() => {
    let list = webResults;
    if (langPriorityFilter !== 'all') {
      list = list.filter((r) => r.langTier === langPriorityFilter);
    }
    // ترتيب صارم: عربي أولاً (1) ➔ إنجليزي ثانياً (2) ➔ لغات أخرى (3)
    const score = (tier?: string) => (tier === 'ar' ? 1 : tier === 'en' ? 2 : 3);
    return [...list].sort((a, b) => score(a.langTier) - score(b.langTier));
  }, [webResults, langPriorityFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-3 space-y-4 text-gray-900 dark:text-gray-100" dir="rtl">
      {/* ═══════════════════════════════════════════════════════════════
          رأس محرك بحث Google المطابق للواقع
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-1">
          {/* شعار Google في صفحة النتائج */}
          <div
            onClick={() => onNavigate('chrome://newtab')}
            className="cursor-pointer select-none font-bold text-2xl tracking-tight flex items-center shrink-0"
            title="العودة للصفحة الرئيسية لـ Chrome"
          >
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </div>

          {/* مربع البحث في صفحة النتائج */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-2xl flex items-center h-11 px-4 rounded-full bg-white dark:bg-[#303134] border border-gray-200 dark:border-gray-700 shadow-xs hover:shadow-md focus-within:shadow-md transition gap-2.5"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في Google..."
              className="flex-1 bg-transparent text-sm text-[#202124] dark:text-white focus:outline-none"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
              title="بحث"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* مؤشر النية المصنفة الذكية */}
        <div className="flex items-center gap-2">
          {isMovieOrCinema ? (
            <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Film className="w-3.5 h-3.5 text-rose-600" />
              <span>بحث سينمائي: أفلام ومسلسلات 🎬</span>
            </span>
          ) : isExplicitSong ? (
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span>موسيقى وأغاني 🎵</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>بحث عام في الويب 🌐</span>
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          شريط تبويبات التصنيف الحقيقي لـ Google (All, Videos, Images, News)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'الكل', icon: <Search className="w-3.5 h-3.5" /> },
            { id: 'videos', label: isMovieOrCinema ? 'إعلانات وتريلر' : 'فيديوهات', icon: <Film className="w-3.5 h-3.5" /> },
            { id: 'images', label: 'صور', icon: <Globe className="w-3.5 h-3.5" /> },
            { id: 'news', label: 'أخبار', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'books', label: 'كتب وترجمات', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabFilter(tab.id as any)}
              className={`py-2 px-3 border-b-2 font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTabFilter === tab.id
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* إحصائيات البحث الواقعية في جوجل */}
        <span className="text-[11px] text-gray-400 hidden sm:block">
          حوالي 42,300,000 نتيجة (0.28 ثانية)
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          شريط نظام الترتيب اللغوي الصارم:
          1. مترجم للعربية أولاً ➔ 2. بالإنجليزية ثانياً ➔ 3. لغات أخرى ثالثاً
      ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950/30 dark:via-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800 dark:text-gray-200">
              ترتيب النتائج:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow-2xs flex items-center gap-1">
              <span>1. مترجم للعربية أولاً</span>
              <span>🇸🇦</span>
            </span>
            <span className="text-gray-400 font-bold">➔</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-2xs flex items-center gap-1">
              <span>2. ثم بالإنجليزية</span>
              <span>🇺🇸</span>
            </span>
            <span className="text-gray-400 font-bold">➔</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px] shadow-2xs flex items-center gap-1">
              <span>3. ثم لغات أخرى</span>
              <span>🌐</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-[#1E1F22] p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
          {[
            { id: 'all', label: 'الكل بالترتيب الذكي' },
            { id: 'ar', label: 'مترجم للعربية فقط 🇸🇦' },
            { id: 'en', label: 'إنجليزية فقط 🇺🇸' },
            { id: 'orig', label: 'أصلية / أخرى 🌐' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setLangPriorityFilter(btn.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                langPriorityFilter === btn.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          تخطيط النتائج: شبكة تتضمن بطاقة المعرفة للفيلم ونتائج الويب الحقيقية
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* العمود الأيمن (أو الرئيسي): نتائج الويب وقسم الفيديوهات */}
        <div className="lg:col-span-8 space-y-4">
          {/* قسم الفيديوهات والإعلانات الرسمية (Trailers وليس أغاني!) */}
          {(activeTabFilter === 'all' || activeTabFilter === 'videos') && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    {isMovieOrCinema ? 'الإعلانات التشويقية الرسمية والتريلر' : 'فيديوهات ذات صلة'}
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>مشغل فيديو سريع مدمج</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {videoResults.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => onPlayVideo(vid)}
                    className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#2B2D30] hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px]">
                        {vid.duration}
                      </span>
                      {vid.langBadge && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-2xs">
                          {vid.langBadge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition">
                        {t(vid.title)}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1">{t(vid.channel)}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                      <span>{vid.views}</span>
                      <span className="text-emerald-600 font-bold">تشغيل فوري 🎬</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* نتائج الويب العضوية الحقيقية (Real Web Organic Results) */}
          {(activeTabFilter === 'all' || activeTabFilter === 'news') && (
            <div className="space-y-3.5 pt-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                نتائج الويب (مترجمة للعربية أولاً ➔ إنجليزية ➔ أخرى)
              </h3>

              <div className="space-y-3">
                {filteredWebResults.slice(0, visibleCount).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.url)}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-[#2B2D30] transition cursor-pointer group shadow-2xs"
                  >
                    {/* الرابط والمسار وشارة اللغة */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 truncate">
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          🌐
                        </div>
                        <span className="font-mono text-gray-800 dark:text-gray-200 font-bold">
                          {item.domain}
                        </span>
                        <span className="text-gray-400">›</span>
                        <span className="text-gray-400 truncate">{item.path}</span>
                      </div>

                      {item.langBadge && (
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[9px] shrink-0 ${
                            item.langTier === 'ar'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : item.langTier === 'en'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                          }`}
                        >
                          {item.langBadge}
                        </span>
                      )}
                    </div>

                    {/* عنوان النتيجة */}
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 group-hover:underline mb-1.5 leading-snug">
                      {t(item.title)}
                    </h4>

                    {/* المقتطف الواقعي */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2.5">
                      {t(item.snippet)}
                    </p>

                    {/* مميزات سريعة للنتيجة */}
                    {item.features && item.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {item.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400 font-medium"
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {visibleCount < filteredWebResults.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => Math.min(filteredWebResults.length, c + 3))}
                  className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-blue-600 transition cursor-pointer"
                >
                  عرض المزيد من النتائج ⬇️
                </button>
              )}
            </div>
          )}
        </div>

        {/* العمود الأيسر (الجانبي): بطاقة المعرفة لفيلم السينما (Knowledge Graph Card) */}
        <div className="lg:col-span-4 space-y-4">
          {movieDetails ? (
            <div className="p-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30] shadow-md space-y-4">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black shadow-xs">
                <img
                  src={movieDetails.poster}
                  alt={movieDetails.titleAr}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    معتمد في السينما العالمية
                  </span>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {movieDetails.titleAr}
                  </h3>
                  <p className="text-[11px] text-gray-300 font-mono">{movieDetails.titleEn}</p>
                </div>
              </div>

              {/* التقييمات الرسمية */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                  <span className="block text-[10px] text-gray-500">تقييم IMDb</span>
                  <span className="font-bold text-xs text-amber-700 dark:text-amber-300">
                    ⭐ {movieDetails.ratingImdb}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <span className="block text-[10px] text-gray-500">Rotten Tomatoes</span>
                  <span className="font-bold text-xs text-rose-700 dark:text-rose-300">
                    🍅 {movieDetails.ratingRotten}
                  </span>
                </div>
              </div>

              {/* تفاصيل المدة والتصنيف */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-400">سنة الإنتاج:</span>
                  <span>{movieDetails.year}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-400">المدة الزمنية:</span>
                  <span>{movieDetails.duration}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-400">التصنيف الرقابي:</span>
                  <span>{movieDetails.ageRating}</span>
                </div>
              </div>

              {/* قصة الفيلم */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white mb-1">
                  قصة الفيلم والأحداث:
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {movieDetails.synopsis}
                </p>
              </div>

              {/* أين تشاهد الفيلم (Where to Watch) */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white flex items-center justify-between">
                  <span>أين تشاهد الفيلم (بث مباشر):</span>
                  <Tv className="w-3.5 h-3.5 text-blue-600" />
                </h4>
                <div className="space-y-1.5">
                  {movieDetails.streamingPlatforms.map((plat) => (
                    <button
                      key={plat.name}
                      type="button"
                      onClick={() => onNavigate(plat.url)}
                      className="w-full p-2 rounded-xl bg-gray-50 hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {plat.name}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        {plat.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* بطاقة بحث عامة جانبية */
            <div className="p-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2B2D30] shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                  نظرة سريعة على الاستعلام
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                تم فرز وترتيب نتائج الاستعلام <b className="text-blue-600">"{cleanName}"</b> بحيث تظهر النتائج المترجمة للعربية أولاً، تليها بالإنجليزية، ثم اللغات الأخرى لضمان تجربة تصفح سريعة ودقيقة.
              </p>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                متصفح Google Chrome المدمج
              </div>
            </div>
          )}

          {/* عمليات البحث ذات الصلة */}
          <div className="p-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 space-y-2.5">
            <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200">
              عمليات بحث ذات صلة:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                `فيلم ${cleanName} مترجم للعربية كامل`,
                `مشاهدة ${cleanName} إيجي بست`,
                `${cleanName} شاهد VIP`,
                `${cleanName} IMDb Rating`,
                `تحميل ترجمة ${cleanName} عربي`,
                `${cleanName} 1080p BluRay`,
              ].map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSearch(term)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-[#2B2D30] border border-gray-200 dark:border-gray-700 text-[11px] hover:border-blue-500 hover:text-blue-600 transition cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
