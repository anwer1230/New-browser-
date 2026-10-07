import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _urlController = TextEditingController();
  final _keyController = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    _urlController.text = await StorageService.getServerUrl();
    _keyController.text = await StorageService.getApiKey();
    setState(() {});
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await StorageService.setServerUrl(_urlController.text.trim());
    await StorageService.setApiKey(_keyController.text.trim());

    // اختبار الاتصال
    try {
      await ApiService.health();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ تم الحفظ والاتصال ناجح'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('⚠️ تم الحفظ لكن الاتصال فشل: $e'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
    setState(() => _saving = false);
  }

  @override
  void dispose() {
    _urlController.dispose();
    _keyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'اتصال الخادم',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _urlController,
                    decoration: const InputDecoration(
                      labelText: 'عنوان الخادم',
                      hintText: 'http://192.168.1.100:8000',
                      prefixIcon: Icon(Icons.link),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _keyController,
                    decoration: const InputDecoration(
                      labelText: 'API Key (اختياري)',
                      prefixIcon: Icon(Icons.key),
                      border: OutlineInputBorder(),
                    ),
                    obscureText: true,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _saving ? null : _save,
                    icon: _saving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.save),
                    label: Text(_saving ? 'جاري الحفظ...' : 'حفظ واختبار'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '💡 مساعدة',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '• للجهاز نفسه: http://localhost:8000\n'
                    '• لمحاكي Android: http://10.0.2.2:8000\n'
                    '• لجهاز آخر في الشبكة: http://<IP>:8000\n'
                    '• عبر الإنترنت: https://your-domain.com',
                    style: TextStyle(height: 1.6, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
