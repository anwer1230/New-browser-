import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  final String serverUrl;
  const SettingsScreen({super.key, required this.serverUrl});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _section('الاتصال'),
          _tile(Icons.dns_outlined, 'عنوان الخادم', serverUrl),
          _tile(Icons.security_outlined, 'API Key', '••••••••'),
          const SizedBox(height: 20),
          _section('التفضيلات'),
          _tile(Icons.translate, 'لغة الترجمة', 'العربية'),
          _tile(Icons.high_quality, 'جودة الفيديو', '720p'),
          _tile(Icons.speed, 'وضع التحميل', 'سريع'),
          const SizedBox(height: 20),
          _section('حول'),
          _tile(Icons.info_outline, 'الإصدار', '1.0.0'),
          _tile(Icons.favorite_outline, 'شكرًا لاستخدامك', '❤️'),
        ],
      ),
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(
          title,
          style: const TextStyle(
            color: AppTheme.textMuted,
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
          ),
        ),
      );

  Widget _tile(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primary),
        title: Text(title, style: const TextStyle(fontSize: 14)),
        trailing: Text(value,
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
      ),
    );
  }
}
