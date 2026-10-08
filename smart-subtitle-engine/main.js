// main.js - نقطة الدخول في متصفحك
import { BrowserIntegration } from './browser/omnibox-hook.js';
import { ResultsRenderer } from './ui/results-renderer.js';

// تهيئة المحرك
export const integration = new BrowserIntegration({
  googleApiKey: 'YOUR_API_KEY',
  googleCx: 'YOUR_CX',
  backendProxy: 'http://localhost:3000',
  autoTranslate: true
});

// عند ضغط Enter في شريط العنوان
export async function onOmniboxSubmit(query) {
  const result = await integration.handleOmniboxInput(query);
  
  switch (result.action) {
    case 'navigate':
      if (typeof webView !== 'undefined' && webView.loadUrl) {
        webView.loadUrl(result.url);
      } else if (typeof window !== 'undefined') {
        window.location.href = result.url;
      }
      break;
    
    case 'show_subtitles':
      // اعرض النتائج المخصصة
      if (typeof document !== 'undefined') {
        const container = document.getElementById('results') || document.getElementById('results-container');
        if (container) {
          const renderer = new ResultsRenderer(container);
          renderer.render(result.data);
        }
      }
      break;
    
    case 'show':
      // اعرض الترجمات + نتائج الويب
      if (typeof showResults === 'function') {
        showResults(result.subtitles, result.webResults);
      }
      break;
  }
}

// ربط الحدث
if (typeof document !== 'undefined') {
  const omniboxInput = document.getElementById('omnibox');
  if (omniboxInput) {
    omniboxInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        onOmniboxSubmit(e.target.value);
      }
    });
  }
}

export { BrowserIntegration, ResultsRenderer };
