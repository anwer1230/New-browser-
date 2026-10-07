import 'dart:async';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// خدمة الخلفية الموحّدة
/// - الترجمة التلقائية
/// - معالجة AI
/// - كل شيء يحدث دون ظهور أي واجهة
class BackgroundService {
  static final BackgroundService _instance = BackgroundService._();
  factory BackgroundService() => _instance;
  BackgroundService._();

  final String _serverUrl = 'http://129.151.142.88:8500';

  // حالة الترجمة التلقائية
  bool autoTranslate = true;
  String targetLanguage = 'ar';

  // حالة AI
  bool aiEnabled = true;

  // إحصائيات (اختياري)
  int translatedCount = 0;
  int savedCount = 0;

  /// ترجمة نص — تعمل في الخلفية
  Future<String> translate(String text) async {
    if (!autoTranslate || text.trim().isEmpty) return text;
    try {
      final response = await http.post(
        Uri.parse('$_serverUrl/api/translate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'text': text,
          'target': targetLanguage,
        }),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        translatedCount++;
        return jsonDecode(utf8.decode(response.bodyBytes))['translation'] ?? text;
      }
    } catch (_) {
      // صامت — لا نعرض أخطاء
    }
    return text;
  }

  /// استعلام AI — يعمل في الخلفية
  Future<String?> askAI(String query) async {
    if (!aiEnabled) return null;
    try {
      final response = await http.post(
        Uri.parse('$_serverUrl/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'query': query}),
      ).timeout(const Duration(seconds: 60));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return data['response'];
      }
    } catch (_) {}
    return null;
  }
}
