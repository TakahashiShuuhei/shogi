import React, { useEffect, useState } from 'react';

export default function HomeApp() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [preferredTurn, setPreferredTurn] = useState('random');
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);

    if (!email) {
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
      try {
        const response = await fetch(`/api/games?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success) {
          setGames(data.games);
        } else {
          setError(data.message);
        }
      } catch (error) {
        console.error('対局一覧の取得に失敗:', error);
        setError('対局一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!userEmail) {
        setError('ログインが必要です');
        return;
      }

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          opponent,
          preferredTurn
        })
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = `/games/${data.gameId}`;
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('対局作成エラー:', error);
      setError('対局の作成に失敗しました');
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (!userEmail) {
    return (
      <div className="home">
        <h1>将棋アプリ</h1>
        
        <div className="login-message">
          <p>ログインしていません。</p>
          <p>以前に受け取った招待メールのリンクからログインしてください。</p>
          <p>招待メールをお持ちでない場合は、他のユーザーからの招待をお待ちください。</p>
        </div>

        <style>{`
          .home {
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .login-message {
            margin: 2rem 0;
            padding: 2rem;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-align: center;
            line-height: 1.6;
          }

          .login-message p {
            margin: 1rem 0;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home">
      <h1>将棋アプリ</h1>

      <div className="new-game">
        <h2>新規対局</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>対戦相手のメールアドレス:</label>
            <input
              type="email"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>希望の手番:</label>
            <select
              value={preferredTurn}
              onChange={(e) => setPreferredTurn(e.target.value)}
            >
              <option value="random">ランダム</option>
              <option value="sente">先手</option>
              <option value="gote">後手</option>
            </select>
          </div>
          <button type="submit">対局を作成</button>
        </form>
      </div>
      
      <div className="games-list">
        <h2>参加中の対局</h2>
        {games.length === 0 ? (
          <p>参加中の対局はありません</p>
        ) : (
          <ul>
            {games.map(game => (
              <li key={game.id}>
                <a href={`/games/${game.id}`} className="game-link">
                  <div className="game-info">
                    <div>
                      <span className="label">先手:</span> {game.sente}
                    </div>
                    <div>
                      <span className="label">後手:</span> {game.gote}
                    </div>
                    <div>
                      <span className="label">状態:</span> {game.state}
                    </div>
                    <div>
                      <span className="label">手番:</span> {game.turn === 'sente' ? '先手' : '後手'}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .home {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .new-game {
          margin: 2rem 0;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100%;
        }

        .form-group {
          margin-bottom: 1rem;
          width: calc(100% - 100px);
          margin-left: 50px;
          margin-right: 50px;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 1em;
        }

        button[type="submit"] {
          background-color: #4CAF50;
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 50px;
        }

        button:hover {
          background-color: #45a049;
        }

        .games-list {
          margin-top: 2rem;
        }

        .game-link {
          display: block;
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-decoration: none;
          color: inherit;
          transition: background-color 0.3s;
        }

        .game-link:hover {
          background-color: #f5f5f5;
        }

        .game-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .label {
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .error {
          color: red;
          padding: 1rem;
          border: 1px solid red;
          border-radius: 4px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
} 