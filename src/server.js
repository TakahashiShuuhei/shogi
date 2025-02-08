import express from 'express';
import renderPage from './server/renderPage';
import HomeApp from './pages/home/App';
import AboutApp from './pages/about/App';
import ShogiTestApp from './pages/shogi-test/App';
import InviteApp from './pages/invite/App';
import ErrorApp from './pages/error/App';
import RegisterApp from './pages/register/App';
import GameApp from './pages/games/App';
import client from './lib/db';
import { generateToken } from './lib/token';
import { sendEmail } from './lib/mail';
import ShogiGame from './domain/shogi';

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
    let baseUrl = process.env.APP_URL;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // メール送信
    await sendEmail({
      to: email,
      subject: 'アプリへの招待',
      text: `
        アプリへ招待されました。
        以下のリンクからアプリにアクセスしてください：
        ${baseUrl}/register?email=${encodeURIComponent(email)}&token=${token}
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

// 新規対局作成エンドポイント
app.post('/api/games', async (req, res) => {
  try {
    const { userEmail, opponent, preferredTurn } = req.body;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'ログインが必要です'
      });
    }

    // 手番の決定
    let sente, gote;
    if (preferredTurn === 'random') {
      // ランダムに決定
      if (Math.random() < 0.5) {
        sente = userEmail;
        gote = opponent;
      } else {
        sente = opponent;
        gote = userEmail;
      }
    } else {
      // 希望通りに設定
      sente = preferredTurn === 'sente' ? userEmail : opponent;
      gote = preferredTurn === 'sente' ? opponent : userEmail;
    }

    // 初期盤面の作成
    const game = new ShogiGame();
    const initialState = game.exportState();

    // DBに保存
    const query = {
      text: 'INSERT INTO games (sente, gote, board, state, turn) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      values: [
        sente,
        gote,
        JSON.stringify(initialState),
        'playing',
        'sente'
      ]
    };

    const result = await client.query(query);
    const gameId = result.rows[0].id;

    // 対戦相手に招待メールを送信
    const token = generateToken(opponent);
    let baseUrl = process.env.APP_URL;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    await sendEmail({
      to: opponent,
      subject: '将棋の対局に招待されました',
      text: `
        ${userEmail}さんから将棋の対局に招待されました。
        あなたは${gote === opponent ? '後手' : '先手'}です。

        以下のリンクから対局を開始してください：
        ${baseUrl}/register?email=${encodeURIComponent(opponent)}&token=${token}&gameId=${gameId}
      `,
      html: `
        <p>${userEmail}さんから将棋の対局に招待されました。</p>
        <p>あなたは<strong>${gote === opponent ? '後手' : '先手'}</strong>です。</p>
        <p>以下のリンクから対局を開始してください：</p>
        <p><a href="${baseUrl}/register?email=${encodeURIComponent(opponent)}&token=${token}&gameId=${gameId}">対局を開始する</a></p>
      `
    });

    res.json({
      success: true,
      gameId: gameId
    });

  } catch (error) {
    console.error('対局作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'エラーが発生しました'
    });
  }
});

// 対局ページ
app.get('/games/:id', async (req, res) => {
  try {
    const query = {
      text: 'SELECT * FROM games WHERE id = $1',
      values: [req.params.id]
    };

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.redirect('/error?message=' + encodeURIComponent('対局が見つかりません'));
    }

    const game = result.rows[0];

    renderPage(GameApp, {
      pageName: 'game',
      initialData: { game }
    })(req, res);

  } catch (error) {
    console.error('対局ページ読み込みエラー:', error);
    res.redirect('/error?message=' + encodeURIComponent('エラーが発生しました'));
  }
});

// 対局状態の更新
app.put('/api/games/:id', async (req, res) => {
  try {
    const { board, turn } = req.body;

    const query = {
      text: 'UPDATE games SET board = $1, turn = $2 WHERE id = $3',
      values: [JSON.stringify(board), turn, req.params.id]
    };

    await client.query(query);

    res.json({ success: true });

  } catch (error) {
    console.error('対局更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'エラーが発生しました'
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