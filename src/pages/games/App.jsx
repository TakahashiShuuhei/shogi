import React, { useEffect, useState } from 'react';
import ShogiGame from '../../domain/shogi';
import Shogi from '../../components/Shogi';

export default function GameApp({ game }) {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);

    // ログインしていない場合はホームページへリダイレクト
    if (!email) {
      window.location.href = '/';
      return;
    }

    // ログインしているが、この対局に参加していない場合もリダイレクト
    if (email !== game.sente && email !== game.gote) {
      window.location.href = '/';
      return;
    }
  }, [game.sente, game.gote]);

  if (!userEmail) {
    return null;  // リダイレクト中は何も表示しない
  }

  if (!game) {
    return <div>対局が見つかりません</div>;
  }

  // DBから取得した状態をShogiGameインスタンスに復元
  const shogiGame = new ShogiGame();
  if (typeof game.board === 'string') {
    shogiGame.importState(JSON.parse(game.board));
  } else {
    shogiGame.importState(game.board);
  }

  // ログインユーザーの手番を判定
  let playerTurn = null;
  if (userEmail === game.sente) {
    playerTurn = 'sente';
  } else if (userEmail === game.gote) {
    playerTurn = 'gote';
  }

  const handleMove = async (updatedGame) => {
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: updatedGame.exportState(),
          turn: updatedGame.turn
        })
      });

      if (response.ok) {
        // ページをリロード
        window.location.reload();
      } else {
        console.error('移動の保存に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
    }
  };

  return (
    <div>
      <div className="game-header">
        <a href="/" className="back-link">← 対局一覧へ戻る</a>
        <div className="game-info">
          <h1>対局 #{game.id}</h1>
          <p>先手: {game.sente}{game.sente === userEmail && ' (あなた)'}</p>
          <p>後手: {game.gote}{game.gote === userEmail && ' (あなた)'}</p>
          <p>状態: {game.state}</p>
          <p>手番: {game.turn === 'sente' ? '先手' : '後手'}</p>
        </div>
      </div>

      <Shogi 
        game={shogiGame} 
        playerTurn={playerTurn}
        currentTurn={game.turn}
        senteEmail={game.sente}
        goteEmail={game.gote}
        onMove={handleMove}
      />

      <style>{`
        .game-header {
          padding: 1rem 2rem;
          border-bottom: 1px solid #ddd;
          margin-bottom: 1rem;
        }

        .back-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          color: #666;
          text-decoration: none;
          font-size: 0.9em;
          margin-bottom: 1rem;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: #000;
        }

        .game-info {
          margin-left: 1rem;
        }
      `}</style>
    </div>
  );
} 