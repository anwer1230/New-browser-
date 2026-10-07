import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'services/background_service.dart';
import 'services/save_service.dart';
import 'services/vpn_service.dart';
import 'services/offline_service.dart';

class BrowserScreen extends StatefulWidget {
  const BrowserScreen({super.key});

  @override
  State<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends State<BrowserScreen> {
  // ═══ WebView ═══
  late final WebViewController _webView;
  final _urlController = TextEditingController();
  final _urlFocus = FocusNode();

  // ═══ الحالة ═══
  double _progress = 0;
  String _currentUrl = '';
  String _currentTitle = '';
  bool _loading = false;
  bool _saved = false;
  final bool _showBottomBar = true;

  // ═══ الخدمات (تعمل في الخلفية) ═══
  final _bg = BackgroundService();
  final _save = SaveService();
  final _vpn = VpnService();

  @override
  void initState() {
    super.initState();

    // تهيئة WebView
    _webView = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (p) => setState(() => _progress = p / 100),
        onPageStarted: _onPageStarted,
        onPageFinished: _onPageFinished,
        onWebResourceError: (_) => setState(() => _loading = false),
        onNavigationRequest: (req) {
          // كل التنقلات داخل WebView
          return NavigationDecision.navigate;
        },
      ))
      ..addJavaScriptChannel(
        'SaveChannel',
        onMessageReceived: _onJsMessage,
      )
      ..loadRequest(Uri.parse('https://www.google.com'));

