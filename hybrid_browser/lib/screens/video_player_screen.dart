import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../theme/app_theme.dart';
import '../services/media_api.dart';

class VideoPlayerScreen extends StatefulWidget {
  final String title;
  final String videoUrl;
  final List<Map<String, dynamic>> subtitles;

  const VideoPlayerScreen({
    super.key,
    required this.title,
    required this.videoUrl,
    required this.subtitles,
  });

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late VideoPlayerController _videoCtrl;
  ChewieController? _chewieCtrl;
  late List<Map<String, dynamic>> _segments;

  Map<String, dynamic>? _activeSeg;
  String _subMode = 'dual'; // 'dual' | 'ar' | 'orig' | 'off'
  double _fontSize = 18.0;
  double _offsetSeconds = 0.0;
  bool _isTranslatingLive = false;

  @override
  void initState() {
    super.initState();
    _segments = List<Map<String, dynamic>>.from(widget.subtitles);
    _initPlayer();
    _ensureArabicTranslation();
  }

  Future<void> _initPlayer() async {
    _videoCtrl = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
    await _videoCtrl.initialize();

    _videoCtrl.addListener(_updateSubtitle);

    _chewieCtrl = ChewieController(
      videoPlayerController: _videoCtrl,
      autoPlay: true,
      looping: false,
      allowFullScreen: true,
    );
    if (mounted) setState(() {});
  }

  /// جلب وتفعيل الترجمة العربية الفورية عبر Groq في حال لم تكن محملة مسبقاً
  Future<void> _ensureArabicTranslation({bool force = false}) async {
    if (_isTranslatingLive) return;
    setState(() => _isTranslatingLive = true);
    try {
      if (_segments.isEmpty) {
        final streamData = await MediaApi.getStreamWithSegments(widget.videoUrl);
        if (streamData['segments'] is List) {
          _segments = List<Map<String, dynamic>>.from(streamData['segments']);
        }
      }

      final needsAr = force ||
          _segments.any((s) =>
              (s['translation_ar'] == null ||
                  s['translation_ar'].toString().isEmpty));
      if (_segments.isNotEmpty && needsAr) {
        final translated = await MediaApi.streamTranslate(_segments);
        if (mounted) {
          setState(() => _segments = translated);
        }
      }
    } catch (_) {
      // الاحتفاظ بالمقاطع الحالية في حال عدم الاتصال
    } finally {
      if (mounted) setState(() => _isTranslatingLive = false);
    }
  }

  void _updateSubtitle() {
    if (_subMode == 'off' || _segments.isEmpty || !_videoCtrl.value.isInitialized) {
      return;
    }
    final pos = (_videoCtrl.value.position.inMilliseconds / 1000.0) + _offsetSeconds;

    Map<String, dynamic>? found;
    for (final seg in _segments) {
      final start = (seg['start'] as num?)?.toDouble() ?? 0.0;
      final end = (seg['end'] as num?)?.toDouble() ?? 0.0;
      if (pos >= start && pos <= end) {
        found = seg;
        break;
      }
    }
    if (found != _activeSeg) {
      setState(() => _activeSeg = found);
    }
  }

