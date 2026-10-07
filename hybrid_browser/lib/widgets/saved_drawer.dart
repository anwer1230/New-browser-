import 'package:flutter/material.dart';
import '../services/save_service.dart';

class SavedDrawer extends StatefulWidget {
  const SavedDrawer({super.key});

  @override
  State<SavedDrawer> createState() => _SavedDrawerState();
}

class _SavedDrawerState extends State<SavedDrawer> {
  final _save = SaveService();
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _save.search(_searchCtrl.text);
    if (mounted) {
      setState(() {
        _items = list;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.folder_open_outlined, color: Color(0xFF1A73E8)),
                  SizedBox(width: 10),
                  Text(
                    'المحفوظات — متاحة بدون إنترنت',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (_) => _load(),
                decoration: InputDecoration(
                  hintText: 'ابحث في المحفوظات...',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: const Color(0xFFF1F3F4),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      itemCount: _items.length,
                      itemBuilder: (_, i) {
                        final item = _items[i];
                        return ListTile(
                          leading: const Icon(Icons.article_outlined, color: Color(0xFF1A73E8)),
                          title: Text(
                            (item['title'] ?? '').toString(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            (item['url'] ?? '').toString(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          onTap: () => Navigator.pop(context, item),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
