import React from 'react';

export default function GameApp({ game }) {
  if (!game) {
    return <div>対局が見つかりません</div>;
  }

  return (
    <div>
      <h1>対局 #{game.id}</h1>
      <div className="game-info">
        <p>先手: {game.sente}</p>
        <p>後手: {game.gote}</p>
        <p>状態: {game.state}</p>
        <p>手番: {game.turn}</p>
        <pre className="board-state">
          {JSON.stringify(game.board, null, 2)}
        </pre>
      </div>

      <style>{`
        .game-info {
          margin: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .board-state {
          margin-top: 20px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
} 