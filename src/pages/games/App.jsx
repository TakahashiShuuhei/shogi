import React from 'react';
import ShogiGame from '../../domain/shogi';
import Shogi from '../../components/Shogi';

export default function GameApp({ game }) {
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

  return (
    <div>
      <div className="game-info">
        <h1>対局 #{game.id}</h1>
        <p>先手: {game.sente}</p>
        <p>後手: {game.gote}</p>
        <p>状態: {game.state}</p>
        <p>手番: {game.turn}</p>
      </div>

      <Shogi game={shogiGame} />

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