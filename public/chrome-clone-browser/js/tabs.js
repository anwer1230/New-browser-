/**
 * إدارة التبويبات (مثل كروم)
 */
export class TabManager {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.container = document.getElementById('tabsContainer');
    this.nextId = 1;
  }

  createTab(url = null, title = 'تبويب جديد') {
    const tab = {
      id: this.nextId++,
      title: title,
      url: url,
      favicon: null
    };
    
    this.tabs.push(tab);
    this.render();
    this.activateTab(tab.id);
    
    return tab;
  }

  closeTab(id) {
    const index = this.tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    
    this.tabs.splice(index, 1);
    
    if (this.tabs.length === 0) {
      this.createTab();
    } else if (this.activeTabId === id) {
      const newActive = this.tabs[Math.max(0, index - 1)];
      this.activateTab(newActive.id);
    }
    
    this.render();
  }

  activateTab(id) {
    this.activeTabId = id;
    this.render();
    
    const tab = this.tabs.find(t => t.id === id);
    if (tab) {
      // إرسال حدث تنشيط التبويب
      window.dispatchEvent(new CustomEvent('tab-activated', { detail: tab }));
    }
  }

  updateTab(id, updates) {
    const tab = this.tabs.find(t => t.id === id);
    if (!tab) return;
    
    Object.assign(tab, updates);
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = this.tabs.map(tab => `
      <div class="tab ${tab.id === this.activeTabId ? 'active' : ''}" 
           data-id="${tab.id}">
        <div class="tab-favicon">
          ${tab.favicon ? `<img src="${tab.favicon}" width="16" height="16">` : '🌐'}
        </div>
        <span class="tab-title">${tab.title}</span>
        <button class="tab-close" data-close="${tab.id}">✕</button>
      </div>
    `).join('');

    // ربط الأحداث
    this.container.querySelectorAll('.tab').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) return;
        this.activateTab(parseInt(el.dataset.id));
      });
    });

    this.container.querySelectorAll('.tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(parseInt(btn.dataset.close));
      });
    });
  }
}
