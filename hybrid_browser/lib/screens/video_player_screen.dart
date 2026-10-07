import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

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
  String _currentSub = '';
  bool _showSubs = true;

  @override
  void initState() {
    super.initState();
    _initPlayer();
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
    setState(() {});
  }

  void _updateSubtitle() {
    if (!_showSubs || widget.subtitles.isEmpty) return;
    final pos = _videoCtrl.value.position.inMilliseconds / 1000.0;

    String found = '';
    for (final seg in widget.subtitles) {
      final start = (seg['start'] as num).toDouble();
      final end = (seg['end'] as num).toDouble();
      if (pos >= start && pos <= end) {
        found = seg['text'];
        break;
      }
    }
    if (found != _currentSub) {
      setState(() => _currentSub = found);
    }
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
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text(widget.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (widget.subtitles.isNotEmpty)
            IconButton(
              icon: Icon(_showSubs ? Icons.subtitles : Icons.subtitles_off),
              onPressed: () => setState(() => _showSubs = !_showSubs),
            ),
        ],
      ),
      body: _chewieCtrl == null
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              alignment: Alignment.bottomCenter,
              children: [
                Center(child: Chewie(controller: _chewieCtrl!)),
                if (_showSubs && _currentSub.isNotEmpty)
                  Positioned(
                    bottom: 60,
                    left: 24,
                    right: 24,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.75),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        _currentSub,
                        textAlign: TextAlign.center,
                        textDirection: TextDirection.rtl,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
