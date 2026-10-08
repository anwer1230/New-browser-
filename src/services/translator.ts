/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
];

/**
 * قاموس حقيقي فوري أونلاين (Online Mock Dictionary)
 * يشتمل على مفردات ومصطلحات التصفح ومحرك البحث SERP والموسيقى والفيديوهات
 */
type TranslationDictionary = Record<string, Record<string, string>>;

export const DICTIONARY_ENTRIES: TranslationDictionary = {
  // --- مصطلحات المتصفح وشريط البحث ---
  'بحث Google': {
    en: 'Google Search',
    es: 'Búsqueda de Google',
    fr: 'Recherche Google',
    de: 'Google-Suche',
    tr: 'Google Arama',
    zh: '谷歌搜索',
    ar: 'بحث Google',
  },
  'بحث': {
    en: 'Search',
    es: 'Buscar',
    fr: 'Rechercher',
    de: 'Suchen',
    tr: 'Ara',
    zh: '搜索',
    ar: 'بحث',
  },
  'الكل': {
    en: 'All',
    es: 'Todo',
    fr: 'Tous',
    de: 'Alle',
    tr: 'Tümü',
    zh: '全部',
    ar: 'الكل',
  },
  'فيديوهات': {
    en: 'Videos',
    es: 'Vídeos',
    fr: 'Vidéos',
    de: 'Videos',
    tr: 'Videolar',
    zh: '视频',
    ar: 'فيديوهات',
  },
  'تطبيقات': {
    en: 'Apps',
    es: 'Aplicaciones',
    fr: 'Applications',
    de: 'Apps',
    tr: 'Uygulamalar',
    zh: '应用',
    ar: 'تطبيقات',
  },
  'كتب وأبحاث': {
    en: 'Books & Research',
    es: 'Libros e investigación',
    fr: 'Livres et recherche',
    de: 'Bücher & Forschung',
    tr: 'Kitaplar ve Araştırma',
    zh: '图书与研究',
    ar: 'كتب وأبحاث',
  },
  'موسيقى': {
    en: 'Music',
    es: 'Música',
    fr: 'Musique',
    de: 'Musik',
    tr: 'Müzik',
    zh: '音乐',
    ar: 'موسيقى',
  },
  'ويب عام': {
    en: 'Web',
    es: 'Web',
    fr: 'Web',
    de: 'Web',
    tr: 'Web',
    zh: '网页',
    ar: 'ويب عام',
  },
  'صور': {
    en: 'Images',
    es: 'Imágenes',
    fr: 'Images',
    de: 'Bilder',
    tr: 'Görseller',
    zh: '图片',
    ar: 'صور',
  },
  'أخبار': {
    en: 'News',
    es: 'Noticias',
    fr: 'Actualités',
    de: 'Nachrichten',
    tr: 'Haberler',
    zh: '新闻',
    ar: 'أخبار',
  },
  'أدوات': {
    en: 'Tools',
    es: 'Herramientas',
    fr: 'Outils',
    de: 'Tools',
    tr: 'Araçlar',
    zh: '工具',
    ar: 'أدوات',
  },
  'إعدادات': {
    en: 'Settings',
    es: 'Configuración',
    fr: 'Paramètres',
    de: 'Einstellungen',
    tr: 'Ayarlar',
    zh: '设置',
    ar: 'إعدادات',
  },
  'السجل': {
    en: 'History',
    es: 'Historial',
    fr: 'Historique',
    de: 'Verlauf',
    tr: 'Geçmiş',
    zh: '历史记录',
    ar: 'السجل',
  },
  'الإشارات': {
    en: 'Bookmarks',
    es: 'Marcadores',
    fr: 'Favoris',
    de: 'Lesezeichen',
    tr: 'Yer İmleri',
    zh: '书签',
    ar: 'الإشارات',
  },
  'تنزيل': {
    en: 'Download',
    es: 'Descargar',
    fr: 'Télécharger',
    de: 'Herunterladen',
    tr: 'İndir',
    zh: '下载',
    ar: 'تنزيل',
  },
  'تثبيت': {
    en: 'Install',
    es: 'Instalar',
    fr: 'Installer',
    de: 'Installieren',
    tr: 'Yükle',
    zh: '安装',
    ar: 'تثبيت',
  },
  'مشاهدة': {
    en: 'Watch',
    es: 'Ver',
    fr: 'Regarder',
    de: 'Ansehen',
    tr: 'İzle',
    zh: '观看',
    ar: 'مشاهدة',
  },
  'تشغيل': {
    en: 'Play',
    es: 'Reproducir',
    fr: 'Lire',
    de: 'Abspielen',
    tr: 'Oynat',
    zh: '播放',
    ar: 'تشغيل',
  },
  'إيقاف مؤقت': {
    en: 'Pause',
    es: 'Pausa',
    fr: 'Pause',
    de: 'Pause',
    tr: 'Duraklat',
    zh: '暂停',
    ar: 'إيقاف مؤقت',
  },
  'السرعة': {
    en: 'Speed',
    es: 'Velocidad',
    fr: 'Vitesse',
    de: 'Geschwindigkeit',
    tr: 'Hız',
    zh: '速度',
    ar: 'السرعة',
  },
  'قاعدة البيانات': {
    en: 'Database',
    es: 'Base de datos',
    fr: 'Base de données',
    de: 'Datenbank',
    tr: 'Veritabanı',
    zh: '数据库',
    ar: 'قاعدة البيانات',
  },
  'معتمدة': {
    en: 'Approved',
    es: 'Aprobado',
    fr: 'Approuvé',
    de: 'Genehmigt',
    tr: 'Onaylandı',
    zh: '已认证',
    ar: 'معتمدة',
  },
  'متصل': {
    en: 'Connected',
    es: 'Conectado',
    fr: 'Connecté',
    de: 'Verbunden',
    tr: 'Bağlı',
    zh: '已连接',
    ar: 'متصل',
  },
  'فيديوهات أوفلاين': {
    en: 'Offline Videos',
    es: 'Vídeos sin conexión',
    fr: 'Vidéos hors ligne',
    de: 'Offline-Videos',
    tr: 'Çevrimdışı Videolar',
    zh: '离线视频',
    ar: 'فيديوهات أوفلاين',
  },
  'محفوظ في السجل للمشاهدة بدون إنترنت': {
    en: 'Saved to history for offline watching',
    es: 'Guardado en el historial para ver sin conexión',
    fr: 'Enregistré dans l’historique pour visionnage hors ligne',
    de: 'Im Verlauf gespeichert für Offline-Wiedergabe',
    tr: 'Çevrimdışı izleme için geçmişe kaydedildi',
    zh: '已保存至历史记录以供离线观看',
    ar: 'محفوظ في السجل للمشاهدة بدون إنترنت',
  },
  'ترجمة الصفحة': {
    en: 'Translate Page',
    es: 'Traducir página',
    fr: 'Traduire la page',
    de: 'Seite übersetzen',
    tr: 'Sayfayı Çevir',
    zh: '翻译网页',
    ar: 'ترجمة الصفحة',
  },
  'عرض النص الأصلي': {
    en: 'Show Original',
    es: 'Mostrar original',
    fr: 'Afficher l’original',
    de: 'Original anzeigen',
    tr: 'Orijinali Göster',
    zh: '显示原文',
    ar: 'عرض النص الأصلي',
  },
  'الترجمة الفورية نشطة': {
    en: 'Live Translation Active',
    es: 'Traducción en vivo activa',
    fr: 'Traduction en direct active',
    de: 'Live-Übersetzung aktiv',
    tr: 'Canlı Çeviri Aktif',
    zh: '实时翻译激活',
    ar: 'الترجمة الفورية نشطة',
  },
  'قاموس فوري متصل': {
    en: 'Online Mock Dictionary Connected',
    es: 'Diccionario en línea conectado',
    fr: 'Dictionnaire en ligne connecté',
    de: 'Online-Wörterbuch verbunden',
    tr: 'Çevrimiçi Sözlük Bağlı',
    zh: '在线词典已连接',
    ar: 'قاموس فوري متصل',
  },
  'جاري الترجمة...': {
    en: 'Translating...',
    es: 'Traduciendo...',
    fr: 'Traduction en cours...',
    de: 'Wird übersetzt...',
    tr: 'Çevriliyor...',
    zh: '正在翻译...',
    ar: 'جاري الترجمة...',
  },
  'تمت ترجمة الصفحة بنجاح': {
    en: 'Page translated successfully',
    es: 'Página traducida con éxito',
    fr: 'Page traduite avec succès',
    de: 'Seite erfolgreich übersetzt',
    tr: 'Sayfa başarıyla çevrildi',
    zh: '网页翻译成功',
    ar: 'تمت ترجمة الصفحة بنجاح',
  },
  'تمت استعادة النص الأصلي': {
    en: 'Original text restored',
    es: 'Texto original restaurado',
    fr: 'Texte original restauré',
    de: 'Originaltext wiederhergestellt',
    tr: 'Orijinal metin geri yüklendi',
    zh: '已恢复原文',
    ar: 'تمت استعادة النص الأصلي',
  },
  'علامة تبويب جديدة': {
    en: 'New Tab',
    es: 'Nueva pestaña',
    fr: 'Nouvel onglet',
    de: 'Neuer Tab',
    tr: 'Yeni Sekme',
    zh: '新建标签页',
    ar: 'علامة تبويب جديدة',
  },
  'إغلاق': {
    en: 'Close',
    es: 'Cerrar',
    fr: 'Fermer',
    de: 'Schließen',
    tr: 'Kapat',
    zh: '关闭',
    ar: 'إغلاق',
  },
  'النتائج المباشرة': {
    en: 'Live Results',
    es: 'Resultados en directo',
    fr: 'Résultats en direct',
    de: 'Live-Ergebnisse',
    tr: 'Canlı Sonuçlar',
    zh: '实时结果',
    ar: 'النتائج المباشرة',
  },
  'عدد المشاهدات': {
    en: 'Views',
    es: 'Vistas',
    fr: 'Vues',
    de: 'Aufrufe',
    tr: 'Görüntüleme',
    zh: '次观看',
    ar: 'عدد المشاهدات',
  },
  'مشاهدات': {
    en: 'Views',
    es: 'Vistas',
    fr: 'Vues',
    de: 'Aufrufe',
    tr: 'Görüntüleme',
    zh: '次观看',
    ar: 'مشاهدات',
  },
  'قبل 3 أيام': {
    en: '3 days ago',
    es: 'Hace 3 días',
    fr: 'Il y a 3 jours',
    de: 'Vor 3 Tagen',
    tr: '3 gün önce',
    zh: '3天前',
    ar: 'قبل 3 أيام',
  },
  'قبل 5 أيام': {
    en: '5 days ago',
    es: 'Hace 5 días',
    fr: 'Il y a 5 jours',
    de: 'Vor 5 Tagen',
    tr: '5 gün önce',
    zh: '5天前',
    ar: 'قبل 5 أيام',
  },
  'منذ أسبوعين': {
    en: '2 weeks ago',
    es: 'Hace 2 semanas',
    fr: 'Il y a 2 semaines',
    de: 'Vor 2 Wochen',
    tr: '2 hafta önce',
    zh: '2周前',
    ar: 'منذ أسبوعين',
  },
  'أمس': {
    en: 'Yesterday',
    es: 'Ayer',
    fr: 'Hier',
    de: 'Gestern',
    tr: 'Dün',
    zh: '昨天',
    ar: 'أمس',
  },
  'اليوم': {
    en: 'Today',
    es: 'Hoy',
    fr: 'Aujourd’hui',
    de: 'Heute',
    tr: 'Bugün',
    zh: '今天',
    ar: 'اليوم',
  },
  'دليل شامل وشرح تفصيلي حول': {
    en: 'Comprehensive guide and in-depth explanation on',
    es: 'Guía completa y explicación detallada sobre',
    fr: 'Guide complet et explication détaillée sur',
    de: 'Umfassender Leitfaden und ausführliche Erklärung zu',
    tr: 'Kapsamlı rehber ve detaylı açıklama:',
    zh: '全面指南与深入解析：',
    ar: 'دليل شامل وشرح تفصيلي حول',
  },
  'أروع المقاطع الصوتية والحماسية ذات الصلة بـ': {
    en: 'The finest music tracks and highlights related to',
    es: 'Las mejores pistas musicales y destacados relacionados con',
    fr: 'Les meilleurs morceaux musicaux et extraits liés à',
    de: 'Die besten Musiktitel und Highlights zu',
    tr: 'En harika müzik parçaları ve öne çıkanlar:',
    zh: '最精彩的音乐曲目和精选：',
    ar: 'أروع المقاطع الصوتية والحماسية ذات الصلة بـ',
  },
  'البث الحي المباشر للأعمال المميزة': {
    en: 'Live streaming of featured masterpieces',
    es: 'Transmisión en directo de obras destacadas',
    fr: 'Diffusion en direct d’œuvres exceptionnelles',
    de: 'Live-Streaming ausgewählter Meisterwerke',
    tr: 'Öne çıkan eserlerin canlı yayını',
    zh: '精选杰作的在线实时流媒体',
    ar: 'البث الحي المباشر للأعمال المميزة',
  },
  'حفظ': {
    en: 'Save',
    es: 'Guardar',
    fr: 'Enregistrer',
    de: 'Speichern',
    tr: 'Kaydet',
    zh: '保存',
    ar: 'حفظ',
  },
  'مشاركة': {
    en: 'Share',
    es: 'Compartir',
    fr: 'Partager',
    de: 'Teilen',
    tr: 'Paylaş',
    zh: '分享',
    ar: 'مشاركة',
  },
  'نسخ الرابط': {
    en: 'Copy Link',
    es: 'Copiar enlace',
    fr: 'Copier le lien',
    de: 'Link kopieren',
    tr: 'Bağlantıyı Kopyala',
    zh: '复制链接',
    ar: 'نسخ الرابط',
  },
  'مدير مهام المتصفح': {
    en: 'Browser Task Manager',
    es: 'Administrador de tareas del navegador',
    fr: 'Gestionnaire de tâches du navigateur',
    de: 'Browser-Task-Manager',
    tr: 'Tarayıcı Görev Yöneticisi',
    zh: '浏览器任务管理器',
    ar: 'مدير مهام المتصفح',
  },
  'خيارات المتصفح': {
    en: 'Browser Options',
    es: 'Opciones del navegador',
    fr: 'Options du navigateur',
    de: 'Browser-Optionen',
    tr: 'Tarayıcı Seçenekleri',
    zh: '浏览器选项',
    ar: 'خيارات المتصفح',
  },
  'إعادة تحميل': {
    en: 'Reload',
    es: 'Recargar',
    fr: 'Recharger',
    de: 'Neu laden',
    tr: 'Yeniden Yükle',
    zh: '重新加载',
    ar: 'إعادة تحميل',
  },
  'الصفحة الرئيسية': {
    en: 'Home',
    es: 'Inicio',
    fr: 'Accueil',
    de: 'Startseite',
    tr: 'Ana Sayfa',
    zh: '主页',
    ar: 'الصفحة الرئيسية',
  },
  'بحث Google أو كتابة عنوان URL': {
    en: 'Search Google or type a URL',
    es: 'Buscar en Google o escribir una URL',
    fr: 'Rechercher sur Google ou saisir une URL',
    de: 'Google durchsuchen oder URL eingeben',
    tr: 'Google’da arayın veya bir URL yazın',
    zh: '在 Google 上搜索或输入网址',
    ar: 'بحث Google أو كتابة عنوان URL',
  },
  'أغاني': {
    en: 'Songs',
    es: 'Canciones',
    fr: 'Chansons',
    de: 'Lieder',
    tr: 'Şarkılar',
    zh: '歌曲',
    ar: 'أغاني',
  },
  'الموسيقى والأغاني الأكثر استماعاً في العالم العربي والعالمي': {
    en: 'The most listened songs and music in the Arab world and globally',
    es: 'Las canciones y música más escuchadas en el mundo árabe y global',
    fr: 'Les chansons et musiques les plus écoutées dans le monde arabe et mondial',
    de: 'Die meistgehörten Lieder und Musik in der arabischen Welt und weltweit',
    tr: 'Arap dünyasında ve küresel olarak en çok dinlenen şarkılar ve müzikler',
    zh: '阿拉伯及全球最受欢迎的歌曲和音乐',
    ar: 'الموسيقى والأغاني الأكثر استماعاً في العالم العربي والعالمي',
  },
  'تطبيق موسيقى رسمي وبث مباشر بدون إعلانات': {
    en: 'Official music app and live stream without ads',
    es: 'Aplicación oficial de música y transmisión en vivo sin anuncios',
    fr: 'Application musicale officielle et streaming en direct sans publicité',
    de: 'Offizielle Musik-App und Live-Stream ohne Werbung',
    tr: 'Resmi müzik uygulaması ve reklamsız canlı yayın',
    zh: '官方音乐应用及无广告实时流媒体',
    ar: 'تطبيق موسيقى رسمي وبث مباشر بدون إعلانات',
  },
  'تنزيل وحفظ في الذاكرة': {
    en: 'Download & Save to Storage',
    es: 'Descargar y guardar en almacenamiento',
    fr: 'Télécharger et enregistrer dans le stockage',
    de: 'Herunterladen & Im Speicher sichern',
    tr: 'İndir ve Depolamaya Kaydet',
    zh: '下载并保存到存储空间',
    ar: 'تنزيل وحفظ في الذاكرة',
  },
  'وضع توفير البيانات': {
    en: 'Data Saver Mode',
    es: 'Modo de ahorro de datos',
    fr: 'Mode économiseur de données',
    de: 'Datensparmodus',
    tr: 'Veri Tasarrufu Modu',
    zh: '省流模式',
    ar: 'وضع توفير البيانات',
  },
  'عرض الموقع في تبويب جديد': {
    en: 'Open in New Tab',
    es: 'Abrir en nueva pestaña',
    fr: 'Ouvrir dans un nouvel onglet',
    de: 'In neuem Tab öffnen',
    tr: 'Yeni Sekmede Aç',
    zh: '在新标签页中打开',
    ar: 'عرض الموقع في تبويب جديد',
  },
};