    // ═══ تشغيل الخدمات بصمت ═══
    _vpn.autoConnect().then((_) {
      if (mounted) setState(() {});
    }); // VPN يعمل تلقائيًا
    _injectAutoTranslateScript(); // الترجمة تعمل بصمت
  }

  // ═══════════════════════════════════════════════════════════
  // الأحداث
  // ═══════════════════════════════════════════════════════════
  void _onPageStarted(String url) {
    setState(() {
      _loading = true;
      _currentUrl = url;
      _urlController.text = url;
      _saved = false;
    });
  }

  void _onPageFinished(String url) async {
    setState(() => _loading = false);

    // جلب عنوان الصفحة
    try {
      final title = await _webView.runJavaScriptReturningResult(
        'document.title',
      );
      _currentTitle = title.toString().replaceAll('"', '');
    } catch (_) {}

    // ═══ تطبيق الترجمة التلقائية في الخلفية ═══
    if (_bg.autoTranslate) {
      _autoTranslatePage();
    }
  }

  void _onJsMessage(JavaScriptMessage msg) {
    // استقبل المحتوى من JS عند طلب الحفظ
    if (msg.message.isNotEmpty) {
      _performSave(msg.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // الترجمة التلقائية (تعمل بصمت)
  // ═══════════════════════════════════════════════════════════
  Future<void> _injectAutoTranslateScript() async {
    // لا شيء هنا — الترجمة تطبق عند اكتمال كل صفحة
  }

  Future<void> _autoTranslatePage() async {
    // نتحقق أولاً: هل الصفحة إنجليزية؟
    try {
      final lang = await _webView.runJavaScriptReturningResult(
        'document.documentElement.lang || "unknown"',
      );
      final langStr = lang.toString().replaceAll('"', '').toLowerCase();

      // إن كانت عربية، لا نترجم
      if (langStr.startsWith('ar')) return;

      // ابدأ الترجمة بصمت (بدون إظهار أي شيء)
      await _webView.runJavaScript('''
        (function() {
          // ضع مؤشر صغير أعلى الصفحة
          if (document.getElementById('__ai_translating')) return;
          var badge = document.createElement('div');
          badge.id = '__ai_translating';
          badge.style.cssText = 'position:fixed;top:0;left:0;right:0;height:2px;'
            + 'background:linear-gradient(90deg,#1A73E8,#8B5CF6);z-index:999999;'
            + 'animation:__ai_pulse 1.5s ease-in-out infinite;';
          document.body.appendChild(badge);

          var style = document.createElement('style');
          style.textContent = '@keyframes __ai_pulse{0%,100%{opacity:.4}50%{opacity:1}}';
          document.head.appendChild(style);
        })();
      ''');

      // ترجمة تلقائية صامتة للنصوص
      await _translateCurrentPage(silent: true);
    } catch (_) {}
  }

  /// ترجمة عند الطلب من المستخدم (زر في القائمة) أو بصمت في الخلفية
  Future<void> _translateCurrentPage({bool silent = false}) async {
    if (!_bg.autoTranslate && silent) return;
    if (!silent && !_bg.autoTranslate) {
      _snack('الترجمة التلقائية معطّلة');
      return;
    }

    if (!silent) _snack('🌐 جاري الترجمة في الخلفية...');

    try {
      // 1. استخرج النص الأساسي من الصفحة
      final result = await _webView.runJavaScriptReturningResult('''
        (function() {
          var els = document.querySelectorAll('p, h1, h2, h3, h4, li, td');
          var out = [];
          for (var i = 0; i < els.length && i < 80; i++) {
            var t = els[i].innerText.trim();
            if (t.length > 15 && t.length < 800) out.push(t);
          }
          return out.join('\\n<<<S>>>\\n');
        })();
      ''');

      var text = result.toString();
      // نظّف JSON escaping
      text = text.replaceFirst(RegExp(r'^"'), '').replaceFirst(RegExp(r'"$'), '');
      text = text.replaceAll(r'\n', '\n').replaceAll(r'\"', '"');

      if (text.length < 30) {
        if (!silent) _snack('لا يوجد محتوى كافٍ للترجمة');
        return;
      }

      // 2. أرسل للخادم للترجمة (دفعة واحدة)
      final translated = await _bg.translate(text);

      // 3. طبّق الترجمة على الصفحة
      final jsonTranslated = Uri.encodeComponent(translated);
      await _webView.runJavaScript('''
        (function() {
          var translated = decodeURIComponent('$jsonTranslated');
          var parts = translated.split('\\n<<<S>>>\\n');
          var els = document.querySelectorAll('p, h1, h2, h3, h4, li, td');
          for (var i = 0; i < els.length && i < parts.length; i++) {
            var t = els[i].innerText.trim();
            if (t.length > 15 && t.length < 800) {
              els[i].innerText = parts[i].trim();
            }
          }
          var badge = document.getElementById('__ai_translating');
          if (badge) badge.remove();
        })();
      ''');

      if (!silent) _snack('✅ تمت الترجمة');
    } catch (e) {
      if (!silent) _snack('تعذّرت الترجمة');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // الحفظ (زر 💾)
  // ═══════════════════════════════════════════════════════════
  Future<void> _saveCurrentPage() async {
    if (_saved) {
      _snack('تم حفظها سابقًا');
      return;
    }

    _snack('💾 جاري الحفظ...');

    try {
      // استخرج النص الكامل من الصفحة
      final text = await _webView.runJavaScriptReturningResult('''
        document.body ? document.body.innerText : ''
      ''');

      var content = text.toString();
      content = content.replaceFirst(RegExp(r'^"'), '').replaceFirst(RegExp(r'"$'), '');
      content = content.replaceAll(r'\n', '\n').replaceAll(r'\"', '"');

      await _save.savePage(
        url: _currentUrl,
        title: _currentTitle.isNotEmpty ? _currentTitle : _currentUrl,
        content: content,
      );

      setState(() => _saved = true);
      _snack('✅ تم الحفظ — متاح offline');
    } catch (e) {
      _snack('تعذّر الحفظ');
    }
  }

  Future<void> _performSave(String content) async {
    await _save.savePage(
      url: _currentUrl,
      title: _currentTitle,
      content: content,
    );
    setState(() => _saved = true);
  }

  // ═══════════════════════════════════════════════════════════
  // التنقل
  // ═══════════════════════════════════════════════════════════
  void _navigate(String input) {
    final text = input.trim();
    if (text.isEmpty) return;

    String url;
    if (text.startsWith('http://') || text.startsWith('https://')) {
      url = text;
    } else if (text.contains('.') && !text.contains(' ')) {
      url = 'https://$text';
    } else {
      url = 'https://www.google.com/search?q=${Uri.encodeComponent(text)}';
    }

    _webView.loadRequest(Uri.parse(url));
    _urlFocus.unfocus();
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg, style: const TextStyle(fontSize: 13)),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF202124),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        margin: const EdgeInsets.all(12),
      ));
  }

  // ═══════════════════════════════════════════════════════════
  // الدرج الجانبي — المحفوظات (يعمل offline)
  // ═══════════════════════════════════════════════════════════
  void _openSavedDrawer() {
    showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _SavedBottomSheet(),
    ).then((item) async {
      if (item != null) {
        final html = await OfflineService.buildOfflineHtml(
          title: (item['title'] ?? '').toString(),
          url: (item['url'] ?? '').toString(),
          content: (item['content'] ?? '').toString(),
        );
        setState(() {
          _currentUrl = (item['url'] ?? '').toString();
          _currentTitle = (item['title'] ?? '').toString();
          _urlController.text = _currentUrl;
          _saved = true;
        });
        await _webView.loadHtmlString(html);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // قائمة الخيارات (⋮)
  // ═══════════════════════════════════════════════════════════
  void _openMenu() async {
    final savedTotal = await _save.count();
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            _menuTile(
              icon: Icons.translate,
              title: 'ترجمة الصفحة للعربية',
              subtitle: _bg.autoTranslate ? 'الترجمة التلقائية مفعّلة' : 'معطّلة',
              onTap: () {
                Navigator.pop(ctx);
                _translateCurrentPage();
              },
            ),
            _menuTile(
              icon: _bg.autoTranslate
                  ? Icons.check_circle
                  : Icons.radio_button_unchecked,
              title: 'الترجمة التلقائية',
              subtitle: _bg.autoTranslate ? 'تعمل بصمت' : 'معطّلة',
              onTap: () {
                setState(() => _bg.autoTranslate = !_bg.autoTranslate);
                Navigator.pop(ctx);
                _snack(_bg.autoTranslate ? 'الترجمة التلقائية مفعّلة' : 'معطّلة');
              },
            ),
            _menuTile(
              icon: Icons.bookmark_add_outlined,
              title: 'حفظ هذه الصفحة',
              subtitle: 'لقراءتها بدون إنترنت',
              onTap: () {
                Navigator.pop(ctx);
                _saveCurrentPage();
              },
            ),
            _menuTile(
              icon: Icons.shield_moon_outlined,
              title: 'حماية VPN',
              subtitle: _vpn.isConnected
                  ? 'متصل • ${_vpn.location}'
                  : 'غير مفعّل',
              onTap: () async {
                await _vpn.toggle();
                setState(() {});
                if (ctx.mounted) Navigator.pop(ctx);
              },
            ),
            _menuTile(
              icon: Icons.history,
              title: 'المحفوظات',
              subtitle: '$savedTotal عنصر محفوظ',
              onTap: () {
                Navigator.pop(ctx);
                _openSavedDrawer();
              },
            ),
            _menuTile(
              icon: Icons.auto_awesome,
              title: 'سؤال AI',
              subtitle: 'اسأل عن محتوى الصفحة',
              onTap: () {
                Navigator.pop(ctx);
                _askAboutPage();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _menuTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF1A73E8)),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      onTap: onTap,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // سؤال AI عن الصفحة
  // ═══════════════════════════════════════════════════════════
  Future<void> _askAboutPage() async {
    final ctrl = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('اسأل AI'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'مثال: لخّص لي هذه الصفحة',
            border: OutlineInputBorder(),
          ),
          onSubmitted: (v) => Navigator.pop(ctx, v),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text),
            child: const Text('اسأل'),
          ),
        ],
      ),
    );

    if (result == null || result.trim().isEmpty) return;

    _snack('🤔 جاري التحليل...');

    try {
      final pageText = await _webView.runJavaScriptReturningResult(
        'document.body ? document.body.innerText.substring(0, 3000) : ""',
      );
      final context_ = pageText
          .toString()
          .replaceFirst(RegExp(r'^"'), '')
          .replaceFirst(RegExp(r'"$'), '')
          .replaceAll(r'\n', '\n')
          .replaceAll(r'\"', '"');

      final answer = await _bg.askAI(
        'بناءً على محتوى الصفحة:\n$context_\n\nالسؤال: $result',
      );

      if (answer != null && mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('الإجابة'),
            content: SingleChildScrollView(child: Text(answer)),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('حسنًا'),
              ),
            ],
          ),
        );
      } else {
        _snack('تعذّر الحصول على إجابة');
      }
    } catch (e) {
      _snack('خطأ');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // واجهة المستخدم
  // ═══════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // شريط التقدم
          if (_loading || _progress < 1)
            SizedBox(
              height: 2,
              child: LinearProgressIndicator(
                value: _progress,
                backgroundColor: Colors.transparent,
                valueColor:
                    const AlwaysStoppedAnimation(Color(0xFF1A73E8)),
                minHeight: 2,
              ),
            ),
          // WebView
          Expanded(
            child: WebViewWidget(controller: _webView),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  // ─────────────────────────────────────────────────
  // شريط Chrome العلوي
  // ─────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar() {
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
            // أيقونة القفل/الحماية
            Icon(
              _vpn.isConnected
                  ? Icons.shield
                  : Icons.lock_outline,
              size: 16,
              color: _vpn.isConnected
                  ? const Color(0xFF10B981)
                  : const Color(0xFF5F6368),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _urlController,
                focusNode: _urlFocus,
                textInputAction: TextInputAction.go,
                onSubmitted: _navigate,
                onTap: () {
                  _urlController.selection = TextSelection(
                    baseOffset: 0,
                    extentOffset: _urlController.text.length,
                  );
                },
                style: const TextStyle(fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'ابحث أو اكتب عنوانًا',
                  hintStyle:
                      TextStyle(fontSize: 14, color: Color(0xFF80868B)),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ),
            if (_urlFocus.hasFocus)
              GestureDetector(
                onTap: () {
                  _urlController.clear();
                },
                child: const Icon(Icons.close,
                    size: 18, color: Color(0xFF5F6368)),
              )
            else
              const Icon(Icons.mic_none,
                  size: 20, color: Color(0xFF5F6368)),
          ],
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.more_vert, color: Color(0xFF5F6368)),
          onPressed: _openMenu,
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────────
  // الشريط السفلي (مثل Chrome)
  // ─────────────────────────────────────────────────
  Widget? _buildBottomBar() {
    if (!_showBottomBar) return null;

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
            _bottomBtn(
              icon: Icons.arrow_back_ios_new,
              onTap: () async {
                if (await _webView.canGoBack()) {
                  _webView.goBack();
                }
              },
            ),
            _bottomBtn(
              icon: Icons.arrow_forward_ios,
              onTap: () async {
                if (await _webView.canGoForward()) {
                  _webView.goForward();
                }
              },
            ),
            _bottomBtn(
              icon: Icons.home_outlined,
              onTap: () {
                _webView.loadRequest(
                  Uri.parse('https://www.google.com'),
                );
              },
            ),
            // زر الحفظ
            _bottomBtn(
              icon: _saved
                  ? Icons.bookmark
                  : Icons.bookmark_border,
              color: _saved
                  ? const Color(0xFF1A73E8)
                  : const Color(0xFF5F6368),
              onTap: _saveCurrentPage,
            ),
            // زر المحفوظات
            _bottomBtn(
              icon: Icons.folder_open_outlined,
              onTap: _openSavedDrawer,
            ),
            _bottomBtn(
              icon: Icons.tab_outlined,
              onTap: () {
                _snack('تبويبات متعددة قريبًا');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _bottomBtn({
    required IconData icon,
    required VoidCallback onTap,
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

  @override
  void dispose() {
    _urlController.dispose();
    _urlFocus.dispose();
    _vpn.dispose();
    super.dispose();
  }
}

// ═══════════════════════════════════════════════════════════
// Bottom Sheet المحفوظات — يعمل offline
// ═══════════════════════════════════════════════════════════
class _SavedBottomSheet extends StatefulWidget {
  const _SavedBottomSheet();

  @override
  State<_SavedBottomSheet> createState() => _SavedBottomSheetState();
}

class _SavedBottomSheetState extends State<_SavedBottomSheet> {
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
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // مقبض
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // العنوان
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.folder_open_outlined,
                      color: Color(0xFF1A73E8)),
                  SizedBox(width: 10),
                  Text(
                    'المحفوظات — متاحة بدون إنترنت',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            // شريط البحث
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
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
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 12),
            // القائمة
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _items.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.inbox_outlined,
                                  size: 60, color: Colors.grey),
                              SizedBox(height: 12),
                              Text(
                                'لا يوجد محتوى محفوظ',
                                style: TextStyle(color: Colors.grey),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'احفظ الصفحات لقراءتها بدون إنترنت',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          controller: scrollCtrl,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: _items.length,
                          itemBuilder: (_, i) {
                            final item = _items[i];
                            return Card(
                              elevation: 0,
                              margin: const EdgeInsets.symmetric(
                                  vertical: 4, horizontal: 4),
                              color: const Color(0xFFF8F9FA),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: const BorderSide(
                                    color: Color(0xFFE8EAED)),
                              ),
                              child: ListTile(
                                leading: const Icon(
                                  Icons.article_outlined,
                                  color: Color(0xFF1A73E8),
                                ),
                                title: Text(
                                  item['title'] ?? '',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600),
                                ),
                                subtitle: Text(
                                  item['url'] ?? '',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 11, color: Colors.grey),
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      size: 20, color: Colors.grey),
                                  onPressed: () async {
                                    await _save.delete(item['id']);
                                    _load();
                                  },
                                ),
                                onTap: () {
                                  // افتح عرض القراءة offline
                                  Navigator.pop(context, item);
                                },
                              ),
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
