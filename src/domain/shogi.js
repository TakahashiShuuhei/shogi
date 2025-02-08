// シンプルな将棋ドメインロジックの実装
// ※ この実装は初期配置や移動の基本処理のみを行っています。
// 今後、各駒の移動ルール、成り、持ち駒や詰み判定などのロジックを拡張してください。

class ShogiGame {
  constructor() {
    this.board = this._initializeBoard();
    this.turn = 'sente'; // 先手（sente）から開始
    this.hands = { sente: [], gote: [] }; // 持ち駒管理
    this.moveHistory = [];
  }

  // 現在のゲーム状態を JSON オブジェクトとしてエクスポートする
  exportState() {
    return {
      board: this.board,
      turn: this.turn,
      moveHistory: this.moveHistory,
      hands: this.hands
    };
  }

  // JSON オブジェクトからゲーム状態をインポートする
  importState(state) {
    this.board = state.board;
    this.turn = state.turn;
    this.moveHistory = state.moveHistory;
    this.hands = state.hands;
  }

  // 9x9 の盤面を初期化し、簡易的な初期配置を設定する
  _initializeBoard() {
    // 空の9x9盤面を作成
    const board = Array.from({ length: 9 }, () => Array(9).fill(null));

    // 駒オブジェクトを作成するヘルパー関数
    const createPiece = (type, owner) => ({ type, owner, promoted: false });

    // Gote（後手）の初期配置（盤面の上段：インデックス0～2）
    // ※実際の配置は複雑ですが、ここでは簡略化しています。
    board[0] = [
      createPiece('香', 'gote'),
      createPiece('桂', 'gote'),
      createPiece('銀', 'gote'),
      createPiece('金', 'gote'),
      createPiece('王', 'gote'),
      createPiece('金', 'gote'),
      createPiece('銀', 'gote'),
      createPiece('桂', 'gote'),
      createPiece('香', 'gote')
    ];
    // gote の 2段目：ルーラーとビショップ（配置は標準に合わせています）
    board[1][1] = createPiece('角', 'gote');
    board[1][7] = createPiece('飛', 'gote');
    // gote の 3段目：全列に歩兵配置
    for (let col = 0; col < 9; col++) {
      board[2][col] = createPiece('歩', 'gote');
    }

    // Sente（先手）の初期配置（盤面の下段：インデックス6～8）
    // 先手の 7段目：全列に歩兵配置
    for (let col = 0; col < 9; col++) {
      board[6][col] = createPiece('歩', 'sente');
    }
    // 先手 の 8段目：ルーラーとビショップ
    board[7][1] = createPiece('飛', 'sente');
    board[7][7] = createPiece('角', 'sente');
    // 先手 の 9段目：香、桂、銀、金、玉、金、銀、桂、香
    board[8] = [
      createPiece('香', 'sente'),
      createPiece('桂', 'sente'),
      createPiece('銀', 'sente'),
      createPiece('金', 'sente'),
      createPiece('王', 'sente'),
      createPiece('金', 'sente'),
      createPiece('銀', 'sente'),
      createPiece('桂', 'sente'),
      createPiece('香', 'sente')
    ];

    return board;
  }

  // 座標が盤内かどうかを判定するメソッド
  _isValidCoordinate(coord) {
    return coord.row >= 0 && coord.row < 9 && coord.col >= 0 && coord.col < 9;
  }

  // 盤面のリセット
  reset() {
    this.board = this._initializeBoard();
    this.turn = 'sente';
    this.moveHistory = [];
    this.hands = { sente: [], gote: [] }; // 持ち駒をリセット
  }

  // 現在の盤面状態を取得する
  getBoard() {
    return this.board;
  }

  // 移動履歴を取得する
  getHistory() {
    return this.moveHistory;
  }

  // 移動先に自軍の駒がないかチェック
  _isTargetAvailable(target, owner=this.turn) {
    if (!this._isValidCoordinate(target)) return false;
    const piece = this.board[target.row][target.col];
    return !piece || piece.owner !== owner;
  }

