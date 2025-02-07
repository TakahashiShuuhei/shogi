import React, { useState } from 'react';
import Shogi from '../components/Shogi.jsx';
import ShogiGame from '../domain/shogi';

const ShogiTest = () => {
  const [game] = useState(() => {
    const g = new ShogiGame();
    // テスト用に持ち駒を設定
    g.hands = {
      sente: [
        { type: '歩', owner: 'sente', promoted: false },
        { type: '角', owner: 'sente', promoted: false }
      ],
      gote: [
        { type: '金', owner: 'gote', promoted: false },
        { type: '銀', owner: 'gote', promoted: false }
      ]
    };
    return g;
  });

  return (
    <div>
      <h1>将棋テストページ</h1>
      <Shogi game={game} />
    </div>
  );
};

export default ShogiTest; 