// قاموس الكلمات الفردية المعكوسة والموسعة
const VOCABULARY_WORDS: Record<string, Record<string, string>> = {
  songs: {
    ar: 'أغاني وموسيقى',
    es: 'canciones',
    fr: 'chansons',
    de: 'Lieder',
    tr: 'şarkılar',
    zh: '歌曲',
    en: 'songs',
  },
  music: {
    ar: 'موسيقى',
    es: 'música',
    fr: 'musique',
    de: 'Musik',
    tr: 'müzik',
    zh: '音乐',
    en: 'music',
  },
  video: {
    ar: 'فيديو',
    es: 'vídeo',
    fr: 'vidéo',
    de: 'Video',
    tr: 'video',
    zh: '视频',
    en: 'video',
  },
  videos: {
    ar: 'فيديوهات',
    es: 'vídeos',
    fr: 'vidéos',
    de: 'Videos',
    tr: 'videolar',
    zh: '视频',
    en: 'videos',
  },
  the: { ar: 'الـ', es: 'el/la', fr: 'le/la', de: 'der/die/das', tr: '', zh: '', en: 'the' },
  best: { ar: 'أفضل', es: 'mejor', fr: 'meilleur', de: 'beste', tr: 'en iyi', zh: '最佳', en: 'best' },
  hits: { ar: 'أشهر الأغاني', es: 'éxitos', fr: 'tubes', de: 'Hits', tr: 'hitler', zh: '热门曲目', en: 'hits' },
  all: { ar: 'كل', es: 'todos', fr: 'tous', de: 'alle', tr: 'tüm', zh: '所有', en: 'all' },
  time: { ar: 'الوقت والزمن', es: 'tiempo', fr: 'temps', de: 'Zeit', tr: 'zaman', zh: '时间', en: 'time' },
  top: { ar: 'أعلى وأفضل', es: 'mejores', fr: 'top', de: 'Top', tr: 'en üst', zh: '顶级', en: 'top' },
  mix: { ar: 'ميكس كوكتيل', es: 'mezcla', fr: 'mix', de: 'Mix', tr: 'karışım', zh: '混音', en: 'mix' },
  official: { ar: 'رسمي', es: 'oficial', fr: 'officiel', de: 'offiziell', tr: 'resmi', zh: '官方', en: 'official' },
  streaming: { ar: 'بث مباشر', es: 'transmisión', fr: 'streaming', de: 'Streaming', tr: 'yayın', zh: '流媒体', en: 'streaming' },
  visualizer: { ar: 'مؤثرات بصرية', es: 'visualizador', fr: 'visualiseur', de: 'Visualizer', tr: 'görselleştirici', zh: '可视化效果', en: 'visualizer' },
  special: { ar: 'خاص ومميز', es: 'especial', fr: 'spécial', de: 'speziell', tr: 'özel', zh: '特别', en: 'special' },
  live: { ar: 'حي ومباشر', es: 'en vivo', fr: 'en direct', de: 'live', tr: 'canlı', zh: '现场直播', en: 'live' },
  guide: { ar: 'دليل وإرشاد', es: 'guía', fr: 'guide', de: 'Leitfaden', tr: 'rehber', zh: '指南', en: 'guide' },
  review: { ar: 'مراجعة وتقييم', es: 'reseña', fr: 'avis', de: 'Bewertung', tr: 'inceleme', zh: '评论', en: 'review' },
  download: { ar: 'تنزيل', es: 'descargar', fr: 'télécharger', de: 'herunterladen', tr: 'indir', zh: '下载', en: 'download' },
  offline: { ar: 'بدون إنترنت', es: 'sin conexión', fr: 'hors ligne', de: 'offline', tr: 'çevrimdışı', zh: '离线', en: 'offline' },
  free: { ar: 'مجاني', es: 'gratis', fr: 'gratuit', de: 'kostenlos', tr: 'ücretsiz', zh: '免费', en: 'free' },
  database: { ar: 'قاعدة بيانات', es: 'base de datos', fr: 'base de données', de: 'Datenbank', tr: 'veritabanı', zh: '数据库', en: 'database' },
  player: { ar: 'مشغل', es: 'reproductor', fr: 'lecteur', de: 'Player', tr: 'oynatıcı', zh: '播放器', en: 'player' },
  browser: { ar: 'متصفح', es: 'navegador', fr: 'navigateur', de: 'Browser', tr: 'tarayıcı', zh: '浏览器', en: 'browser' },
  search: { ar: 'بحث', es: 'buscar', fr: 'rechercher', de: 'suchen', tr: 'arama', zh: '搜索', en: 'search' },
};

