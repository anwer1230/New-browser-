import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _secure = FlutterSecureStorage();
  static const _keyServerUrl = 'server_url';
  static const _keyApiKey = 'api_key';
  static const _keyHistory = 'chat_history';

  static Future<String> getServerUrl() async {
    return await _secure.read(key: _keyServerUrl) ??
        'http://10.0.2.2:8000'; // Android emulator default
  }

  static Future<void> setServerUrl(String url) async {
    await _secure.write(key: _keyServerUrl, value: url);
  }

  static Future<String> getApiKey() async {
    return await _secure.read(key: _keyApiKey) ?? '';
  }

  static Future<void> setApiKey(String key) async {
    await _secure.write(key: _keyApiKey, value: key);
  }

  static Future<void> saveHistory(List<Map<String, dynamic>> messages) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyHistory, jsonEncode(messages));
  }

  static Future<List<Map<String, dynamic>>> loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyHistory);
    if (raw == null) return [];
    return List<Map<String, dynamic>>.from(jsonDecode(raw));
  }

  static Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyHistory);
  }
}
