import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import '../theme/app_theme.dart';
import '../services/media_api.dart';
import 'media_search_screen.dart';

class BrowserScreen extends StatefulWidget {
  final String? initialUrl;
  final int initialTabIndex;
  const BrowserScreen({
    super.key,
    this.initialUrl,
    this.initialTabIndex = 0,
  });

  @override
  State<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends State<BrowserScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  late final WebViewController _controller;
  final _urlController = TextEditingController();
  final _aiPromptCtrl = TextEditingController(
    text: 'أريد البحث عن أفضل الأفلام العلمية حول الفضاء والثقوب السوداء مع ترجمة عربية',
  );

  double _progress = 0;
  bool _aiLoading = false;
  bool _autoWriting = false;
  String _aiReportAr = '';
  List<String> _aiQueries = [
    'Interstellar 2014 Kip Thorne Wormhole Science',
    'Sintel Open Movie Fantasy Adventure 4K',
    'Black Hole Gargantua Gravitational Time Dilation',
  ];
  List<Map<String, dynamic>> _suggestedSites = [];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (p) => setState(() => _progress = p / 100),
        onPageStarted: (url) => setState(() => _urlController.text = url),
      ))
      ..loadRequest(
        Uri.parse(widget.initialUrl ?? 'https://www.google.com'),
      );
  }

  void _navigate(String input) {
    String url = input.trim();
    if (url.isEmpty) return;
    if (!url.startsWith('http')) {
      if (url.contains('.') && !url.contains(' ')) {
        url = 'https://$url';
      } else {
        url = 'https://www.google.com/search?q=${Uri.encodeComponent(url)}';
      }
    }
    _tabCtrl.animateTo(0);
    _controller.loadRequest(Uri.parse(url));
  }

  /// جعل الذكاء الاصطناعي يكتب للمستخدم ما يريد أن يبحث عنه تلقائياً
  Future<void> _autoWriteSearchPrompt(String category) async {
    setState(() => _autoWriting = true);
    try {
      final base = await MediaApi.getServer();
      final res = await http
          .post(
            Uri.parse('$base/api/ai-browse'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'prompt': _aiPromptCtrl.text,
              'category': category,
              'autoWriteOnly': true,
            }),
          )
          .timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        setState(() {
          _aiPromptCtrl.text = (data['written_prompt_ar'] ?? '').toString();
          if (data['generated_queries'] is List) {
            _aiQueries = List<String>.from(data['generated_queries']);
          }
        });
      }
    } catch (_) {
      setState(() {
        _aiPromptCtrl.text =
            'أبحث عن وثائقيات وأفلام خيال علمي تشرح فيزياء الثقوب السوداء والسفر عبر الزمن مع ترجمة عربية دقيقة.';
      });
    } finally {
      if (mounted) setState(() => _autoWriting = false);
    }
  }

  /// تنفيذ التصفح بالذكاء الاصطناعي وجلب الملخص المترجم والمواقع والفيديوهات
  Future<void> _executeAiBrowse() async {
    final topic = _aiPromptCtrl.text.trim();
    if (topic.isEmpty) return;
    setState(() => _aiLoading = true);
    try {
      final base = await MediaApi.getServer();
      final res = await http
          .post(
            Uri.parse('$base/api/ai-browse'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'prompt': topic}),
          )
          .timeout(const Duration(seconds: 30));

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        setState(() {
          _aiReportAr = (data['report_ar'] ?? '').toString();
          if (data['generated_queries'] is List) {
            _aiQueries = List<String>.from(data['generated_queries']);
          }
          if (data['suggested_sites'] is List) {
            _suggestedSites =
                List<Map<String, dynamic>>.from(data['suggested_sites']);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر الاتصال بمحرك التصفح الذكي: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _aiLoading = false);
    }
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _urlController.dispose();
    _aiPromptCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
          ),
          child: TextField(
            controller: _urlController,
            textInputAction: TextInputAction.go,
            onSubmitted: _navigate,
            style: const TextStyle(fontSize: 13),
            decoration: const InputDecoration(
              hintText: 'ابحث أو اكتب عنوانًا...',
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Column(
            children: [
              TabBar(
                controller: _tabCtrl,
                indicatorColor: AppTheme.primary,
                labelColor: AppTheme.textPrimary,
                unselectedLabelColor: AppTheme.textSecondary,
                tabs: const [
                  Tab(
                    text: '🌐 متصفح الويب',
                  ),
                  Tab(
                    text: '🤖 تصفح بالذكاء الاصطناعي',
                  ),
                ],
              ),
              if (_progress < 1 && _tabCtrl.index == 0)
                LinearProgressIndicator(
                  value: _progress,
                  minHeight: 2,
                  backgroundColor: Colors.transparent,
                  valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                ),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          // ═══ التبويب 1: WebView المباشر ═══
          WebViewWidget(controller: _controller),

          // ═══ التبويب 2: تصفح بالذكاء الاصطناعي (يكتب لك ما تريد أن تبحث) ═══
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.auto_awesome_rounded,
                              color: AppTheme.secondary, size: 22),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'تصفح بالذكاء الاصطناعي (يكتب لك ما تريد أن تبحث عنه)',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'اضغط على "اكتب لي ما أبحث عنه" ليقوم محرك Groq بصياغة طلب البحث المثالي وترجمة النتائج واستخراج الفيديوهات.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // أزرار الصياغة التلقائية
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: _autoWriting
                                ? null
                                : () => _autoWriteSearchPrompt('أفلام وخيال علمي'),
                            icon: const Icon(Icons.edit_note_rounded, size: 16),
                            label: Text(_autoWriting
                                ? 'جاري الكتابة...'
                                : '✍️ اكتب لي بحثاً عن أفلام ووثائقيات'),
                          ),
                          OutlinedButton.icon(
                            onPressed: _autoWriting
                                ? null
                                : () => _autoWriteSearchPrompt('علوم وتقنية'),
                            icon: const Icon(Icons.science_outlined, size: 16),
                            label: const Text('✍️ اكتب لي بحثاً علمياً وتقنياً'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      TextField(
                        controller: _aiPromptCtrl,
                        maxLines: 3,
                        style: const TextStyle(fontSize: 13),
                        decoration: InputDecoration(
                          hintText:
                              'اكتب فكرتك أو دع الذكاء الاصطناعي يكتب لك ما تبحث عنه...',
                          filled: true,
                          fillColor: AppTheme.bgDark,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppTheme.border),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _aiLoading ? null : _executeAiBrowse,
                              icon: _aiLoading
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.travel_explore_rounded),
                              label: Text(_aiLoading
                                  ? 'جاري التصفح والترجمة بالذكاء الاصطناعي...'
                                  : 'توليد البحث وتصفح النتائج المترجمة'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // عبارات البحث التي صاغها الذكاء الاصطناعي
                const Text(
                  '🎯 عبارات البحث المصاغة بالذكاء الاصطناعي (اضغط للتصفح أو البحث):',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _aiQueries.map((q) {
                    return ActionChip(
                      backgroundColor: AppTheme.bgCard,
                      side: const BorderSide(color: AppTheme.border),
                      avatar: const Icon(Icons.search,
                          size: 15, color: AppTheme.accent),
                      label: Text(
                        q,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MediaSearchScreen(initialQuery: q),
                          ),
                        );
                      },
                    );
                  }).toList(),
                ),

                if (_aiReportAr.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '📄 ملخص التصفح الذكي المترجم للعربية:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.accent,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _aiReportAr,
                          style: const TextStyle(
                            fontSize: 13,
                            height: 1.6,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                if (_suggestedSites.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    '🌐 مواقع مقترحة جاهزة للفتح في المتصفح:',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ..._suggestedSites.map(
                    (site) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.public, color: AppTheme.primary),
                        title: Text(
                          (site['title'] ?? '').toString(),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        subtitle: Text(
                          (site['description_ar'] ?? '').toString(),
                          style: const TextStyle(fontSize: 11),
                        ),
                        trailing: const Icon(Icons.open_in_new, size: 18),
                        onTap: () => _navigate((site['url'] ?? '').toString()),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
