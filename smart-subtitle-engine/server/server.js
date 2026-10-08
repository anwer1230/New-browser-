import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());
app.use(express.json());

// بحث Google عبر scraping
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=ar&num=20`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const results = [];
    $('div.g').each((i, el) => {
      const title = $(el).find('h3').text();
      const link = $(el).find('a').attr('href');
      const snippet = $(el).find('.VwiC3b').text();
      if (title && link) {
        results.push({ title, url: link, snippet });
      }
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ترجمة
app.post('/api/translate', async (req, res) => {
  const { texts, targetLang } = req.body;
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(texts.join('\n'))}`
    );
    const data = await response.json();
    const translations = data[0].map(item => item[0]);
    res.json({ translations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('🚀 Server on port 3000'));