/**
 * ذاكرة مؤقتة لنتائج الترجمة للسرعة الفائقة 0ms
 */
const TRANSLATION_CACHE = new Map<string, string>();

/**
 * دالة الترجمة الفورية عبر القاموس المتصل
 */
export function translateTextOnline(text: string, targetLang: string): string {
  if (!text || typeof text !== 'string') return text;
  if (targetLang === 'ar' && /[\u0600-\u06FF]/.test(text)) {
    // إذا كان النص بالفعل عربياً واللغة المطلوبة هي العربية، نرجعه كما هو
    return text;
  }

  const cacheKey = `${targetLang}__${text}`;
  if (TRANSLATION_CACHE.has(cacheKey)) {
    return TRANSLATION_CACHE.get(cacheKey)!;
  }

  let result = text;

  // 1. استبدال العبارات الكاملة والمطابقة أولاً (Sort by phrase length descending)
  const phrases = Object.keys(DICTIONARY_ENTRIES).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    if (result.includes(phrase)) {
      const translation = DICTIONARY_ENTRIES[phrase][targetLang] || DICTIONARY_ENTRIES[phrase]['en'] || phrase;
      result = result.split(phrase).join(translation);
    }
  }

  // 2. إذا كانت اللغة الهدف غير العربية والنص يحتوي كلمات شائعة، نستبدل المفردات
  if (targetLang !== 'ar') {
    for (const [enWord, transMap] of Object.entries(VOCABULARY_WORDS)) {
      const targetTrans = transMap[targetLang] || enWord;
      const regex = new RegExp(`\\b${enWord}\\b`, 'gi');
      result = result.replace(regex, targetTrans);
    }
  } else {
    // الترجمة إلى العربية للكلمات الإنجليزية الشائعة
    for (const [enWord, transMap] of Object.entries(VOCABULARY_WORDS)) {
      const arTrans = transMap['ar'] || enWord;
      const regex = new RegExp(`\\b${enWord}\\b`, 'gi');
      result = result.replace(regex, arTrans);
    }
  }

  TRANSLATION_CACHE.set(cacheKey, result);
  return result;
}

/**
 * ترجمة متكاملة لكائنات ومصفوفات البيانات (Recursive Deep Object Translation)
 */
export function translateDataDeep<T>(data: T, targetLang: string): T {
  if (targetLang === 'ar') return data;
  if (!data) return data;

  if (typeof data === 'string') {
    return translateTextOnline(data, targetLang) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => translateDataDeep(item, targetLang)) as unknown as T;
  }

  if (typeof data === 'object') {
    const res: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      // لا نترجم الروابط والمعرفات والصور
      if (
        key === 'id' ||
        key === 'url' ||
        key === 'targetUrl' ||
        key === 'streamUrl' ||
        key === 'stream_url' ||
        key === 'thumbnail' ||
        key === 'icon' ||
        key === 'domain' ||
        key === 'path'
      ) {
        res[key] = val;
      } else {
        res[key] = translateDataDeep(val, targetLang);
      }
    }
    return res as T;
  }

  return data;
}
