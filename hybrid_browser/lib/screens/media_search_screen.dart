import 'package:flutter/material.dart';
import '../services/media_api.dart';
import '../services/download_manager.dart';
import 'video_player_screen.dart';
import 'downloads_screen.dart';

class MediaSearchScreen extends StatefulWidget {
  final String? initialQuery;
  const MediaSearchScreen({super.key, this.initialQuery});

  @override
  State<MediaSearchScreen> createState() => _MediaSearchScreenState();
}

class _MediaSearchScreenState extends State<MediaSearchScreen> {
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _results = [];
  bool _loading = false;
  String? _statusMsg;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null) {
      _searchCtrl.text = widget.initialQuery!;
      _search();
    }
  }

  Future<void> _search() async {
    final q = _searchCtrl.text.trim();
    if (q.isEmpty) return;
    setState(() {
      _loading = true;
      _statusMsg = 'جاري البحث...';
    });
    try {
      final res = await MediaApi.search(q);
      setState(() => _results = res);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e')),
        );
      }
    } finally {
      setState(() {
        _loading = false;
        _statusMsg = null;
      });
    }
  }

  Future<void> _playDirect(Map<String, dynamic> item) async {
    setState(() {
      _loading = true;
      _statusMsg = 'جاري استخراج رابط البث...';
    });
    try {
      final streamUrl = await MediaApi.getStreamUrl(item['url']);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => VideoPlayerScreen(
            title: item['title'],
            videoUrl: streamUrl,
            subtitles: const [],
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      setState(() {
        _loading = false;
        _statusMsg = null;
      });
    }
  }

  Future<void> _downloadAndTranslate(Map<String, dynamic> item) async {
    setState(() {
      _loading = true;
      _statusMsg = 'جاري التحميل واستخراج الصوت والترجمة بالـ AI...';
    });
    try {
      final data = await MediaApi.downloadAndTranslate(item['url']);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => VideoPlayerScreen(
            title: item['title'],
            videoUrl: data['full_video_url'],
            subtitles: List<Map<String, dynamic>>.from(data['subtitles']),
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      setState(() {
        _loading = false;
        _statusMsg = null;
      });
    }
  }

  String _fmtDuration(int sec) {
    final m = sec ~/ 60;
    final s = sec % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🎬 البحث والترجمة بالـ AI')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    onSubmitted: (_) => _search(),
                    decoration: InputDecoration(
                      hintText: 'ابحث عن فيديو أو فيلم...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: _search, child: const Text('بحث')),
              ],
            ),
          ),
          if (_loading)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 12),
                  Text(_statusMsg ?? '', textAlign: TextAlign.center),
                ],
              ),
            ),
          Expanded(
            child: ListView.builder(
              itemCount: _results.length,
              itemBuilder: (_, i) {
                final v = _results[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: ListTile(
                    leading: v['thumbnail'] != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              v['thumbnail'],
                              width: 90,
                              height: 60,
                              fit: BoxFit.cover,
                            ),
                          )
                        : const Icon(Icons.movie, size: 48),
                    title: Text(
                      v['title'] ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      '${v['uploader']} • ${_fmtDuration(v['duration'] ?? 0)}',
                    ),
                    trailing: PopupMenuButton<String>(
                      onSelected: (choice) {
                        if (choice == 'stream') _playDirect(v);
                        if (choice == 'translate') _downloadAndTranslate(v);
                        if (choice == 'download') {
                          DownloadManager.instance.startDownload(
                            id: (v['id'] ?? DateTime.now().millisecondsSinceEpoch).toString(),
                            title: (v['title'] ?? 'فيديو').toString(),
                            url: (v['url'] ?? '').toString(),
                            thumbnail: (v['thumbnail'] ?? '').toString(),
                            quality: '720p',
                            withArabicSubtitles: true,
                          );
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const DownloadsScreen(),
                            ),
                          );
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(
                          value: 'stream',
                          child: Text('▶️ بث مباشر (سريع)'),
                        ),
                        PopupMenuItem(
                          value: 'translate',
                          child: Text('🌐 ترجمة عربية بالـ AI + مشاهدة'),
                        ),
                        PopupMenuItem(
                          value: 'download',
                          child: Text('📥 تنزيل مع تقدم حي + ملف SRT'),
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
