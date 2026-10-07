/// خدمة قراءة الصفحات المحفوظة offline
class OfflineService {
  static Future<String> buildOfflineHtml({
    required String title,
    required String url,
    required String content,
  }) async {
    return '''
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$title</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #202124;
      background: #fff;
    }
    .banner {
      background: #E8F0FE;
      color: #1967D2;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 13px;
    }
    h1 { color: #202124; font-size: 24px; }
    a { color: #1A73E8; }
    .source { color: #5F6368; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="banner">
    📖 نسخة محفوظة للقراءة بدون إنترنت
  </div>
  <h1>$title</h1>
  <div class="content">${content.replaceAll('\n', '<br>')}</div>
  <div class="source">المصدر: $url</div>
</body>
</html>
''';
  }
}
