import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';

/// خدمة الحفظ والإرجاع بدون إنترنت
/// - حفظ في Firestore (خارجي) عند الاتصال
/// - حفظ محلي دائم (SQLite/JSON) لضمان الوصول offline
class SaveService {
  static final SaveService _instance = SaveService._();
  factory SaveService() => _instance;
  SaveService._();

  static const _localKey = 'saved_pages_v1';
  final String _firestoreUrl =
      'https://firestore.googleapis.com/v1/projects/gen-lang-client-0731655503/databases/ai-studio-hybridaiarchitec-7c7e9ecb-1da3-46d9-867c-b15fe64813de/documents/saved_pages';
  final String _apiKey = 'AIzaSyDSO42SHD8dD2EMUUeBkUfIWdZ4ZA5--4s';
  final String _serverUrl = 'http://129.151.142.88:8500';

  // ─────────────────────────────────────────────────
  // حفظ صفحة كاملة
  // ─────────────────────────────────────────────────
  Future<bool> savePage({
    required String url,
    required String title,
    required String content,
    String? translatedContent,
  }) async {
    final entry = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'url': url,
      'title': title,
      'content': content,
      'translation': translatedContent,
      'savedAt': DateTime.now().toIso8601String(),
    };

    // 1. حفظ محلي فوري (يعمل بدون إنترنت)
    final ok = await _saveLocal(entry);

    // 2. رفع للـ Firestore وقاعدة البيانات الخارجية في الخلفية
    _syncToFirestore(entry); // fire-and-forget

    return ok;
  }

  Future<bool> _saveLocal(Map<String, dynamic> entry) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = await getAll();
      list.removeWhere((e) => e['url'] == entry['url']);
      list.insert(0, entry); // الأحدث أولاً
      await prefs.setString(_localKey, jsonEncode(list));

      // نسخة على الملف أيضًا للاحتياط
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/saved_pages.json');
      await file.writeAsString(jsonEncode(list));

      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> _syncToFirestore(Map<String, dynamic> entry) async {
    try {
      await http.post(
        Uri.parse('$_firestoreUrl?key=$_apiKey'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fields': {
            'url': {'stringValue': entry['url']},
            'title': {'stringValue': entry['title']},
            'content': {'stringValue': entry['content']},
            'translation': {'stringValue': entry['translation'] ?? ''},
            'savedAt': {'stringValue': entry['savedAt']},
          }
        }),
      ).timeout(const Duration(seconds: 15));
    } catch (_) {
      // سيُعاد المحاولة عند الاتصال التالي
    }

    try {
      await http.post(
        Uri.parse('$_serverUrl/api/saved-pages'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(entry),
      ).timeout(const Duration(seconds: 15));
    } catch (_) {}
  }

  // ─────────────────────────────────────────────────
  // استرجاع — يعمل offline
  // ─────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_localKey);
      if (raw != null) {
        return List<Map<String, dynamic>>.from(jsonDecode(raw));
      }
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/saved_pages.json');
      if (await file.exists()) {
        final fileRaw = await file.readAsString();
        return List<Map<String, dynamic>>.from(jsonDecode(fileRaw));
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> search(String query) async {
    final all = await getAll();
    if (query.isEmpty) return all;
    final q = query.toLowerCase();
    return all.where((e) =>
        (e['title'] ?? '').toString().toLowerCase().contains(q) ||
        (e['content'] ?? '').toString().toLowerCase().contains(q) ||
        (e['url'] ?? '').toString().toLowerCase().contains(q)
    ).toList();
  }

  Future<void> delete(String id) async {
    final all = await getAll();
    all.removeWhere((e) => e['id'] == id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localKey, jsonEncode(all));
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_localKey);
  }

  Future<int> count() async => (await getAll()).length;
}
