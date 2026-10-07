import 'package:flutter/material.dart';

class ChromeBottomBar extends StatelessWidget {
  final bool saved;
  final VoidCallback onBack;
  final VoidCallback onForward;
  final VoidCallback onHome;
  final VoidCallback onSave;
  final VoidCallback onOpenSaved;
  final VoidCallback onTabs;

  const ChromeBottomBar({
    super.key,
    required this.saved,
    required this.onBack,
    required this.onForward,
    required this.onHome,
    required this.onSave,
    required this.onOpenSaved,
    required this.onTabs,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: const BoxDecoration(
        color: Color(0xFFF8F9FA),
        border: Border(top: BorderSide(color: Color(0xFFE8EAED))),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _btn(Icons.arrow_back_ios_new, onBack),
            _btn(Icons.arrow_forward_ios, onForward),
            _btn(Icons.home_outlined, onHome),
            _btn(
              saved ? Icons.bookmark : Icons.bookmark_border,
              onSave,
              color: saved ? const Color(0xFF1A73E8) : const Color(0xFF5F6368),
            ),
            _btn(Icons.folder_open_outlined, onOpenSaved),
            _btn(Icons.tab_outlined, onTabs),
          ],
        ),
      ),
    );
  }

  Widget _btn(
    IconData icon,
    VoidCallback onTap, {
    Color color = const Color(0xFF5F6368),
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Icon(icon, color: color, size: 22),
      ),
    );
  }
}
