import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SearchBarWidget extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSearch;
  final VoidCallback? onVoice;
  final VoidCallback? onScan;

  const SearchBarWidget({
    super.key,
    required this.controller,
    required this.onSearch,
    this.onVoice,
    this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 12),
          const Icon(
            Icons.search,
            color: AppTheme.textSecondary,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => onSearch(),
              style: const TextStyle(fontSize: 15),
              decoration: const InputDecoration(
                hintText: 'ابحث في الويب أو عن فيلم...',
                hintStyle: TextStyle(color: AppTheme.textMuted),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          if (onVoice != null)
            _IconBtn(
              icon: Icons.mic_none_rounded,
              onTap: onVoice!,
              color: AppTheme.secondary,
            ),
          if (onScan != null)
            _IconBtn(
              icon: Icons.qr_code_scanner_rounded,
              onTap: onScan!,
              color: AppTheme.accent,
            ),
          const SizedBox(width: 4),
        ],
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
    return Material(
      color: color.withOpacity(0.15),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: color, size: 20),
        ),
      ),
    );
  }
}
