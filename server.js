
import { sendEmail } from './mail.js';
import express from 'express';
const app = express();

// Render では環境変数 PORT が設定されるので、設定されていなければ 3000 番ポートを利用
const port = process.env.PORT || 3000;

// ルートへのリクエストに対して "Hello, world!" を返す
app.get('/', (req, res) => {
  sendEmail();
  res.send('Hello, world!');
});

// サーバー開始
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 