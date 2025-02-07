import React, { useState } from 'react';
import ShogiGame from '../domain/shogi';

const Shogi = () => {
  const game = new ShogiGame();
  const [board, setBoard] = useState(game.getBoard());
  
  // 固定サイズを設定
  const cellSize = 80; // マスのサイズを80pxに固定
  const pieceScale = cellSize / 140 * 0.85;

  // 駒の種類から画像の位置を計算する関数
  const getPieceImagePosition = (piece) => {
    if (!piece) return null;

    const pieceTypes = ['王', '飛', '角', '金', '銀', '桂', '香', '歩'];
    const col = pieceTypes.indexOf(piece.type);
    if (col === -1) return null;

    let row = 0;
    if (piece.promoted) {
      row = 1;
      if (piece.type === '金') return null;
    }
    if (piece.owner === 'gote') {
      row += 2;
    }

    const x = -(col * 140);
    const y = -(row * 148);

    return { x, y };
  };

  return (
    <div style={{ 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1>将棋盤</h1>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(9, ${cellSize}px)`,
        gap: '1px',
        backgroundColor: '#ccc',
        padding: '12px',
        border: '8px solid #855',
        borderRadius: '4px',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.3)'
      }}>
        {board.map((row, rowIndex) => 
          row.map((piece, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: '#FFE4B5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              {piece && (
                <div style={{
                  position: 'absolute',
                  width: '140px',
                  height: '148px',
                  backgroundImage: 'url(/public/piece.png)',
                  backgroundSize: '1120px 592px',
                  backgroundRepeat: 'no-repeat',
                  ...(() => {
                    const pos = getPieceImagePosition(piece);
                    return pos ? {
                      backgroundPosition: `${pos.x}px ${pos.y}px`,
                      transform: `scale(${pieceScale})`,
                      transformOrigin: 'center center',
                      left: '50%',
                      top: '50%',
                      marginLeft: '-70px',
                      marginTop: '-74px',
                    } : {};
                  })()
                }} />
              )}
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <pre>{JSON.stringify(board, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Shogi; 