  /**
   * 指定された座標の駒の利用可能な移動先一覧を取得します
   * @param {Object} coord - 移動元の座標または持ち駒情報
   * @param {number} [coord.row] - 盤上の駒の場合の行番号（0-8）
   * @param {number} [coord.col] - 盤上の駒の場合の列番号（0-8）
   * @param {boolean} [coord.hand] - 持ち駒の場合はtrue
   * @param {string} [coord.owner] - 持ち駒の場合の所有者（'sente'または'gote'）
   * @param {string} [coord.pieceType] - 持ち駒の場合の駒種（'歩', '角'など）
   * @returns {Array<Object>} 移動可能な位置の配列
   * @returns {Object} returns[].from - 移動元の座標
   * @returns {Object} returns[].to - 移動先の座標（row, colプロパティを含む）
   * @returns {boolean} returns[].canPromote - その移動で成れるかどうか
   */
  getAvailableMoves(coord) {
    // 持ち駒の場合
    if (coord.hand) {
      const moves = [];
      const owner = coord.owner;
      const pieceType = coord.pieceType;

      // 盤面の各マスをチェック
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          // マスが空いているかチェック
          if (this.board[row][col] !== null) continue;

          // 歩の場合の特別ルール
          if (pieceType === '歩') {
            // 二歩のチェック
            let hasPawn = false;
            for (let r = 0; r < 9; r++) {
              if (this.board[r][col] && 
                  this.board[r][col].type === '歩' && 
                  this.board[r][col].owner === owner &&
                  !this.board[r][col].promoted) {
                hasPawn = true;
                break;
              }
            }
            if (hasPawn) continue;

            // 最奥の段には置けない
            if ((owner === 'sente' && row === 0) || 
                (owner === 'gote' && row === 8)) {
              continue;
            }
          }

          // 桂馬の場合の特別ルール
          if (pieceType === '桂') {
            // 最奥の2段には置けない
            if ((owner === 'sente' && row <= 1) || 
                (owner === 'gote' && row >= 7)) {
              continue;
            }
          }

          // 香車の場合の特別ルール
          if (pieceType === '香') {
            // 最奥の段には置けない
            if ((owner === 'sente' && row === 0) || 
                (owner === 'gote' && row === 8)) {
              continue;
            }
          }

          moves.push({
            from: coord,
            to: { row, col },
            canPromote: false
          });
        }
      }
      return moves;
    }

    // 盤上の場合
    const piece = this.board[coord.row][coord.col];
    if (!piece) {
      throw new Error('指定された座標に駒が存在しません');
    }
    const owner = piece.owner;
    const forward = owner === 'sente' ? -1 : 1;
    let moves = [];
    if (piece.type === '王') {  // 王：8方向に1マスずつ
      // 王の隣接セルを候補とする
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          let nr = coord.row + dx;
          let nc = coord.col + dy;
          if (this._isTargetAvailable({ row: nr, col: nc }) && (this.board[nr][nc] === null || this.board[nr][nc].owner !== piece.owner)) {
            moves.push({ from: coord, to: { row: nr, col: nc } });
          }
        }
      }
      // 王の場合、敵の攻撃下になるマスは isSquareSafe で判定して除外する
      moves = moves.filter(move => this.isSquareSafe(move.to.row, move.to.col, piece.owner));
    } else if (piece.type === '金' || (piece.promoted && ['銀', '桂', '香', '歩'].includes(piece.type))) {  // 金：先手と後手で動きが多少異なる
      let directions;
      if (owner === 'sente') {
        directions = [
          { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
          { dr:  0, dc: -1 },                    { dr:  0, dc: 1 },
                             { dr:  1, dc: 0 }
        ];
      } else {
        directions = [
                             { dr: -1, dc: 0 },
          { dr:  0, dc: -1 },                    { dr:  0, dc: 1 },
          { dr:  1, dc: -1 }, { dr:  1, dc: 0 }, { dr:  1, dc: 1 }
        ];
      }
      for (const d of directions) {
        const target = { row: coord.row + d.dr, col: coord.col + d.dc };
        if (this._isTargetAvailable(target)) {
          moves.push({ from: coord, to: target, canPromote: false });
        }
      }
    } else if (piece.type === '歩') {  // 歩兵：前方1マス
      const target = { row: coord.row + forward, col: coord.col };
      if (this._isTargetAvailable(target)) {
        moves.push({ from: coord, to: target, canPromote: this._canPromote(piece, coord, target) });
      }
    } else if (piece.type === '銀') {  // 銀：動きの例
      let directions;
      if (owner === 'sente') {
        directions = [
          { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
          { dr:  1, dc: -1 }, { dr:  1, dc: 1 }
        ];
      } else {
        directions = [
          { dr:  1, dc: -1 }, { dr:  1, dc: 0 }, { dr:  1, dc: 1 },
          { dr: -1, dc: -1 }, { dr: -1, dc: 1 }
        ];
      }
      for (const d of directions) {
        const target = { row: coord.row + d.dr, col: coord.col + d.dc };
        if (this._isTargetAvailable(target)) {
          moves.push({ from: coord, to: target, canPromote: this._canPromote(piece, coord, target) });
        }
      }
    } else if (piece.type === '桂') {  // 桂馬
      moves = [];
      const forward2 = owner === 'sente' ? -2 : 2;
      const targets = [
        { row: coord.row + forward2, col: coord.col - 1 },
        { row: coord.row + forward2, col: coord.col + 1 }
      ];
      for (const target of targets) {
        if (this._isTargetAvailable(target)) {
          moves.push({ from: coord, to: target, canPromote: this._canPromote(piece, coord, target) });
        }
      }
      return moves;
    } else if (piece.type === '香') {  // 香車
      // 香車の移動：先手は上方向、後手は下方向に連続して移動可能。
      let moves = [];
      if (piece.owner === 'sente') {
        for (let r = coord.row - 1; r >= 0; r--) {
           if (this.board[r][coord.col] === null) {
              moves.push({ from: coord, to: { row: r, col: coord.col }, canPromote: false });
           } else {
              if (this.board[r][coord.col].owner !== piece.owner) {
                 moves.push({ from: coord, to: { row: r, col: coord.col }, canPromote: false });
              }
              break;
           }
        }
      } else { // gote
        for (let r = coord.row + 1; r < 9; r++) {
           if (this.board[r][coord.col] === null) {
              moves.push({ from: coord, to: { row: r, col: coord.col }, canPromote: false });
           } else {
              if (this.board[r][coord.col].owner !== piece.owner) {
                 moves.push({ from: coord, to: { row: r, col: coord.col }, canPromote: false });
              }
              break;
           }
        }
      }
      return moves;
    } else if (piece.type === '角') {  // 角行
      moves = [];
      const directions = [
        { dr: -1, dc: -1 },
        { dr: -1, dc:  1 },
        { dr:  1, dc: -1 },
        { dr:  1, dc:  1 }
      ];
      for (const d of directions) {
        let r = coord.row + d.dr;
        let c = coord.col + d.dc;
        while (this._isTargetAvailable({ row: r, col: c })) {
          if (this.board[r][c] === null) {
            moves.push({ from: coord, to: { row: r, col: c }, canPromote: this._canPromote(piece, coord, { row: r, col: c }) });
          } else {
            if (this.board[r][c].owner !== piece.owner) {
              moves.push({ from: coord, to: { row: r, col: c }, canPromote: this._canPromote(piece, coord, { row: r, col: c }) });
            }
            break;
          }
          r += d.dr;
          c += d.dc;
        }
      }
      if (piece.promoted) {
        // 成り駒の場合、成れる場所を追加
        if (this._isTargetAvailable({ row: coord.row + 1, col: coord.col })) {
            moves.push({ from: coord, to: { row: coord.row + 1, col: coord.col }, canPromote: false });
        }
        if (this._isTargetAvailable({ row: coord.row - 1, col: coord.col })) {
          moves.push({ from: coord, to: { row: coord.row - 1, col: coord.col }, canPromote: false });
        }
        if (this._isTargetAvailable({ row: coord.row, col: coord.col + 1 })) {
          moves.push({ from: coord, to: { row: coord.row, col: coord.col + 1 }, canPromote: false });
        }
        if (this._isTargetAvailable({ row: coord.row, col: coord.col - 1 })) {
          moves.push({ from: coord, to: { row: coord.row, col: coord.col - 1 }, canPromote: false });
        }
      }
      return moves;
    } else if (piece.type === '飛') {
      const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      ];
      // 各方向に移動可能な範囲を探索
      for (const d of directions) {
        let nr = coord.row + d.dr;
        let nc = coord.col + d.dc;
        while (this._isTargetAvailable({ row: nr, col: nc })) {
          // 空マスの場合
          if (this.board[nr][nc] === null) {
            moves.push({ 
              from: coord, 
              to: { row: nr, col: nc },
              canPromote: this._canPromote(piece, coord, { row: nr, col: nc })
            });
          } 
          // 駒がある場合
          else {
            // 敵の駒なら、その位置まで移動可能
            if (this.board[nr][nc].owner !== piece.owner) {
              moves.push({ 
                from: coord, 
                to: { row: nr, col: nc },
                canPromote: this._canPromote(piece, coord, { row: nr, col: nc })
              });
            }
            // 駒があればそこで探索終了（味方の駒でも敵の駒でも）
            break;
          }
          nr += d.dr;
          nc += d.dc;
        }
      }
      if (piece.promoted) {
        // 成り駒の場合、成れる場所を追加
        if (this._isTargetAvailable({ row: coord.row + 1, col: coord.col + 1 })) {
          moves.push({ from: coord, to: { row: coord.row + 1, col: coord.col + 1 }, canPromote: false });
        }
        if (this._isTargetAvailable({ row: coord.row + 1, col: coord.col - 1 })) {
          moves.push({ from: coord, to: { row: coord.row + 1, col: coord.col - 1 }, canPromote: false });
        }
        if (this._isTargetAvailable({ row: coord.row - 1, col: coord.col + 1 })) {
          moves.push({ from: coord, to: { row: coord.row - 1, col: coord.col + 1 }, canPromote: false });
        }
        if (this._isTargetAvailable({ row: coord.row - 1, col: coord.col - 1 })) {
          moves.push({ from: coord, to: { row: coord.row - 1, col: coord.col - 1 }, canPromote: false });
        }
      }
      return moves;
    } else {
      console.warn(`getAvailableMovesはまだ実装されていません: ${piece.type}`);
    }
    return moves;
  }

  // 移動元または移動先がプロモーションゾーンに入っていれば promotion が可能と判定（ただし王・金は不可）
  _canPromote(piece, from, to) {
    if (piece.promoted) {
      return false;
    }
    if (piece.type === '王' || piece.type === '金') {
      return false;
    }
    const promotionZoneSente = [0, 1, 2];
    const promotionZoneGote = [6, 7, 8];
    if (piece.owner === 'sente') {
      return promotionZoneSente.includes(from.row) || promotionZoneSente.includes(to.row);
    } else {
      return promotionZoneGote.includes(from.row) || promotionZoneGote.includes(to.row);
    }
  }

  /**
   * 指定された移動を実行し、盤面を更新します
   * @param {Object} from - 移動元の座標または持ち駒情報
   * @param {number} [from.row] - 盤上の駒の場合の行番号（0-8）
   * @param {number} [from.col] - 盤上の駒の場合の列番号（0-8）
   * @param {boolean} [from.hand] - 持ち駒の場合はtrue
   * @param {string} [from.owner] - 持ち駒の場合の所有者
   * @param {string} [from.pieceType] - 持ち駒の場合の駒種
   * @param {Object} to - 移動先の座標
   * @param {number} to.row - 移動先の行番号（0-8）
   * @param {number} to.col - 移動先の列番号（0-8）
   * @param {boolean} [promote=false] - 成るかどうか
   * @throws {Error} 無効な移動が指定された場合
   */
  confirmMove(from, to, promote = false) {
    // ドロップ（持ち駒から盤面への打ち駒）の場合
    if (from && from.hand) {
      const owner = from.owner;
      if (!this._isValidCoordinate(to) || this.board[to.row][to.col] !== null) {
        throw new Error('打ち駒の位置が不正です');
      }
      const hand = this.hands[owner];
      const index = hand.findIndex(p => p.type === from.pieceType);
      if (index === -1) {
        throw new Error('指定された駒は持ち駒にありません');
      }
      const [piece] = hand.splice(index, 1);
      this.board[to.row][to.col] = piece;
      this.moveHistory.push({ drop: true, owner, piece, to });
      this.turn = owner === 'sente' ? 'gote' : 'sente';
      return;
    }

    // 通常の盤上移動の場合（from は座標オブジェクトと想定）
    const available = this.getAvailableMoves(from);
    const move = available.find(m => m.to.row === to.row && m.to.col === to.col);
    if (!move) {
      throw new Error('指定された移動は無効です');
    }
    const piece = this.board[from.row][from.col];
    const captured = this.board[to.row][to.col];
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    if (captured) {
      // 将棋では捕獲した駒は持ち駒となり、昇格状態はリセットされる
      captured.promoted = false;
      const originalOwner = captured.owner; // 捕獲前の所有者
      captured.owner = piece.owner;         // 所有権を捕獲したプレイヤーに変更
      this.hands[piece.owner].push(captured);
      this.moveHistory.push({ from, to, piece, captured, capturedOriginalOwner: originalOwner, promote });
    } else {
      this.moveHistory.push({ from, to, piece, promote });
    }
    if (promote && this._canPromote(piece, from, to)) {
      piece.promoted = true;
    }
    this.turn = piece.owner === 'sente' ? 'gote' : 'sente';
  }

  // 最後の一手を取り消す（undo）
  undoMove() {
    if (this.moveHistory.length === 0) {
      throw new Error('これ以上戻せません');
    }
    const last = this.moveHistory.pop();
    if (last.drop) {
      // 打ち駒の取り消し
      this.board[last.to.row][last.to.col] = null;
      this.hands[last.owner].push(last.piece);
      this.turn = last.owner;
    } else {
      this.board[last.from.row][last.from.col] = last.piece;
      if (last.captured) {
        // 持ち駒から削除した捕獲駒を戻す
        const hand = this.hands[last.piece.owner];
        const idx = hand.findIndex(p => p.type === last.captured.type);
        if (idx !== -1) {
          hand.splice(idx, 1);
        }
        last.captured.owner = last.capturedOriginalOwner;
        this.board[last.to.row][last.to.col] = last.captured;
      } else {
        this.board[last.to.row][last.to.col] = null;
      }
      this.turn = last.piece.owner;
    }
  }

  // 敵の攻撃下かどうかを判定する（シンプルな実装例）
  isSquareSafe(row, col, owner) {
    const enemy = (owner === 'sente') ? 'gote' : 'sente';
    // 盤上のすべての敵駒について、その駒が疑似的に到達できるか確認する
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = this.board[r][c];
        if (piece && piece.owner === enemy) {
          const pseudoMoves = this.getPseudoMoves({ row: r, col: c }, piece);
          if (pseudoMoves.some(m => m.to.row === row && m.to.col === col)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // 疑似的な移動候補を返す（王手検知用）。
  // 本来の getAvailableMoves とほぼ同様のロジックですが、王の安全性チェックは行いません
  getPseudoMoves(coord, piece) {
    let moves = [];
    // ここでは、歩と王のみの簡易実装例を示す。必要に応じて他の駒も追加してください
    if (piece.type === '歩') {
      const dir = (piece.owner === 'sente') ? -1 : 1;
      let nr = coord.row + dir, nc = coord.col;
      if (this._isValidCoordinate({ row: nr, col: nc }) && (this.board[nr][nc] === null || this.board[nr][nc].owner !== piece.owner))
        moves.push({ from: coord, to: { row: nr, col: nc } });
    } else if (piece.type === '王') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          let nr = coord.row + dx, nc = coord.col + dy;
          if (this._isValidCoordinate({ row: nr, col: nc }) && (this.board[nr][nc] === null || this.board[nr][nc].owner !== piece.owner))
            moves.push({ from: coord, to: { row: nr, col: nc } });
        }
      }
    } else if (piece.type === '飛') {
      const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      ];
      for (const d of directions) {
        let nr = coord.row + d.dr, nc = coord.col + d.dc;
        while (this._isValidCoordinate({ row: nr, col: nc })) {
          moves.push({ from: coord, to: { row: nr, col: nc } });
          nr += d.dr;
          nc += d.dc;
        }
      }
    }
    // ※ 他の駒については、本来の移動ロジックに合わせて実装してください
    return moves;
  }

  inBoard(row, col) {
    return row >= 0 && row < 9 && col >= 0 && col < 9;
  }
}

export default ShogiGame; 