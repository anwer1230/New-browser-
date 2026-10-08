import { BrowserIntegration } from './omnibox-hook.js';
import { ResultsRenderer } from '../ui/results-renderer.js';

/**
 * حقن واجهة البحث في WebView
 * يعمل مع: Android WebView, iOS WKWebView, Electron
 */
export class WebViewInjector {
  constructor(webView, config) {
    this.webView = webView;
    this.integration = new BrowserIntegration(config);
  }

  /**
   * اعتراض التنقل في WebView
   */
  interceptNavigation() {
    // Android
    if (typeof this.webView.setWebViewClient === 'function') {
      this.webView.setWebViewClient({
        shouldOverrideUrlLoading: (view, request) => {
          const url = request.getUrl().toString();
          return this.handleUrl(url);
        }
      });
    }

    // iOS WKWebView
    if (typeof this.webView.navigationDelegate === 'object') {
      this.webView.navigationDelegate = {
        decidePolicyForNavigationAction: (webView, action, decisionHandler) => {
          const url = action.request.URL.absoluteString;
          this.handleUrl(url);
          decisionHandler(1); // Allow
        }
      };
    }
  }

  async handleUrl(url) {
    // إذا كان بحث Google، اعرض النتائج المخصصة بدلاً منها
    if (url.includes('google.com/search')) {
      const params = new URL(url).searchParams;
      const query = params.get('q');
      if (query) {
        const result = await this.integration.handleOmniboxInput(query);
        if (result.action === 'show_subtitles') {
          this.renderResults(result.data);
          return false; // منع التنقل
        }
      }
    }
    return true; // اسمح بالتنقل
  }

  renderResults(data) {
    const container = document.getElementById('results-container');
    if (container) {
      const renderer = new ResultsRenderer(container);
      renderer.render(data);
    }
  }

  /**
   * حقن سكريبت في الصفحة
   */
  injectScript(script) {
    if (typeof this.webView.evaluateJavascript === 'function') {
      this.webView.evaluateJavascript(script, null);
    }
  }
}
