import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DownloadsScreen extends StatelessWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('التحميلات')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.download_done_rounded,
                size: 80, color: AppTheme.textMuted),
            SizedBox(height: 16),
            Text(
              'لا توجد تحميلات بعد',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 16),
            ),
            SizedBox(height: 8),
            Text(
              'ابدأ بتحميل فيديو من شاشة الوسائط',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
