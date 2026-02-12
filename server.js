/**
 * Servidor de Notícias - Portugal e Internacionais
 * Usa feeds RSS gratuitos para agregar notícias
 */

const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const path = require('path');

const app = express();
const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'News-Portugal-App/1.0' }
});

const PORT = process.env.PORT || 3000;

// Feeds de notícias de Portugal (gratuitos)
const PORTUGAL_FEEDS = [
  { url: 'https://www.rtp.pt/noticias/rss', name: 'RTP Notícias' },
  { url: 'https://www.rtp.pt/noticias/rss/pais', name: 'RTP País' },
  { url: 'https://www.rtp.pt/noticias/rss/mundo', name: 'RTP Mundo' },
  { url: 'https://www.rtp.pt/noticias/rss/economia', name: 'RTP Economia' },
  { url: 'https://www.rtp.pt/noticias/rss/desporto', name: 'RTP Desporto' },
  { url: 'https://www.rtp.pt/noticias/rss/cultura', name: 'RTP Cultura' },
  { url: 'https://feeds.feedburner.com/PublicoRSS', name: 'Público' },
  { url: 'https://www.portugalresident.com/feed/', name: 'Portugal Resident' }
];

// Feeds de notícias internacionais (gratuitos)
const INTERNATIONAL_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News' },
  { url: 'https://rss.dw.com/rdf/rss-en-top', name: 'Deutsche Welle' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian' }
];

async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);
    return {
      source: feedConfig.name,
      items: (feed.items || []).slice(0, 15).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.contentSnippet || item.content || '',
        thumbnail: item.enclosure?.url || item['media:content']?.$?.url || null
      }))
    };
  } catch (err) {
    console.error(`Erro ao buscar ${feedConfig.name}:`, err.message);
    return { source: feedConfig.name, items: [], error: err.message };
  }
}

async function fetchAllFeeds(feeds) {
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  return results.map((r, i) => 
    r.status === 'fulfilled' ? r.value : { source: feeds[i].name, items: [], error: r.reason?.message }
  );
}

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API - Notícias de Portugal
app.get('/api/portugal', async (req, res) => {
  try {
    const feeds = await fetchAllFeeds(PORTUGAL_FEEDS);
    res.json({ success: true, feeds, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API - Notícias Internacionais
app.get('/api/internacional', async (req, res) => {
  try {
    const feeds = await fetchAllFeeds(INTERNATIONAL_FEEDS);
    res.json({ success: true, feeds, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API - Todas as notícias
app.get('/api/news', async (req, res) => {
  try {
    const [portugal, internacional] = await Promise.all([
      fetchAllFeeds(PORTUGAL_FEEDS),
      fetchAllFeeds(INTERNATIONAL_FEEDS)
    ]);
    res.json({
      success: true,
      portugal: { feeds: portugal, updatedAt: new Date().toISOString() },
      internacional: { feeds: internacional, updatedAt: new Date().toISOString() }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n📰 Servidor de Notícias a correr em http://localhost:${PORT}`);
    console.log(`   - Portugal: http://localhost:${PORT}/api/portugal`);
    console.log(`   - Internacional: http://localhost:${PORT}/api/internacional\n`);
  });
}
