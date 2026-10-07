import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';


function webProxyDevPlugin() {
  return {
    name: 'web-proxy-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const reqUrl = req.url || '';
        if (reqUrl.startsWith('/api/web-proxy')) {
          try {
            const parsed = new URL(reqUrl, 'http://localhost');
            const targetUrl = parsed.searchParams.get('url') || 'https://www.google.com';

            // 1. Google Home Page
            if (
              targetUrl === 'https://www.google.com' ||
              targetUrl === 'https://google.com' ||
              targetUrl === 'http://www.google.com' ||
              targetUrl === 'http://google.com' ||
              targetUrl === ''
            ) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('X-Frame-Options', 'ALLOWALL');
              res.setHeader('Content-Security-Policy', 'frame-ancestors *');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Google</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: 'Segoe UI', Tahoma, system-ui, sans-serif;
      background: #FFFFFF; color: #202124;
      display: flex; flex-direction: column; align-items: center;
      min-height: 100vh; padding-top: 8vh;
    }
    .logo {
      font-size: 52px; font-weight: 700; letter-spacing: -1px; margin-bottom: 24px;
      user-select: none;
    }
    .logo span:nth-child(1) { color: #4285F4; }
    .logo span:nth-child(2) { color: #EA4335; }
    .logo span:nth-child(3) { color: #FBBC05; }
    .logo span:nth-child(4) { color: #4285F4; }
    .logo span:nth-child(5) { color: #34A853; }
    .logo span:nth-child(6) { color: #EA4335; }
    .search-box {
      width: 90%; max-width: 584px;
      display: flex; align-items: center;
      height: 48px; padding: 0 18px;
      border: 1px solid #DFE1E5; border-radius: 24px;
      background: #fff;
      box-shadow: 0 1px 6px rgba(32,33,36,0.08);
      transition: box-shadow .2s;
    }
    .search-box:focus-within {
      box-shadow: 0 1px 8px rgba(32,33,36,0.2);
      border-color: transparent;
    }
    .search-box input {
      flex: 1; border: none; outline: none; font-size: 15px;
      color: #202124; background: transparent; padding: 0 10px;
    }
    .shortcuts {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; width: 90%; max-width: 520px; margin-top: 32px;
    }
    .shortcut {
      display: flex; flex-direction: column; align-items: center;
      text-decoration: none; color: #202124; padding: 12px 8px;
      border-radius: 12px; transition: background .15s; cursor: pointer;
    }
    .shortcut:hover { background: #F1F3F4; }
    .icon-circle {
      width: 48px; height: 48px; border-radius: 50%;
      background: #F1F3F4; display: flex; align-items: center; justify-content: center;
      font-size: 20px; margin-bottom: 8px;
    }
    .shortcut span { font-size: 12px; text-align: center; color: #3C4043; }
  </style>
</head>
<body>
  <div class="logo" dir="ltr">
    <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
  </div>
  <form class="search-box" onsubmit="handleSearch(event)">
    <span>🔍</span>
    <input id="q" type="text" placeholder="ابحث في Google أو اكتب عنوان URL" autofocus />
  </form>
  <div class="shortcuts">
    <a class="shortcut" href="https://ar.wikipedia.org/wiki/الصفحة_الرئيسية">
      <div class="icon-circle">📚</div><span>ويكيبيديا</span>
    </a>
    <a class="shortcut" href="https://news.ycombinator.com">
      <div class="icon-circle">💻</div><span>Hacker News</span>
    </a>
    <a class="shortcut" href="https://www.bbc.com/arabic">
      <div class="icon-circle">🌍</div><span>BBC عربي</span>
    </a>
    <a class="shortcut" href="https://www.google.com/search?q=أخبار+التقنية">
      <div class="icon-circle">⚡</div><span>أخبار التقنية</span>
    </a>
  </div>
  <script>
    function handleSearch(e) {
      e.preventDefault();
      var val = document.getElementById('q').value.trim();
      if (!val) return;
      var target = val.startsWith('http') ? val : (val.indexOf('.') > -1 && val.indexOf(' ') === -1 ? 'https://' + val : 'https://www.google.com/search?q=' + encodeURIComponent(val));
      window.parent.postMessage({ type: 'HYBRID_BROWSER_NAVIGATE', url: target }, '*');
    }
    document.addEventListener('click', function(e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a && a.href) {
        e.preventDefault();
        window.parent.postMessage({ type: 'HYBRID_BROWSER_NAVIGATE', url: a.href }, '*');
      }
    }, true);
  </script>
</body>
</html>`);
              return;
            }

            // 2. Fetch external site
            try {
              const fetchRes = await fetch(targetUrl, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                },
                redirect: 'follow',
              });

              let html = await fetchRes.text();
              const baseTag = `<base href="${targetUrl}">`;
              const navScript = `<script>
                document.addEventListener('click', function(e) {
                  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
                  if (a && a.href && !a.href.startsWith('javascript:')) {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'HYBRID_BROWSER_NAVIGATE', url: a.href }, '*');
                  }
                }, true);
              </script>`;

              if (/<head[^>]*>/i.test(html)) {
                html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}\n${navScript}`);
              } else {
                html = `${baseTag}\n${navScript}\n${html}`;
              }

              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('X-Frame-Options', 'ALLOWALL');
              res.setHeader('Content-Security-Policy', 'frame-ancestors *');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(html);
              return;
            } catch {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('X-Frame-Options', 'ALLOWALL');
              res.setHeader('Content-Security-Policy', 'frame-ancestors *');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${targetUrl}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px 20px; text-align: center; background: #F8F9FA; color: #202124; }
    .card { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    h2 { font-size: 20px; margin-bottom: 12px; }
    p { font-size: 14px; color: #5F6368; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: #1A73E8; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🌐 الموقع يمنع العرض المباشر</h2>
    <p>يتطلب هذا الموقع (${targetUrl}) فتحه في تبويب مستقل بسبب سياسات الحماية.</p>
    <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn">فتح الموقع في تبويب جديد ↗</a>
  </div>
</body>
</html>`);
              return;
            }
          } catch {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Proxy error');
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      webProxyDevPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'AnwerBrowser',
          short_name: 'AnwerBrowser',
          description:
            'نظام ذكاء اصطناعي هجين وتصفح ذكي بدون إنترنت مع حماية VPN وتحميل الوسائط',
          theme_color: '#1A73E8',
          background_color: '#F8F9FA',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
