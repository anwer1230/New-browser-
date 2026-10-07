import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class MediaApi {
  static const _keyServer = 'media_server_url';

  static Future<String> getServer() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyServer) ?? 'http://10.66.66.1:8080';
  }

  static Future<void> setServer(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyServer, url.trim());
  }

  /// البحث عن فيديوهات
  static Future<List<Map<String, dynamic>>> search(String query) async {
    final base = await getServer();
    final res = await http
        .post(
          Uri.parse('$base/api/search'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'query': query, 'limit': 8}),
        )
        .timeout(const Duration(seconds: 60));

    if (res.statusCode != 200) throw Exception('فشل البحث: ${res.body}');
    final data = jsonDecode(utf8.decode(res.bodyBytes));
    return List<Map<String, dynamic>>.from(data['results']);
  }

  /// استخراج رابط البث المباشر مع المقاطع الأولية
  static Future<String> getStreamUrl(String url, {String quality = '720'}) async {
    final base = await getServer();
    final res = await http
        .post(
          Uri.parse('$base/api/stream-url'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'url': url, 'quality': quality}),
        )
        .timeout(const Duration(seconds: 40));

    if (res.statusCode != 200) throw Exception('فشل: ${res.body}');
    return jsonDecode(res.body)['stream_url'];
  }

  /// استخراج رابط البث + مقاطع الترجمة الفورية معاً
  static Future<Map<String, dynamic>> getStreamWithSegments(
    String url, {
    String quality = '720',
  }) async {
    final base = await getServer();
    final res = await http
        .post(
          Uri.parse('$base/api/stream-url'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'url': url, 'quality': quality}),
        )
        .timeout(const Duration(seconds: 40));

    if (res.statusCode != 200) throw Exception('فشل: ${res.body}');
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  /// ترجمة فورية متدفقة للمقاطع عبر محرك Groq (llama-3.3-70b-versatile)
  static Future<List<Map<String, dynamic>>> streamTranslate(
    List<Map<String, dynamic>> segments,
  ) async {
    final base = await getServer();
    final res = await http
        .post(
          Uri.parse('$base/api/stream-translate'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'segments': segments,
            'targetLanguage': 'ar',
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (res.statusCode != 200) return segments;
    final data = jsonDecode(utf8.decode(res.bodyBytes));
    if (data['segments'] is List) {
      return List<Map<String, dynamic>>.from(data['segments']);
    }
    return segments;
  }

  /// تحميل + ترجمة عربية كاملة (Whisper + Groq + SRT)
  static Future<Map<String, dynamic>> downloadAndTranslate(String url) async {
    final base = await getServer();
    final res = await http
        .post(
          Uri.parse('$base/api/download-and-translate'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'url': url, 'quality': '720'}),
        )
        .timeout(const Duration(minutes: 10));

    if (res.statusCode != 200) throw Exception('فشل: ${res.body}');
    final data = jsonDecode(utf8.decode(res.bodyBytes));
    data['full_video_url'] =
        data['video_url'].toString().startsWith('http')
            ? data['video_url']
            : '$base${data['video_url']}';
    data['full_srt_ar'] = '$base${data['srt_arabic'] ?? ''}';
    return data;
  }
}
