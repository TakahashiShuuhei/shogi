import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';

export default function renderPage(Component, options = {}) {
  const {
    initialData = null,
    pageName,
  } = options;

  return (req, res) => {
    try {
      // データをpropsとして渡してレンダリング
      const html = renderToString(<Component initialData={initialData} />);
      
      fs.readFile(path.resolve('./public/index.html'), 'utf-8', (err, data) => {
        if (err) {
          console.error('HTMLテンプレート読み込みエラー:', err);
          return res.status(500).send('Internal Server Error');
        }

        let finalHtml = data
          .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
          .replace('/build/client.js', `/build/${pageName}.js`);

        // 初期データがある場合はクライアントに渡す
        if (initialData) {
          finalHtml = finalHtml.replace('</head>', `
            <script>
              window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
            </script>
            </head>
          `);
        }

        res.send(finalHtml);
      });
    } catch (error) {
      console.error('ページレンダリングエラー:', error);
      res.status(500).send('Internal Server Error');
    }
  };
} 