import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class ApiService {
  static Future<String> get _baseUrl => StorageService.getServerUrl();
  static Future<String> get _apiKey => StorageService.getApiKey();

  /// إرسال سؤال والحصول على إجابة كاملة
  static Future<Map<String, dynamic>> chat(String message) async {
    final url = Uri.parse('${await _baseUrl}/chat');
    final apiKey = await _apiKey;

    final response = await http
        .post(
          url,
          headers: {
            'Content-Type': 'application/json',
            if (apiKey.isNotEmpty) 'X-API-Key': apiKey,
          },
          body: jsonEncode({'message': message}),
        )
        .timeout(const Duration(minutes: 5));

    if (response.statusCode != 200) {
      throw Exception('فشل الاتصال: ${response.statusCode}');
    }

    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  /// رفع ملف إلى RAG
  static Future<Map<String, dynamic>> uploadFile({
    required String filePath,
    required String fileName,
  }) async {
    final url = Uri.parse('${await _baseUrl}/upload');
    final apiKey = await _apiKey;

    final request = http.MultipartRequest('POST', url);
    if (apiKey.isNotEmpty) {
      request.headers['X-API-Key'] = apiKey;
    }
    request.files.add(
      await http.MultipartFile.fromPath('file', filePath, filename: fileName),
    );

    final streamed = await request.send().timeout(const Duration(minutes: 5));
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode != 200) {
      throw Exception('فشل الرفع: ${response.statusCode}');
    }
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  /// فحص حالة الخادم
  static Future<Map<String, dynamic>> health() async {
    final url = Uri.parse('${await _baseUrl}/health');
    final response = await http.get(url).timeout(const Duration(seconds: 10));
    if (response.statusCode != 200) throw Exception('الخادم لا يستجيب');
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  /// إحصاءات RAG
  static Future<Map<String, dynamic>> ragStats() async {
    final url = Uri.parse('${await _baseUrl}/rag/stats');
    final response = await http.get(url).timeout(const Duration(seconds: 10));
    return jsonDecode(utf8.decode(response.bodyBytes));
  }
}
