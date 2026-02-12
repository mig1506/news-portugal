/**
 * News Portugal & Mundo - Cliente
 * Atualização automática a cada 5 minutos
 */

const API_BASE = window.location.origin;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

const elements = {
  lastUpdate: document.getElementById('lastUpdate'),
  refreshBtn: document.getElementById('refreshBtn'),
  portugalSection: document.getElementById('portugal-section'),
  internacionalSection: document.getElementById('internacional-section'),
  portugalNews: document.getElementById('portugalNews'),
  internacionalNews: document.getElementById('internacionalNews'),
  portugalLoading: document.getElementById('portugalLoading'),
  internacionalLoading: document.getElementById('internacionalLoading')
};

let refreshTimeout;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Agora';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderNews(container, feeds) {
  let html = '';
  
  for (const feed of feeds) {
    if (feed.error) {
      html += `
        <div class="feed-section feed-collapsible">
          <div class="feed-header">
            <h3 class="feed-title">${feed.source} – Erro ao carregar</h3>
            <button type="button" class="feed-toggle" aria-label="Expandir ou colapsar"><span class="feed-toggle-icon">▼</span></button>
          </div>
          <div class="feed-content"><p class="news-card-desc">${feed.error}</p></div>
        </div>
      `;
      continue;
    }

    if (feed.items.length === 0) continue;

    html += `<div class="feed-section feed-collapsible">
      <div class="feed-header">
        <h3 class="feed-title">${feed.source}</h3>
        <button type="button" class="feed-toggle" aria-label="Expandir ou colapsar" title="Expandir ou colapsar">
          <span class="feed-toggle-icon">▼</span>
        </button>
      </div>
      <div class="feed-content"><div class="news-grid">`;

    for (const item of feed.items) {
      const fullDesc = stripHtml(item.description || '').trim();
      const shortDesc = fullDesc.substring(0, 120);
      const date = formatDate(item.pubDate);
      const hasTooltip = fullDesc.length > 0;
      
      html += `
        <article class="news-card" ${hasTooltip ? 'data-has-tooltip' : ''}>
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-card-link">
            <h3 class="news-card-title">${item.title}</h3>
            ${shortDesc ? `<p class="news-card-desc">${shortDesc}${fullDesc.length > 120 ? '...' : ''}</p>` : ''}
          </a>
          <div class="news-card-meta">
            <span class="news-card-source">${feed.source}</span>
            <span class="news-card-date">${date}</span>
          </div>
          ${hasTooltip ? `<div class="news-card-tooltip"><div class="news-card-tooltip-text">${escapeHtml(fullDesc.substring(0, 600))}${fullDesc.length > 600 ? '...' : ''}</div><a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-card-tooltip-link">Ler notícia completa →</a></div>` : ''}
        </article>
      `;
    }

    html += `</div></div></div>`;
  }

  container.innerHTML = html || '<p class="loading">Sem notícias disponíveis.</p>';
}

async function fetchNews(endpoint) {
  const res = await fetch(`${API_BASE}/api/${endpoint}`);
  if (!res.ok) throw new Error('Erro ao carregar');
  return res.json();
}

async function loadPortugal() {
  elements.portugalLoading.classList.remove('hidden');
  try {
    const data = await fetchNews('portugal');
    if (data.success) {
      renderNews(elements.portugalNews, data.feeds);
      elements.lastUpdate.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-PT')}`;
    }
  } catch (err) {
    elements.portugalNews.innerHTML = `<p class="loading">Erro ao carregar. Verifique se o servidor está a correr.</p>`;
  } finally {
    elements.portugalLoading.classList.add('hidden');
  }
}

async function loadInternacional() {
  elements.internacionalLoading.classList.remove('hidden');
  try {
    const data = await fetchNews('internacional');
    if (data.success) {
      renderNews(elements.internacionalNews, data.feeds);
    }
  } catch (err) {
    elements.internacionalNews.innerHTML = `<p class="loading">Erro ao carregar.</p>`;
  } finally {
    elements.internacionalLoading.classList.add('hidden');
  }
}

async function refreshAll() {
  elements.refreshBtn.classList.add('loading');
  elements.refreshBtn.disabled = true;

  const activeTab = document.querySelector('.tab.active')?.dataset?.tab;
  
  if (activeTab === 'portugal') {
    await loadPortugal();
  } else {
    await loadInternacional();
  }

  elements.refreshBtn.classList.remove('loading');
  elements.refreshBtn.disabled = false;
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  elements.portugalSection.classList.toggle('hidden', tab !== 'portugal');
  elements.internacionalSection.classList.toggle('hidden', tab !== 'internacional');

  if (tab === 'portugal' && elements.portugalNews.children.length === 0) {
    loadPortugal();
  } else if (tab === 'internacional' && elements.internacionalNews.children.length === 0) {
    loadInternacional();
  }
}

function scheduleRefresh() {
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(async () => {
    await refreshAll();
    scheduleRefresh();
  }, REFRESH_INTERVAL);
}

// Botão para expandir/colapsar feeds
document.querySelectorAll('.feeds-container').forEach(container => {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.feed-toggle');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const section = btn.closest('.feed-collapsible');
      if (section) {
        const isExpanded = section.classList.contains('feed-expanded');
        if (isExpanded) {
          section.classList.remove('feed-expanded');
          section.classList.add('feed-collapsed'); // ignora sticky hover em touchscreens
        } else {
          section.classList.add('feed-expanded');
          section.classList.remove('feed-collapsed');
        }
      }
    }
  });
  // Restaurar hover quando o rato passa por cima (feed-collapsed é apenas para touch)
  container.addEventListener('mouseover', (e) => {
    const section = e.target.closest('.feed-collapsible');
    if (section) {
      section.classList.remove('feed-collapsed');
    }
  });
});

// Inicialização
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

elements.refreshBtn.addEventListener('click', refreshAll);

// Carregar tab ativa
loadPortugal();
scheduleRefresh();
