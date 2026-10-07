import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../models/message.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isDark;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == MessageRole.user;
    final isSystem = message.role == MessageRole.system;

    final bgColor = isUser
        ? Theme.of(context).colorScheme.primary
        : isSystem
            ? Colors.red.withOpacity(0.15)
            : (isDark ? const Color(0xFF1E293B) : Colors.white);

    final textColor = isUser
        ? Colors.white
        : (isDark ? Colors.white : Colors.black87);

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
        padding: const EdgeInsets.all(14),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.85,
        ),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 18 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 18),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isUser && !isSystem && message.experts != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Wrap(
                  spacing: 6,
                  children: message.experts!.map((e) {
                    return Chip(
                      label: Text(
                        e,
                        style: const TextStyle(fontSize: 10, color: Colors.white),
                      ),
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      padding: EdgeInsets.zero,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    );
                  }).toList(),
                ),
              ),
            if (isUser)
              SelectableText(
                message.content,
                style: TextStyle(color: textColor, fontSize: 15),
              )
            else
              MarkdownBody(
                data: message.content,
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: TextStyle(color: textColor, fontSize: 15, height: 1.6),
                  code: TextStyle(
                    backgroundColor: isDark
                        ? Colors.black26
                        : Colors.grey.shade200,
                    color: Colors.pink.shade300,
                    fontFamily: 'monospace',
                    fontSize: 13,
                  ),
                  codeblockDecoration: BoxDecoration(
                    color: isDark ? Colors.black45 : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  blockquoteDecoration: BoxDecoration(
                    color: isDark ? Colors.black26 : Colors.grey.shade100,
                    border: Border(
                      left: BorderSide(
                        color: Theme.of(context).colorScheme.primary,
                        width: 4,
                      ),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (message.elapsed != null)
                  Text(
                    '${message.elapsed!.toStringAsFixed(1)}s',
                    style: TextStyle(
                      color: textColor.withOpacity(0.5),
                      fontSize: 10,
                    ),
                  ),
                const SizedBox(width: 8),
                if (!isUser && !isSystem) ...[
                  _IconBtn(
                    icon: Icons.copy_rounded,
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: message.content));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('تم النسخ'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                    color: textColor.withOpacity(0.5),
                  ),
                  _IconBtn(
                    icon: Icons.volume_up_rounded,
                    onTap: () async {
                      final tts = FlutterTts();
                      await tts.setLanguage('ar');
                      await tts.speak(message.content);
                    },
                    color: textColor.withOpacity(0.5),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  const _IconBtn({
    required this.icon,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}
