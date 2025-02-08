import express from 'express';
import renderPage from './server/renderPage';
import HomeApp from './pages/home/App';
import AboutApp from './pages/about/App';
import ShogiTestApp from './pages/shogi-test/App';
import { sql } from './lib/db';

const app = express();
const port = process.env.PORT || 3000;

// 静的ファイルの提供
app.use('/build', express.static('build'));
app.use('/public', express.static('public'));

// APIエンドポイントの設定
app.use(express.json());

// ページルーティング
app.get('/', renderPage(HomeApp, { pageName: 'home' }));
app.get('/about', renderPage(AboutApp, { pageName: 'about' }));
app.get('/shogi-test', async (req, res, next) => {
  try {
    const result = await sql`SELECT NOW()`;
    const initialData = {
      lastAccess: result[0].now
    };
    renderPage(ShogiTestApp, { 
      pageName: 'shogi-test',
      initialData 
    })(req, res);
  } catch (error) {
    next(error);
  }
});

// APIエンドポイント
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

// 404ページ
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 