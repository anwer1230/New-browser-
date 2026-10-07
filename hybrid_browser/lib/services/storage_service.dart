import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _keyRecent = 'hybrid_browser_recent_v1';
  static const _keyDownloads = 'hybrid_browser_downloads_v1';

  static Future<List<Map<String, dynamic>>> getRecentItems() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyRecent);
    if (raw == null) return [];
    return List<Map<String, dynamic>>.from(jsonDecode(raw));
  }

  static Future<void> saveRecentItems(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyRecent, jsonEncode(items));
  }

  static Future<List<Map<String, dynamic>>> getDownloads() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyDownloads);
    if (raw == null) return [];
    return List<Map<String, dynamic>>.from(jsonDecode(raw));
  }
}
