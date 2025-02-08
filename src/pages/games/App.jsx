import React, { useEffect, useState } from 'react';
import ShogiGame from '../../domain/shogi';
import Shogi from '../../components/Shogi';

export default function GameApp({ game }) {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

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

  return (
    <div>
      <div className="game-info">
        <h1>対局 #{game.id}</h1>
        <p>先手: {game.sente}{game.sente === userEmail && ' (あなた)'}</p>
        <p>後手: {game.gote}{game.gote === userEmail && ' (あなた)'}</p>
        <p>状態: {game.state}</p>
        <p>手番: {game.turn === 'sente' ? '先手' : '後手'}</p>
      </div>

      <Shogi 
        game={shogiGame} 
        playerTurn={playerTurn}
        currentTurn={game.turn}
      />

      <style>{`
        .game-info {
          margin: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 