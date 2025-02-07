import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../src/App.jsx';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.static(path.resolve(__dirname, '..', 'build')));
app.use('/public', express.static(path.resolve(__dirname, '..', 'build/public')));

app.get('*', (req, res) => {
  const context = {};
  const app = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      <App />
    </StaticRouter>
  );

  const template = path.resolve(__dirname, '..', 'build', 'index.html');
  fs.readFile(template, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('エラーが発生しました');
    }

    return res.send(
      data.replace(
        '<div id="root"></div>',
        `<div id="root">${app}</div>`
      )
    );
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
}); 