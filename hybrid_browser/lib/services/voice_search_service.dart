import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:http/http.dart' as http;
import '../theme/app_theme.dart';
import 'media_api.dart';

/// خدمة ونافذة البحث الصوتي الفعلي (Speech-to-Text + Whisper AI Refinement)
class VoiceSearchService {
  static final stt.SpeechToText _speech = stt.SpeechToText();

  /// فتح نافذة الاستماع الصوتي التفاعلية وإرجاع النص المحوّل
  static Future<Map<String, dynamic>?> showVoiceSearchSheet(
    BuildContext context,
  ) async {
    return showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const _VoiceSearchSheet(),
    );
  }

  /// تحسين النص الصوتي عبر الخادم (/api/stt) وتحديد الوجهة (فيديو أو تصفح ويب)
  static Future<Map<String, dynamic>> refineVoiceTranscript(
    String rawText, {
    String language = 'ar-SA',
  }) async {
    try {
      final base = await MediaApi.getServer();
      final res = await http
          .post(
            Uri.parse('$base/api/stt'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'rawTranscript': rawText,
              'language': language,
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes));
      }
    } catch (_) {}

    return {
      'transcript': rawText,
      'normalized_query': rawText,
      'intent': 'video',
    };
  }
}

class _VoiceSearchSheet extends StatefulWidget {
  const _VoiceSearchSheet();

  @override
  State<_VoiceSearchSheet> createState() => _VoiceSearchSheetState();
}

class _VoiceSearchSheetState extends State<_VoiceSearchSheet>
    with SingleTickerProviderStateMixin {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isAvailable = false;
  bool _isListening = false;
  bool _isProcessing = false;
  String _selectedLocale = 'ar_SA';
  String _recognizedText = '';
  double _soundLevel = 0.0;

  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    try {
      _isAvailable = await _speech.initialize(
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            if (mounted) setState(() => _isListening = false);
          }
        },
        onError: (_) {
          if (mounted) setState(() => _isListening = false);
        },
      );
      if (_isAvailable) {
        _startListening();
      } else {
        setState(() {});
      }
    } catch (_) {
      setState(() => _isAvailable = false);
    }
  }

  Future<void> _startListening() async {
    if (!_isAvailable) return;
    setState(() {
      _isListening = true;
      _recognizedText = '';
    });

    await _speech.listen(
      localeId: _selectedLocale,
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 4),
      partialResults: true,
      onSoundLevelChange: (level) {
        if (mounted) setState(() => _soundLevel = level.clamp(0.0, 15.0));
      },
      onResult: (result) {
        if (!mounted) return;
        setState(() {
          _recognizedText = result.recognizedWords;
        });
        if (result.finalResult && _recognizedText.trim().isNotEmpty) {
          _submitVoiceQuery(_recognizedText.trim());
        }
      },
    );
  }

  Future<void> _stopListening() async {
    await _speech.stop();
    if (mounted) setState(() => _isListening = false);
    if (_recognizedText.trim().isNotEmpty) {
      await _submitVoiceQuery(_recognizedText.trim());
    }
  }

  Future<void> _submitVoiceQuery(String text) async {
    if (_isProcessing) return;
    setState(() {
      _isListening = false;
      _isProcessing = true;
      _recognizedText = text;
    });

    final refined = await VoiceSearchService.refineVoiceTranscript(
      text,
      language: _selectedLocale == 'ar_SA' ? 'ar-SA' : 'en-US',
    );
    if (mounted) {
      Navigator.pop(context, refined);
    }
  }

  @override
  void dispose() {
    _speech.stop();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scale = 1.0 + (_soundLevel / 35.0);

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      decoration: const BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: AppTheme.border, width: 1.5)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 20),

          // اختيار لغة التعرف الصوتي
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.mic_rounded, color: AppTheme.secondary, size: 22),
                  SizedBox(width: 8),
                  Text(
                    'البحث الصوتي الذكي (Speech-to-Text)',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  _localeChip('العربية', 'ar_SA'),
                  const SizedBox(width: 6),
                  _localeChip('English', 'en_US'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 28),

          // زر الميكروفون المتوهج مع الموجات الصوتية
          GestureDetector(
            onTap: _isListening ? _stopListening : _startListening,
            child: AnimatedScale(
              scale: _isListening ? scale : 1.0,
              duration: const Duration(milliseconds: 120),
              child: Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: _isListening
                      ? AppTheme.gradientPrimary
                      : const LinearGradient(
                          colors: [AppTheme.bgCardLight, AppTheme.border],
                        ),
                  boxShadow: _isListening
                      ? [
                          BoxShadow(
                            color: AppTheme.secondary.withOpacity(0.55),
                            blurRadius: 32,
                            spreadRadius: 6,
                          ),
                        ]
                      : [],
                ),
                child: Icon(
                  _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                  size: 44,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          Text(
            _isProcessing
                ? 'جاري تحليل الصوت عبر Whisper + Groq...'
                : _isListening
                    ? 'تحدث الآن... أنا أستمع إليك 🎙️'
                    : 'اضغط على الميكروفون للتحدث أو اختر عبارة سريعة',
            style: TextStyle(
              color: _isListening ? AppTheme.accent : AppTheme.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),

          // النص الملتقط في الوقت الفعلي
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.bgDark,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              _recognizedText.isEmpty
                  ? 'مثال: "شغل فيلم Interstellar مترجم للعربية"'
                  : _recognizedText,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _recognizedText.isEmpty
                    ? AppTheme.textMuted
                    : AppTheme.textPrimary,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // أوامر صوتية سريعة للتجربة الفورية
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              _quickVoiceCmd('🎬 فيلم Interstellar مترجم'),
              _quickVoiceCmd('🎥 Sintel 4K Open Movie'),
              _quickVoiceCmd('🌐 وثائقي الثقوب السوداء والفضاء'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _localeChip(String label, String localeId) {
    final active = _selectedLocale == localeId;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedLocale = localeId);
        if (_isListening) _startListening();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : AppTheme.bgDark,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: active ? AppTheme.primary : AppTheme.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: active ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _quickVoiceCmd(String cmd) {
    final clean = cmd.replaceAll(RegExp(r'^[^\s]+\s'), '');
    return ActionChip(
      backgroundColor: AppTheme.bgCardLight,
      side: const BorderSide(color: AppTheme.border),
      label: Text(
        cmd,
        style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
      ),
      onPressed: () => _submitVoiceQuery(clean),
    );
  }
}
