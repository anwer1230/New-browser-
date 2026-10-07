import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  bool _uploading = false;
  String? _lastFile;
  int? _chunks;

  Future<void> _pickAndUpload() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'txt', 'md', 'docx'],
    );

    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    if (file.path == null) return;

    setState(() {
      _uploading = true;
      _lastFile = file.name;
      _chunks = null;
    });

    try {
      final res = await ApiService.uploadFile(
        filePath: file.path!,
        fileName: file.name,
      );
      setState(() {
        _chunks = res['added_chunks'] ?? 0;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ رُفع بنجاح: ${res['added_chunks']} مقطع'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ فشل: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('رفع ملف للمستندات')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 40),
            Icon(
              Icons.cloud_upload_outlined,
              size: 96,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'ارفع ملفاتك ليتمكن النظام من البحث فيها',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'PDF • DOCX • TXT • MD',
              style: TextStyle(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 40),
            if (_lastFile != null && _chunks != null)
              Card(
                color: Colors.green.withOpacity(0.1),
                child: ListTile(
                  leading: const Icon(Icons.check_circle, color: Colors.green),
                  title: Text(_lastFile!),
                  subtitle: Text('أُضيف $_chunks مقطع'),
                ),
              ),
            const Spacer(),
            FilledButton.icon(
              onPressed: _uploading ? null : _pickAndUpload,
              icon: _uploading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.upload_file),
              label: Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Text(
                  _uploading ? 'جاري الرفع...' : 'اختر ملفًا',
                  style: const TextStyle(fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
