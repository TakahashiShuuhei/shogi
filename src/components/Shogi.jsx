import React, { useState } from 'react';
import ShogiGame from '../domain/shogi';

// PropTypesを使用しないバージョン
const Shogi = ({ game, playerTurn, currentTurn, senteEmail, goteEmail, onMove }) => {
  const [board, setBoard] = useState(game.getBoard());
  const [hands, setHands] = useState(game.hands);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  // 成り確認用の状態を追加
  const [promotionDialog, setPromotionDialog] = useState(null);
  
  // 固定サイズを設定
  const cellSize = 80;
  const pieceScale = cellSize / 140 * 0.85;

  // 操作可能かどうかを判定
  const canControl = true; //playerTurn && playerTurn === currentTurn;

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

    if (piece.owner === currentTurn) {
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

    if (owner === currentTurn) {
      setSelectedPiece({ hand: true, owner, pieceType });
      const moves = game.getAvailableMoves({ hand: true, owner, pieceType });
      setAvailableMoves(moves);
    } else {
      setSelectedPiece(null);
      setAvailableMoves([]);
    }
  };

  // 移動を確定する関数
  const confirmMove = (from, to, promote) => {
    game.confirmMove(from, to, promote);
    setBoard(game.getBoard());
    setHands(game.hands);
    setSelectedPiece(null);
    setAvailableMoves([]);
    if (onMove) {
      onMove(game);
    }
  };

  // マスがクリックされたときの処理
  const handleCellClick = (row, col) => {
    if (!selectedPiece) {
      handlePieceClick(row, col);
      return;
    }

    // 移動可能なマスとその情報を取得
    const move = availableMoves.find(
      move => move.to.row === row && move.to.col === col
    );

    if (!move) {
      setSelectedPiece(null);
      setAvailableMoves([]);
      return;
    }

    const from = selectedPiece.hand ? 
      { hand: true, owner: selectedPiece.owner, pieceType: selectedPiece.pieceType } :
      { row: selectedPiece.row, col: selectedPiece.col };
    
    const to = { row, col };

    // 成れるかどうかチェック
    if (!selectedPiece.hand && move.canPromote) {  // 持ち駒からの配置は成れない
      // 成り確認ダイアログを表示
      setPromotionDialog({ from, to });
      return;
    }

    // 成れない場合はそのまま移動
    confirmMove(from, to, false);
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
            cursor: owner === currentTurn ? 'pointer' : 'default',
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
      opacity: canControl ? 1 : 0.7
    }}>
      <h1>将棋盤</h1>

      {/* 後手のメールアドレス */}
      <div className={`player-email gote ${currentTurn === 'gote' ? 'current' : ''}`}>
        {goteEmail}
      </div>

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

      {/* 先手のメールアドレス */}
      <div className={`player-email sente ${currentTurn === 'sente' ? 'current' : ''}`}>
        {senteEmail}
      </div>

      {/* 成り確認ダイアログ */}
      {promotionDialog && (
        <div className="promotion-dialog">
          <div className="dialog-content">
            <p>成りますか？</p>
            <div className="dialog-buttons">
              <button 
                onClick={() => {
                  confirmMove(promotionDialog.from, promotionDialog.to, true);
                  setPromotionDialog(null);
                }}
              >
                成る
              </button>
              <button 
                onClick={() => {
                  confirmMove(promotionDialog.from, promotionDialog.to, false);
                  setPromotionDialog(null);
                }}
              >
                成らない
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .player-email {
          margin: 8px 0;
          padding: 4px 8px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 0.9em;
          transition: all 0.3s ease;
        }
        .player-email.gote {
          margin-bottom: 16px;
        }
        .player-email.sente {
          margin-top: 16px;
        }
        .player-email.current {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding-left: 12px;
          font-weight: bold;
        }

        .promotion-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .dialog-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .dialog-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .dialog-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .dialog-buttons button:first-child {
          background-color: #4CAF50;
          color: white;
        }

        .dialog-buttons button:last-child {
          background-color: #f44336;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Shogi; 