import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';

class BrowserScreen extends StatefulWidget {
  final String? initialUrl;
  const BrowserScreen({super.key, this.initialUrl});

  @override
  State<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends State<BrowserScreen> {
  late final WebViewController _controller;
  final _urlController = TextEditingController();
  double _progress = 0;

  @override
  void initState() {
    super.initState();
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
    _controller.loadRequest(Uri.parse(url));
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
        bottom: _progress < 1
            ? PreferredSize(
                preferredSize: const Size.fromHeight(2),
                child: LinearProgressIndicator(
                  value: _progress,
                  backgroundColor: Colors.transparent,
                  valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                ),
              )
            : null,
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
