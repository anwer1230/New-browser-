// main.js - نقطة الدخول في متصفحك
import { BrowserIntegration } from './browser/omnibox-hook.js';
import { ResultsRenderer } from './ui/results-renderer.js';

// تهيئة المحرك
export const createSubtitleEngineIntegration = (config = {}) => {
  return new BrowserIntegration({
    googleApiKey: config.googleApiKey || null,
    googleCx: config.googleCx || null,
    backendProxy: config.backendProxy || 'http://localhost:3000',
    autoTranslate: true,
    ...config
  });
};

export { BrowserIntegration, ResultsRenderer };
