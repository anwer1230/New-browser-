/**
 * عرض النتائج في المتصفح بتصميم مخصص
 */
export class ResultsRenderer {
  constructor(container) {
    this.container = container;
  }

  render(data) {
    const { intent, grouped, autoTranslated, elapsed, total } = data;
    
    this.container.innerHTML = `
      <div class="sse-header">
        <div class="sse-intent">
          <span class="sse-badge">🎯 ${intent.codes.length} كود</span>
          ${intent.codes.map(c => 
            `<span class="sse-code">${c.value}</span>`
          ).join('')}
        </div>
        <div class="sse-meta">
          <span>⏱️ ${elapsed}ms</span>
          <span>📊 ${total} نتيجة</span>
        </div>
      </div>

      ${autoTranslated ? `
        <div class="sse-notice">
          ⚠️ لم يتم العثور على ترجمة عربية. تمت الترجمة آلياً من:
          <strong>${autoTranslated.source.title}</strong>
        </div>
      ` : ''}

      ${grouped.arabicSubtitles.length > 0 ? this.renderGroup(
        '🇸🇦 ترجمات عربية', grouped.arabicSubtitles, 'arabic'
      ) : ''}

      ${grouped.subtitleSites.length > 0 ? this.renderGroup(
        '📁 مواقع الترجمات', grouped.subtitleSites, 'subtitle'
      ) : ''}

      ${grouped.videoPlayers.length > 0 ? this.renderGroup(
        '🎬 مشغلات فيديو', grouped.videoPlayers, 'video'
      ) : ''}

      ${grouped.generalWeb.length > 0 ? this.renderGroup(
        '🌐 نتائج ويب', grouped.generalWeb, 'web'
      ) : ''}
    `;

    this.attachHandlers();
  }

  renderGroup(title, results, type) {
    return `
      <div class="sse-group" data-type="${type}">
        <h3 class="sse-group-title">${title} <span class="sse-count">${results.length}</span></h3>
        <div class="sse-cards">
          ${results.map(r => this.renderCard(r, type)).join('')}
        </div>
      </div>
    `;
  }

  renderCard(result, type) {
    const domain = result.displayLink || new URL(result.url).hostname;
    
    return `
      <div class="sse-card" data-url="${result.url}">
        <div class="sse-card-header">
          <span class="sse-domain">${domain}</span>
          ${result.isArabic ? '<span class="sse-badge-ar">عربي</span>' : ''}
        </div>
        <a href="${result.url}" class="sse-card-title" target="_blank">
          ${result.title}
        </a>
        ${result.snippet ? `
          <p class="sse-card-snippet">${result.snippet}</p>
        ` : ''}
        <div class="sse-card-footer">
          ${result.downloads ? `<span>⬇️ ${result.downloads}</span>` : ''}
          ${result.rating ? `<span>⭐ ${result.rating}</span>` : ''}
          ${result.code ? `<span class="sse-code-small">${result.code}</span>` : ''}
        </div>
      </div>
    `;
  }

  attachHandlers() {
    this.container.querySelectorAll('.sse-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') return;
        const url = card.dataset.url;
        window.open(url, '_blank');
      });
    });
  }
}
