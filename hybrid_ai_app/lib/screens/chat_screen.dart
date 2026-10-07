import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../widgets/message_bubble.dart';
import '../widgets/chat_input.dart';
import '../widgets/typing_indicator.dart';
import 'upload_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ChatProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    _scrollToBottom();

    return Scaffold(
      appBar: AppBar(
        title: const Text('المحادثة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.upload_file_rounded),
            tooltip: 'رفع ملف',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const UploadScreen()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'مسح المحادثة',
            onPressed: () async {
              final ok = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('مسح المحادثة'),
                  content: const Text('هل أنت متأكد؟'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('إلغاء'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('مسح'),
                    ),
                  ],
                ),
              );
              if (ok == true) provider.clearHistory();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: provider.messages.isEmpty
                ? _emptyState(context)
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    itemCount: provider.messages.length +
                        (provider.isLoading ? 1 : 0),
                    itemBuilder: (_, i) {
                      if (i == provider.messages.length) {
                        return const TypingIndicator();
                      }
                      return MessageBubble(
                        message: provider.messages[i],
                        isDark: isDark,
                      );
                    },
                  ),
          ),
          if (provider.error != null)
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.red.withOpacity(0.1),
              child: Text(
                provider.error!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ),
          ChatInput(
            onSend: (text) => provider.sendMessage(text),
            disabled: provider.isLoading,
          ),
        ],
      ),
    );
  }

  Widget _emptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.auto_awesome,
            size: 64,
            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'ابدأ بسؤال...',
            style: TextStyle(
              fontSize: 18,
              color: Theme.of(context)
                  .colorScheme
                  .onSurface
                  .withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'جرّب: "اشرح لي..." أو "اكتب كود..." أو "ابحث في ملفاتي عن..."',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withOpacity(0.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
