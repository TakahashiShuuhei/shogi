import express from 'express';
import renderPage from './server/renderPage';
import HomeApp from './pages/home/App';
import AboutApp from './pages/about/App';
import ShogiTestApp from './pages/shogi-test/App';
import InviteApp from './pages/invite/App';
import ErrorApp from './pages/error/App';
import RegisterApp from './pages/register/App';
import { sql } from './lib/db';
import { generateToken } from './lib/token';
import { sendEmail } from './lib/mail';

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

app.get('/invite', renderPage(InviteApp, { pageName: 'invite' }));

app.get('/register', (req, res) => {
  const { email, token, gameId } = req.query;

  // バリデーション
  if (!email || !token) {
    return res.redirect('/error?message=' + encodeURIComponent('無効なリンクです'));
  }

  // トークンの検証
  const expectedToken = generateToken(email);
  if (token !== expectedToken) {
    return res.redirect('/error?message=' + encodeURIComponent('無効なリンクです'));
  }

  // 検証済みのデータをinitialDataとして渡す
  renderPage(RegisterApp, { 
    pageName: 'register',
    initialData: { email, gameId }
  })(req, res);
});

// エラーページ
app.get('/error', (req, res) => {
  renderPage(ErrorApp, { 
    pageName: 'error',
    initialData: { message: req.query.message }
  })(req, res);
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

// 招待メール送信用のエンドポイント
app.post('/api/invite', async (req, res) => {
  try {
    const { email } = req.body;

    // 基本的なバリデーション
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスが無効です'
      });
    }

    // トークン生成
    const token = generateToken(email);

    // メール送信
    await sendEmail({
      to: email,
      subject: 'アプリへの招待',
      text: `
        アプリへ招待されました。
        以下のリンクからアプリにアクセスしてください：
        ${process.env.APP_URL}/register?email=${encodeURIComponent(email)}&token=${token}
      `,
      html: `
        <p>アプリへ招待されました。</p>
        <p>以下のリンクからアプリにアクセスしてください：</p>
        <p><a href="${process.env.APP_URL}/register?email=${encodeURIComponent(email)}&token=${token}">アプリを開く</a></p>
      `
    });

    res.json({
      success: true,
      message: '招待メールを送信しました'
    });

  } catch (error) {
    console.error('招待処理でエラーが発生しました:', error);
    // エラーの詳細を表示
    if (error.response && error.response.body) {
      console.error('SendGrid エラー詳細:', error.response.body);
    }
    res.status(500).json({
      success: false,
      message: 'メール送信に失敗しました'
    });
  }
});

// 404ページ
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 