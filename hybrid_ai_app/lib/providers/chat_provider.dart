import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/message.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class ChatProvider extends ChangeNotifier {
  final List<Message> _messages = [];
  bool _loading = false;
  String? _error;

  List<Message> get messages => List.unmodifiable(_messages);
  bool get isLoading => _loading;
  String? get error => _error;

  Future<void> init() async {
    final saved = await StorageService.loadHistory();
    _messages.addAll(saved.map((m) => Message.fromJson(m)));
    notifyListeners();
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty || _loading) return;

    _error = null;
    _messages.add(Message(
      id: const Uuid().v4(),
      content: text,
      role: MessageRole.user,
    ));
    _loading = true;
    notifyListeners();

    try {
      final result = await ApiService.chat(text);
      _messages.add(Message(
        id: const Uuid().v4(),
        content: result['response'] ?? 'لا توجد إجابة',
        role: MessageRole.assistant,
        experts: result['experts_used'] != null
            ? List<String>.from(result['experts_used'])
            : null,
        elapsed: (result['elapsed_seconds'] as num?)?.toDouble(),
      ));
      await _persist();
    } catch (e) {
      _error = e.toString();
      _messages.add(Message(
        id: const Uuid().v4(),
        content: '⚠️ حدث خطأ: $e',
        role: MessageRole.system,
      ));
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> clearHistory() async {
    _messages.clear();
    await StorageService.clearHistory();
    notifyListeners();
  }

  Future<void> _persist() async {
    final recent = _messages.length > 100
        ? _messages.sublist(_messages.length - 100)
        : _messages;
    await StorageService.saveHistory(recent.map((m) => m.toJson()).toList());
  }
}
