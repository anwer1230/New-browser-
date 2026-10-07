import 'package:flutter/material.dart';

class ChromeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final TextEditingController urlController;
  final FocusNode urlFocus;
  final bool vpnConnected;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onOpenMenu;

  const ChromeAppBar({
    super.key,
    required this.urlController,
    required this.urlFocus,
    required this.vpnConnected,
    required this.onSubmitted,
    required this.onOpenMenu,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: const Color(0xFFF8F9FA),
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      automaticallyImplyLeading: false,
      titleSpacing: 8,
      title: Container(
        height: 42,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFDADCE0)),
        ),
        child: Row(
          children: [
            Icon(
              vpnConnected ? Icons.shield : Icons.lock_outline,
              size: 16,
              color: vpnConnected
                  ? const Color(0xFF10B981)
                  : const Color(0xFF5F6368),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: urlController,
                focusNode: urlFocus,
                textInputAction: TextInputAction.go,
                onSubmitted: onSubmitted,
                style: const TextStyle(fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'ابحث أو اكتب عنوانًا',
                  hintStyle: TextStyle(fontSize: 14, color: Color(0xFF80868B)),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.more_vert, color: Color(0xFF5F6368)),
          onPressed: onOpenMenu,
        ),
      ],
    );
  }
}
