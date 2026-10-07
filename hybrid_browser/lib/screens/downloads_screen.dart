import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/download_manager.dart';
import 'video_player_screen.dart';

class DownloadsScreen extends StatefulWidget {
  const DownloadsScreen({super.key});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  final _urlCtrl = TextEditingController();
  final _manager = DownloadManager.instance;

  @override
  void initState() {
    super.initState();
    _manager.addListener(_onUpdate);
  }

  void _onUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _manager.removeListener(_onUpdate);
    _urlCtrl.dispose();
    super.dispose();
  }

  String _formatMb(int bytes) {
    final mb = bytes / (1024 * 1024);
    return '${mb.toStringAsFixed(1)} MB';
  }

  void _startQuickDownload() {
    final input = _urlCtrl.text.trim();
    if (input.isEmpty) return;
    final id = 'dl_${DateTime.now().millisecondsSinceEpoch}';
    _manager.startDownload(
      id: id,
      title: input,
      url: input,
      quality: '720p',
      withArabicSubtitles: true,
    );
    _urlCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final tasks = _manager.tasks;
    final activeCount = tasks
        .where((t) =>
            t.status == DownloadStatus.downloading ||
            t.status == DownloadStatus.translating)
        .length;
    final completedCount =
        tasks.where((t) => t.status == DownloadStatus.completed).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('📥 التحميلات وتقدم التنزيل'),
      ),
      body: Column(
        children: [
          // ═══ بطاقة ملخص التنزيلات وإضافة رابط سريع ═══
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _statBadge(
                      icon: Icons.downloading_rounded,
                      label: 'قيد التنزيل',
                      value: '$activeCount',
                      color: AppTheme.accent,
                    ),
                    _statBadge(
                      icon: Icons.check_circle_outline_rounded,
                      label: 'مكتمل (مع SRT)',
                      value: '$completedCount',
                      color: AppTheme.success,
                    ),
                    _statBadge(
                      icon: Icons.bolt_rounded,
                      label: 'محرك الترجمة',
                      value: 'Groq + Whisper',
                      color: AppTheme.primary,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _urlCtrl,
                        onSubmitted: (_) => _startQuickDownload(),
                        style: const TextStyle(fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'الصق رابط فيديو أو اسم فيلم لتنزيله وترجمته...',
                          isDense: true,
                          filled: true,
                          fillColor: AppTheme.bgDark,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppTheme.border),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: _startQuickDownload,
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: const Text('تنزيل'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ═══ قائمة المهام والتقدم الحي ═══
          Expanded(
            child: tasks.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.download_done_rounded,
                          size: 80,
                          color: AppTheme.textMuted,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'لا توجد تحميلات بعد',
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'أضف رابط فيديو في الأعلى أو ابدأ بتحميل فيلم من شاشة الوسائط',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 18),
                        OutlinedButton.icon(
                          onPressed: () {
                            _manager.startDownload(
                              id: 'interstellar_demo',
                              title: 'Interstellar — Docking Scene (مترجم للعربية)',
                              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                              quality: '1080p',
                              withArabicSubtitles: true,
                            );
                          },
                          icon: const Icon(Icons.movie_Creation_outlined),
                          label: const Text('تجربة تنزيل فيديو فعلي مع ترجمة عربية الآن'),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: tasks.length,
                    itemBuilder: (_, i) {
                      final t = tasks[i];
                      final pct = (t.progress * 100).clamp(0, 100).toStringAsFixed(0);
                      final isDone = t.status == DownloadStatus.completed;
                      final isPaused = t.status == DownloadStatus.paused;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isDone
                                ? AppTheme.success.withOpacity(0.4)
                                : AppTheme.border,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: isDone
                                        ? AppTheme.success.withOpacity(0.15)
                                        : AppTheme.primary.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    isDone
                                        ? Icons.check_circle_rounded
                                        : isPaused
                                            ? Icons.pause_circle_filled_rounded
                                            : Icons.downloading_rounded,
                                    color: isDone
                                        ? AppTheme.success
                                        : AppTheme.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        t.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${t.quality} • ${_formatMb(t.receivedBytes)} / ${_formatMb(t.totalBytes)}'
                                        '${!isDone && !isPaused ? ' • ${t.speedMbps.toStringAsFixed(1)} MB/s' : ''}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!isDone)
                                  IconButton(
                                    icon: Icon(
                                      isPaused
                                          ? Icons.play_arrow_rounded
                                          : Icons.pause_rounded,
                                      color: AppTheme.accent,
                                    ),
                                    onPressed: () => _manager.togglePause(t.id),
                                    tooltip: isPaused ? 'استئناف' : 'إيقاف مؤقت',
                                  ),
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline_rounded,
                                    color: AppTheme.danger,
                                    size: 20,
                                  ),
                                  onPressed: () => _manager.removeTask(t.id),
                                  tooltip: 'حذف',
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // شريط التقدم الفعلي (LinearProgressIndicator)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: LinearProgressIndicator(
                                value: t.progress,
                                minHeight: 8,
                                backgroundColor: AppTheme.bgDark,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  isDone ? AppTheme.success : AppTheme.primary,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),

                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    t.stageLabel,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDone
                                          ? AppTheme.success
                                          : AppTheme.accent,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Text(
                                  '$pct%',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                              ],
                            ),

                            if (isDone) ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => VideoPlayerScreen(
                                              title: t.title,
                                              videoUrl:
                                                  t.localVideoPath ?? t.videoUrl,
                                              subtitles: t.subtitles,
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(
                                        Icons.play_circle_fill_rounded,
                                        size: 18,
                                      ),
                                      label: const Text(
                                        'تشغيل مع الترجمة العربية (SRT)',
                                        style: TextStyle(fontSize: 12),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.success,
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 10,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _statBadge({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
