import React, { useState, useEffect } from 'react';

export default function HomeApp() {
  const [userEmail, setUserEmail] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [preferredTurn, setPreferredTurn] = useState('random'); // 'sente', 'gote', 'random'
  const [status, setStatus] = useState('idle'); // idle, loading, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail) {
      setStatus('error');
      setErrorMessage('ログインが必要です');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          opponent,
          preferredTurn,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 作成された対局ページへリダイレクト
        window.location.href = `/games/${data.gameId}`;
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'エラーが発生しました');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('エラーが発生しました');
    }
  };

  return (
    <div>
      <h1>ホームページ</h1>
      <div className="login-status">
        {userEmail ? (
          <p>ログイン中のメールアドレス: {userEmail}</p>
        ) : (
          <p>ログインしていません</p>
        )}
      </div>

      <div className="new-game-section">
        <h2>新規対局</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="opponent">対戦相手のメールアドレス:</label>
            <input
              type="email"
              id="opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              required
              disabled={status === 'loading'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferredTurn">手番の希望:</label>
            <select
              id="preferredTurn"
              value={preferredTurn}
              onChange={(e) => setPreferredTurn(e.target.value)}
              disabled={status === 'loading'}
            >
              <option value="random">ランダム</option>
              <option value="sente">先手</option>
              <option value="gote">後手</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={status === 'loading' || !userEmail}
          >
            {status === 'loading' ? '作成中...' : '対局を作成'}
          </button>

          {status === 'error' && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
        </form>
      </div>

      <style>{`
        .login-status {
          margin: 20px 0;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }

        .new-game-section {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
        }

        input, select {
          width: 100%;
          padding: 8px;
          font-size: 16px;
        }

        button {
          padding: 10px 20px;
          font-size: 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:disabled {
          background-color: #ccc;
        }

        .error-message {
          margin-top: 10px;
          padding: 10px;
          color: #721c24;
          background-color: #f8d7da;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 