  String _fmtTime(num sec) {
    final total = sec.toInt().clamp(0, 36000);
    final m = total ~/ 60;
    final s = total % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _videoCtrl.removeListener(_updateSubtitle);
    _chewieCtrl?.dispose();
    _videoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final arText =
        (_activeSeg?['translation_ar'] ?? _activeSeg?['text'] ?? '').toString();
    final origText = (_activeSeg?['text'] ?? '').toString();

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        title: Text(
          widget.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: _isTranslatingLive
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.translate_rounded, color: AppTheme.accent),
            tooltip: 'ترجمة عربية فورية عبر Groq AI',
            onPressed: () => _ensureArabicTranslation(force: true),
          ),
          PopupMenuButton<String>(
            initialValue: _subMode,
            icon: const Icon(Icons.subtitles_rounded),
            onSelected: (v) => setState(() => _subMode = v),
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'dual', child: Text('🌐 مزدوج (عربي + أصلي)')),
              PopupMenuItem(value: 'ar', child: Text('🇸🇦 عربي فقط (AR)')),
              PopupMenuItem(value: 'orig', child: Text('🔤 النص الأصلي (EN)')),
              PopupMenuItem(value: 'off', child: Text('🚫 إيقاف الترجمة')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // ═══ مشغل الفيديو مع طبقة الترجمة الفورية (SRT Overlay) ═══
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: Colors.black,
              child: _chewieCtrl == null
                  ? const Center(child: CircularProgressIndicator())
                  : Stack(
                      alignment: Alignment.bottomCenter,
                      children: [
                        Center(child: Chewie(controller: _chewieCtrl!)),
                        if (_subMode != 'off' && _activeSeg != null)
                          Positioned(
                            bottom: 48,
                            left: 20,
                            right: 20,
                            child: IgnorePointer(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.82),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.15),
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (_subMode == 'dual' || _subMode == 'ar')
                                      Text(
                                        arText,
                                        textAlign: TextAlign.center,
                                        textDirection: TextDirection.rtl,
                                        style: TextStyle(
                                          color: AppTheme.warning,
                                          fontSize: _fontSize,
                                          fontWeight: FontWeight.bold,
                                          height: 1.35,
                                        ),
                                      ),
                                    if (_subMode == 'dual' && origText.isNotEmpty)
                                      const SizedBox(height: 3),
                                    if (_subMode == 'dual' || _subMode == 'orig')
                                      Text(
                                        origText,
                                        textAlign: TextAlign.center,
                                        textDirection: TextDirection.ltr,
                                        style: TextStyle(
                                          color: Colors.white.withOpacity(0.9),
                                          fontSize: (_fontSize - 3).clamp(11.0, 22.0),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
            ),
          ),

          // ═══ شريط التحكم بحجم الخط ومزامنة التوقيت ═══
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: AppTheme.bgCard,
              border: Border(bottom: BorderSide(color: AppTheme.border)),
            ),
            child: Row(
              children: [
                const Icon(Icons.format_size_rounded,
                    size: 16, color: AppTheme.textSecondary),
                Expanded(
                  child: Slider(
                    value: _fontSize,
                    min: 14,
                    max: 26,
                    activeColor: AppTheme.primary,
                    onChanged: (v) => setState(() => _fontSize = v),
                  ),
                ),
                Text(
                  '${_fontSize.toInt()}px',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                const SizedBox(width: 12),
                // موازنة توقيت الترجمة
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline, size: 18),
                  tooltip: 'تقديم الترجمة -0.5s',
                  onPressed: () => setState(() => _offsetSeconds -= 0.5),
                ),
                Text(
                  '${_offsetSeconds >= 0 ? '+' : ''}${_offsetSeconds.toStringAsFixed(1)}s',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.accent,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline, size: 18),
                  tooltip: 'تأخير الترجمة +0.5s',
                  onPressed: () => setState(() => _offsetSeconds += 0.5),
                ),
              ],
            ),
          ),

          // ═══ شريط الجمل المترجمة التفاعلي (Interactive SRT Transcript) ═══
          Expanded(
            child: _segments.isEmpty
                ? Center(
                    child: TextButton.icon(
                      onPressed: () => _ensureArabicTranslation(force: true),
                      icon: const Icon(Icons.auto_awesome_rounded),
                      label: const Text('توليد الترجمة العربية الفورية عبر Groq الآن'),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(14),
                    itemCount: _segments.length,
                    itemBuilder: (_, i) {
                      final seg = _segments[i];
                      final isCurrent = identical(seg, _activeSeg);
                      final start = (seg['start'] as num?) ?? 0;
                      final end = (seg['end'] as num?) ?? 0;

                      return GestureDetector(
                        onTap: () {
                          _videoCtrl.seekTo(
                            Duration(milliseconds: (start * 1000).toInt()),
                          );
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? AppTheme.primary.withOpacity(0.18)
                                : AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isCurrent ? AppTheme.primary : AppTheme.border,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${_fmtTime(start)} → ${_fmtTime(end)}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.accent,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (isCurrent)
                                    const Text(
                                      '● يُعرض الآن',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: AppTheme.success,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                ],
                              ),
                              if (seg['translation_ar'] != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  seg['translation_ar'].toString(),
                                  textDirection: TextDirection.rtl,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.warning,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 4),
                              Text(
                                (seg['text'] ?? '').toString(),
                                textDirection: TextDirection.ltr,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
