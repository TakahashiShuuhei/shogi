import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import path from 'path';
import fs from 'fs';
import HomeApp from './pages/home/App';
import AboutApp from './pages/about/App';
import ShogiTestApp from './pages/shogi-test/App';

const app = express();
const port = process.env.PORT || 3000;

// 静的ファイルの提供
app.use('/build', express.static('build'));
app.use('/public', express.static('public'));

// APIエンドポイントの設定
app.use(express.json());

app.post('/api/test', async (req, res) => {
  const { type } = req.body;
  
  try {
    if (type === 'db') {
      const result = await sql`SELECT NOW()`;
      return res.json({ success: true, result: result[0] });
    }

    if (type === 'mail') {
      await sendEmail({
        to: 'uhiaha888+to@gmail.com',
        subject: 'テストメール',
        text: 'これはテストメールです。',
        html: '<p>これはテストメールです。</p>'
      });
      return res.json({ success: true, message: '送信成功' });
    }

    return res.status(400).json({ error: '不正なテストタイプです' });
  } catch (error) {
    console.error('テストエラー:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Homeページ
app.get('/', (req, res) => {
  const html = renderToString(<HomeApp />);
  
  fs.readFile(path.resolve('./public/index.html'), 'utf-8', (err, data) => {
    if (err) {
      console.error('HTMLテンプレート読み込みエラー:', err);
      return res.status(500).send('Internal Server Error');
    }

    const finalHtml = data
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
      .replace('/build/client.js', '/build/home.js');  // スクリプトパスを変更

    res.send(finalHtml);
  });
});

// Aboutページ
app.get('/about', (req, res) => {
  const html = renderToString(<AboutApp />);
  
  fs.readFile(path.resolve('./public/index.html'), 'utf-8', (err, data) => {
    if (err) {
      console.error('HTMLテンプレート読み込みエラー:', err);
      return res.status(500).send('Internal Server Error');
    }

    const finalHtml = data
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
      .replace('/build/client.js', '/build/about.js');  // スクリプトパスを変更

    res.send(finalHtml);
  });
});

// 将棋テストページ
app.get('/shogi-test', (req, res) => {
  const html = renderToString(<ShogiTestApp />);
  
  fs.readFile(path.resolve('./public/index.html'), 'utf-8', (err, data) => {
    if (err) {
      console.error('HTMLテンプレート読み込みエラー:', err);
      return res.status(500).send('Internal Server Error');
    }

    const finalHtml = data
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
      .replace('/build/client.js', '/build/shogi-test.js');  // スクリプトパスを変更

    res.send(finalHtml);
  });
});

// 404ページ
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 