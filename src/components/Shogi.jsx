import React, { useState } from 'react';
import ShogiGame from '../domain/shogi';

// PropTypesを使用しないバージョン
const Shogi = ({ game, playerTurn, currentTurn }) => {
  const [board, setBoard] = useState(game.getBoard());
  const [hands, setHands] = useState(game.hands);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  
  // 固定サイズを設定
  const cellSize = 80;
  const pieceScale = cellSize / 140 * 0.85;

  // 操作可能かどうかを判定
  const canControl = playerTurn && playerTurn === currentTurn;

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

  // 駒がクリックされたときの処理
  const handlePieceClick = (row, col) => {
    // 操作不可の場合は何もしない
    if (!canControl) return;

    const piece = board[row][col];
    if (!piece) {
      setSelectedPiece(null);
      setAvailableMoves([]);
      return;
    }

    if (piece.owner === game.turn) {
      setSelectedPiece({ row, col });
      const moves = game.getAvailableMoves({ row, col });
      setAvailableMoves(moves);
    } else {
      setSelectedPiece(null);
      setAvailableMoves([]);
    }
  };

  // 持ち駒がクリックされたときの処理
  const handleHandPieceClick = (pieceType, owner) => {
    // 操作不可の場合は何もしない
    if (!canControl) return;

    if (owner === game.turn) {
      setSelectedPiece({ hand: true, owner, pieceType });
      const moves = game.getAvailableMoves({ hand: true, owner, pieceType });
      setAvailableMoves(moves);
    } else {
      setSelectedPiece(null);
      setAvailableMoves([]);
    }
  };

  // マスがクリックされたときの処理
  const handleCellClick = (row, col) => {
    // 駒が選択されていない場合は、駒のクリックとして処理
    if (!selectedPiece) {
      handlePieceClick(row, col);
      return;
    }

    // 移動可能なマスがクリックされたかチェック
    const isAvailableMove = availableMoves.some(
      move => move.to.row === row && move.to.col === col
    );

    if (!isAvailableMove) {
      // 移動可能なマス以外がクリックされた場合は選択解除
      setSelectedPiece(null);
      setAvailableMoves([]);
    }
    // TODO: 移動可能なマスがクリックされた場合の処理
  };

  // マスの背景色を決定する関数
  const getCellBackgroundColor = (row, col) => {
    if (selectedPiece && !selectedPiece.hand && 
        selectedPiece.row === row && selectedPiece.col === col) {
      return '#FFFF00';
    }
    if (availableMoves.some(move => move.to.row === row && move.to.col === col)) {
      return canControl ? '#90EE90' : '#ccc'; // 操作不可の場合は薄いグレー
    }
    return '#FFE4B5';
  };

  // 駒台のコンポーネント
  const PieceStand = ({ pieces, owner, isReversed }) => (
    <div style={{
      width: `${cellSize * 2}px`,
      minHeight: `${cellSize * 5}px`,
      backgroundColor: '#DEB887',
      padding: '8px',
      border: '4px solid #855',
      borderRadius: '4px',
      margin: '8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      alignContent: isReversed ? 'flex-end' : 'flex-start',
      alignSelf: isReversed ? 'flex-start' : 'flex-end'
    }}>
      {pieces.map((piece, index) => (
        <div 
          key={`${piece.type}-${index}`}
          onClick={() => handleHandPieceClick(piece.type, owner)}
          style={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            position: 'relative',
            cursor: owner === game.turn ? 'pointer' : 'default',
            backgroundColor: selectedPiece?.hand && 
                           selectedPiece.owner === owner && 
                           selectedPiece.pieceType === piece.type ? 
                           '#FFFF00' : 'transparent'
          }}>
          <div style={{
            position: 'absolute',
            width: '140px',
            height: '148px',
            backgroundImage: 'url(/public/piece.png)',
            backgroundSize: '1120px 592px',
            backgroundRepeat: 'no-repeat',
            ...(() => {
              const pos = getPieceImagePosition({ ...piece, owner: 'sente' });
              return pos ? {
                backgroundPosition: `${pos.x}px ${pos.y}px`,
                transform: isReversed ? 
                  `scale(${pieceScale}) rotate(180deg)` :
                  `scale(${pieceScale})`,
                transformOrigin: 'center center',
                left: '50%',
                top: '50%',
                marginLeft: '-70px',
                marginTop: '-74px',
              } : {};
            })()
          }} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      opacity: canControl ? 1 : 0.7 // 操作不可の場合は全体を少し薄く
    }}>
      <h1>将棋盤</h1>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '16px',
        height: `${cellSize * 9 + 40}px`
      }}>
        {/* 後手の駒台 */}
        <PieceStand pieces={hands.gote} owner="gote" isReversed={true} />
        
        {/* 将棋盤 */}
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
              <div 
                key={`${rowIndex}-${colIndex}`} 
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: getCellBackgroundColor(rowIndex, colIndex),
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)',
                  cursor: 'pointer' // クリック可能なことを示す
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

        {/* 先手の駒台 */}
        <PieceStand pieces={hands.sente} owner="sente" isReversed={false} />
      </div>
      <div style={{ marginTop: '1rem' }}>
        <pre>{JSON.stringify(board, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Shogi; 