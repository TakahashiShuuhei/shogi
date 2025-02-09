// tests/shogi.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import ShogiGame from './shogi.js';

describe('ShogiGame', () => {
  let game;

  beforeEach(() => {
    game = new ShogiGame();
  });

  it('初期状態は正しく設定される', () => {
    // 盤面は9x9の配列になっている
    expect(game.getBoard().length).toBe(9);
    // 持ち駒は初期状態では空
    expect(game.hands.sente).toEqual([]);
    expect(game.hands.gote).toEqual([]);
  });

  it('歩兵の利用可能な移動先を取得できる', () => {
    // 例：sente の歩兵は盤面の 7 段目 (インデックス6) に配置されているので、前方＝上方向（senteは上に進む）
    const pawnCoord = { row: 6, col: 0 };
    const moves = game.getAvailableMoves(pawnCoord);
    // 期待：行番号が 5、列番号 0 への移動が可能
    expect(moves).toEqual([{ from: pawnCoord, to: { row: 5, col: 0 }, canPromote: false }]);
  });

  describe('confirmMove', () => {
    it('通常の盤上移動が正常に動作する', () => {
      const pawnCoord = { row: 6, col: 0 };
      const targetCoord = { row: 5, col: 0 };
      const initialTurn = game.turn;
      game.confirmMove(pawnCoord, targetCoord);
      const board = game.getBoard();
      // 移動先に歩兵が存在する
      expect(board[5][0]).toEqual({ type: '歩', owner: 'sente', promoted: false });
      // 移動元は空になっている
      expect(board[6][0]).toBeNull();
      // moveHistory に1手記録されている
      expect(game.getHistory().length).toBe(1);
      // 手番が切り替わっている（sente -> gote）
      expect(game.turn).not.toBe(initialTurn);
    });

    it('打ち駒が正常に動作する', () => {
      const capturedPawn = { type: '歩', owner: 'sente', promoted: false };
      game.hands.sente.push(capturedPawn);
      const handCoord = { hand: true, owner: 'sente', pieceType: '歩' };
      const dropTarget = { row: 4, col: 4 };
      const initialTurn = game.turn;
      game.confirmMove(handCoord, dropTarget);
      const board = game.getBoard();
      // 指定位置に打ち駒が配置されている
      expect(board[4][4]).toEqual(capturedPawn);
      // 持ち駒リストからは削除されている
      expect(game.hands.sente).toHaveLength(0);
      // moveHistory の最終エントリに drop フラグがある
      const lastMove = game.getHistory()[game.getHistory().length - 1];
      expect(lastMove).toHaveProperty('drop', true);
      // 手番が切り替わっている
      expect(game.turn).not.toBe(initialTurn);
    });

    it('不正な盤上移動の場合、エラーをスローする', () => {
      const pawnCoord = { row: 6, col: 0 };
      // pawn の getAvailableMoves には (5,0) しかないので、(4,0) は不正な移動とする
      const invalidTarget = { row: 4, col: 0 };
      expect(() => game.confirmMove(pawnCoord, invalidTarget))
         .toThrow('指定された移動は無効です');
    });

    it('不正な打ち駒位置の場合、エラーをスローする', () => {
      const capturedPawn = { type: '歩', owner: 'sente', promoted: false };
      game.hands.sente.push(capturedPawn);
      // 盤上の既に埋まっている位置（例: 初期配置で埋まっている (8,0)）を指定
      const dropTarget = { row: 8, col: 0 };
      const handCoord = { hand: true, owner: 'sente', pieceType: '歩' };
      expect(() => game.confirmMove(handCoord, dropTarget))
         .toThrow('打ち駒の位置が不正です');
    });

    it('キャプチャされた駒が持ち駒に追加される', () => {
      // 対象のマスに相手の駒を配置してキャプチャを発生させる
      const pawnCoord = { row: 6, col: 0 };
      const targetCoord = { row: 5, col: 0 };
      // 相手の駒（gote の歩兵）を配置
      game.board[5][0] = { type: '歩', owner: 'gote', promoted: false };
      const initialTurn = game.turn;
      game.confirmMove(pawnCoord, targetCoord);
      // 捕獲した駒が持ち駒へ追加されている
      expect(game.hands.sente.length).toBeGreaterThan(0);
      const captured = game.hands.sente[0];
      expect(captured.type).toBe('歩');
      expect(captured.owner).toBe('sente');
      // moveHistory にキャプチャ情報が記録されている
      const lastMove = game.getHistory()[game.getHistory().length - 1];
      expect(lastMove).toHaveProperty('captured');
      expect(lastMove.capturedOriginalOwner).toBe('gote');
      // 手番が切り替わっている
      expect(game.turn).not.toBe(initialTurn);
    });

    it('成りが可能な場合、成りを指定したらプロモーションを正しく適用する', () => {
      // 盤面の空いているセルに、近くにプロモーションゾーンがある pawn を配置する
      game.board[3][0] = { type: '歩', owner: 'sente', promoted: false };
      const pawnCoord = { row: 3, col: 0 };
      const targetCoord = { row: 2, col: 0 }; // senteのプロモーションゾーン（0,1,2）
      game.confirmMove(pawnCoord, targetCoord, true);
      const board = game.getBoard();
      expect(board[2][0]).toEqual({ type: '歩', owner: 'sente', promoted: true });
    });

    it('成りが可能な場合、成りを指定しなければプロモーションされない', () => {
      game.board[3][1] = { type: '歩', owner: 'sente', promoted: false };
      const pawnCoord = { row: 3, col: 1 };
      const targetCoord = { row: 2, col: 1 };
      game.confirmMove(pawnCoord, targetCoord, false);
      const board = game.getBoard();
      expect(board[2][1]).toEqual({ type: '歩', owner: 'sente', promoted: false });
    });

    it('プロモーション済みの駒は成らない', () => {
      // 既に成っている駒の場合、改めて promote フラグを指定しても状態は変わらない
      game.board[3][2] = { type: '歩', owner: 'sente', promoted: true };
      const pawnCoord = { row: 3, col: 2 };
      const targetCoord = { row: 2, col: 2 };
      game.confirmMove(pawnCoord, targetCoord, true);
      const board = game.getBoard();
      expect(board[2][2]).toEqual({ type: '歩', owner: 'sente', promoted: true });
    });
  });

  describe('getAvailableMoves', () => {
    it('盤上の駒の場合、正しい移動先が返される', () => {
      // 盤面を空の9x9マトリックスに置き換える
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      
      // 各テストケース: { name, piece, coord, expected }
      // ※ 現状の実装では promoted な場合も処理は変更されない前提
      const testCases = [
        {
          name: '歩 (sente, non-promoted)',
          piece: { type: '歩', owner: 'sente', promoted: false },
          coord: { row: 6, col: 0 },
          expected: [{ row: 5, col: 0 }]
        },
        {
          name: '歩 (gote, non-promoted)',
          piece: { type: '歩', owner: 'gote', promoted: false },
          coord: { row: 2, col: 0 },
          expected: [{ row: 3, col: 0 }]
        },
        {
          name: '銀 (sente)',
          piece: { type: '銀', owner: 'sente', promoted: false },
          coord: { row: 4, col: 4 },
          expected: [
            { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
            { row: 5, col: 3 }, { row: 5, col: 5 }
          ]
        },
        {
          name: '銀 (gote)',
          piece: { type: '銀', owner: 'gote', promoted: false },
          coord: { row: 4, col: 4 },
          expected: [
            { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 },
            { row: 3, col: 3 }, { row: 3, col: 5 }
          ]
        },
        {
          name: '桂 (sente)',
          piece: { type: '桂', owner: 'sente', promoted: false },
          coord: { row: 6, col: 4 },
          expected: [
            { row: 4, col: 3 }, { row: 4, col: 5 }
          ]
        },
        {
          name: '桂 (gote)',
          piece: { type: '桂', owner: 'gote', promoted: false },
          coord: { row: 2, col: 4 },
          expected: [
            { row: 4, col: 3 }, { row: 4, col: 5 }
          ]
        },
        {
          name: '桂 (sente, can promote)',
          piece: { type: '桂', owner: 'sente', promoted: false },
          coord: { row: 4, col: 4 },
          expected: [
            { row: 2, col: 3, canPromote: true }, { row: 2, col: 5, canPromote: true }
          ]
        },
        {
          name: '桂 (gote, can promote)',
          piece: { type: '桂', owner: 'gote', promoted: false },
          coord: { row: 5, col: 4 },
          expected: [
            { row: 7, col: 3, canPromote: true }, { row: 7, col: 5, canPromote: true }
          ]
        },
        {
          name: '香 (sente)',
          piece: { type: '香', owner: 'sente', promoted: false },
          coord: { row: 6, col: 4 },
          // sente は上方向（dr = -1）へ連続移動可能。境界は row 0
          expected: [
            { row: 5, col: 4 }, { row: 4, col: 4 }, { row: 3, col: 4 },
            { row: 2, col: 4, canPromote: true }, { row: 1, col: 4, canPromote: true }, { row: 0, col: 4, canPromote: true }
          ]
        },
        {
          name: '香 (gote)',
          piece: { type: '香', owner: 'gote', promoted: false },
          coord: { row: 2, col: 4 },
          // gote は下方向（dr = 1）へ連続移動可能。境界は row 8 
          expected: [
            { row: 3, col: 4 }, { row: 4, col: 4 }, { row: 5, col: 4 },
            { row: 6, col: 4, canPromote: true }, { row: 7, col: 4, canPromote: true }, { row: 8, col: 4, canPromote: true }
          ]
        },
        {
          name: '角 (sente)',
          piece: { type: '角', owner: 'sente', promoted: false },
          coord: { row: 4, col: 4 },
          expected: [
            // top-left
            { row: 3, col: 3 }, { row: 2, col: 2, canPromote: true }, { row: 1, col: 1, canPromote: true }, { row: 0, col: 0, canPromote: true },
            // top-right
            { row: 3, col: 5 }, { row: 2, col: 6, canPromote: true }, { row: 1, col: 7, canPromote: true }, { row: 0, col: 8, canPromote: true },
            // bottom-left
            { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 }, { row: 8, col: 0 },
            // bottom-right
            { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 }, { row: 8, col: 8 }
          ]
        },
        {
          name: '飛 (sente)',
          piece: { type: '飛', owner: 'sente', promoted: false },
          coord: { row: 4, col: 4 },
          expected: [
            // Up
            { row: 3, col: 4 }, { row: 2, col: 4, canPromote: true }, { row: 1, col: 4, canPromote: true }, { row: 0, col: 4, canPromote: true },
            // Down
            { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 }, { row: 8, col: 4 },
            // Left
            { row: 4, col: 3 }, { row: 4, col: 2, }, { row: 4, col: 1 }, { row: 4, col: 0 },
            // Right
            { row: 4, col: 5 }, { row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }
          ]
        },
        {
          name: '歩 (sente, promoted)',
          piece: { type: '歩', owner: 'sente', promoted: true },
          coord: { row: 6, col: 1 },
          expected: [
            { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 2 },
            { row: 6, col: 0 }, { row: 6, col: 2 },
            { row: 7, col: 1 }
          ]
        },
        {
          name: '銀 (gote, promoted)',
          piece: { type: '銀', owner: 'gote', promoted: true },
          coord: { row: 4, col: 5 },
          expected: [
            { row: 3, col: 5 },
            { row: 4, col: 4 }, { row: 4, col: 6 },
            { row: 5, col: 4 }, { row: 5, col: 5 }, { row: 5, col: 6 },
          ]
        },
        {
          name: '香 (sente, promoted)',
          piece: { type: '香', owner: 'sente', promoted: true },
          coord: { row: 4, col: 4 },
          expected: [
            { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
            { row: 4, col: 3 }, { row: 4, col: 5 },
            { row: 5, col: 4 }
          ]
        },
        {
          name: '桂 (gote, promoted)',
          piece: { type: '桂', owner: 'gote', promoted: true },
          coord: { row: 3, col: 3 },
          expected: [
            { row: 2, col: 3 },
            { row: 3, col: 2 }, { row: 3, col: 4 },
            { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 }
          ]
        },
        {
          name: '飛 (gote, promoted)',
          piece: { type: '飛', owner: 'gote', promoted: true },
          coord: { row: 5, col: 5 },
          expected: [
            // 縦
            { row: 4, col: 5 }, { row: 3, col: 5 }, { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 0, col: 5 },
            { row: 6, col: 5 }, { row: 7, col: 5 }, { row: 8, col: 5 },
            // 横
            { row: 5, col: 4 }, { row: 5, col: 3 }, { row: 5, col: 2 }, { row: 5, col: 1 }, { row: 5, col: 0 },
            { row: 5, col: 6 }, { row: 5, col: 7 }, { row: 5, col: 8 },
            // 斜め1マス（成り駒の追加の動き）
            { row: 4, col: 4 }, { row: 4, col: 6 },
            { row: 6, col: 4 }, { row: 6, col: 6 }
          ]
        },
        {
          name: '角 (sente, promoted)',
          piece: { type: '角', owner: 'sente', promoted: true },
          coord: { row: 4, col: 4 },
          expected: [
            // 斜め
            // top-left
            { row: 3, col: 3 }, { row: 2, col: 2 }, { row: 1, col: 1 }, { row: 0, col: 0 },
            // top-right
            { row: 3, col: 5 }, { row: 2, col: 6 }, { row: 1, col: 7 }, { row: 0, col: 8 },
            // bottom-left
            { row: 5, col: 3 }, { row: 6, col: 2 }, { row: 7, col: 1 }, { row: 8, col: 0 },
            // bottom-right
            { row: 5, col: 5 }, { row: 6, col: 6 }, { row: 7, col: 7 }, { row: 8, col: 8 },
            // 上下左右1マス（成り駒の追加の動き）
            { row: 3, col: 4 }, { row: 5, col: 4 },
            { row: 4, col: 3 }, { row: 4, col: 5 }
          ]
        },
        {
          name: '歩 (sente, can promote)',
          piece: { type: '歩', owner: 'sente', promoted: false },
          coord: { row: 3, col: 0 },
          expected: [
            { row: 2, col: 0, canPromote: true }  // 3段目から2段目への移動は成れる
          ]
        },
        {
          name: '歩 (gote, can promote)',
          piece: { type: '歩', owner: 'gote', promoted: false },
          coord: { row: 5, col: 0 },
          expected: [
            { row: 6, col: 0, canPromote: true }  // 5段目から6段目への移動は成れる
          ]
        },
        {
          name: '飛 (sente, from promotion zone)',
          piece: { type: '飛', owner: 'sente', promoted: false },
          coord: { row: 1, col: 4 },  // 2段目にいる飛車
          expected: [
            // Up
            { row: 0, col: 4, canPromote: true },
            // Down
            { row: 2, col: 4, canPromote: true }, { row: 3, col: 4, canPromote: true }, 
            { row: 4, col: 4, canPromote: true }, { row: 5, col: 4, canPromote: true },
            { row: 6, col: 4, canPromote: true }, { row: 7, col: 4, canPromote: true }, 
            { row: 8, col: 4, canPromote: true },
            // Left
            { row: 1, col: 3, canPromote: true }, { row: 1, col: 2, canPromote: true }, 
            { row: 1, col: 1, canPromote: true }, { row: 1, col: 0, canPromote: true },
            // Right
            { row: 1, col: 5, canPromote: true }, { row: 1, col: 6, canPromote: true }, 
            { row: 1, col: 7, canPromote: true }, { row: 1, col: 8, canPromote: true }
          ]
        },
        {
          name: '角 (gote, from promotion zone)',
          piece: { type: '角', owner: 'gote', promoted: false },
          coord: { row: 7, col: 4 },  // 8段目にいる角
          expected: [
            // top-left
            { row: 6, col: 3, canPromote: true }, { row: 5, col: 2, canPromote: true }, 
            { row: 4, col: 1, canPromote: true }, { row: 3, col: 0, canPromote: true },
            // top-right
            { row: 6, col: 5, canPromote: true }, { row: 5, col: 6, canPromote: true }, 
            { row: 4, col: 7, canPromote: true }, { row: 3, col: 8, canPromote: true },
            // bottom-left
            { row: 8, col: 3, canPromote: true },
            // bottom-right
            { row: 8, col: 5, canPromote: true }
          ]
        }
      ];
      
      // 並び順が異なる場合があるため、比較用のソート関数
      const sortFn = (a, b) => a.row - b.row || a.col - b.col;
      
      // 各テストケースを実行
      testCases.forEach(({ name, piece, coord, expected }) => {
        // 指定座標にテスト用駒を配置
        game.board[coord.row][coord.col] = { ...piece };
        // 指定座標から移動先一覧を取得
        const moves = game.getAvailableMoves(coord);
        
        // 期待値に canPromote が指定されていない場合は false とみなす
        const expectedWithPromote = expected.map(e => 
          typeof e.canPromote === 'undefined' ? { ...e, canPromote: false } : e
        );

        // 取得した移動先を比較用に整形
        const actual = moves.map(m => ({
          row: m.to.row,
          col: m.to.col,
          canPromote: m.canPromote
        }));

        expect.soft(actual.sort(sortFn), `${name} の移動範囲が正しくありません`)
          .toEqual(expectedWithPromote.sort(sortFn));

        // 次のテストのため、セルをクリア
        game.board[coord.row][coord.col] = null;
      });
    });

    it('持ち駒の場合、打てる空きマスのみが返される', () => {
      // 盤面作成： (0,0) と (8,8) に駒がある。それ以外は空。
      game.board = Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => {
          if ((r === 0 && c === 0) || (r === 8 && c === 8)) {
            return { type: 'dummy', owner: 'sente' };
          }
          return null;
        })
      );

      // sente の歩は打てるが、sente は打った歩を行0には打てない（行0は不合法）
      const handMoves = game.getAvailableMoves({ hand: true, owner: 'sente', pieceType: '歩' });

      handMoves.forEach(move => {
        const { row, col } = move.to;
        expect(game.board[row][col]).toBeNull();
        // また、sente の歩は行0には打てない
        expect(row).not.toBe(0);
      });

      // 空いているセルは 81 - 2 = 79 だが、行0は全て除外（空いている行0は 8セル）⇒ 79 - 8 = 71
      expect(handMoves.length).toBe(71);
    });

    it('打ち駒ルールの制約を考慮した移動先が返される', () => {
      // 同一列（ここでは col=0）に未成歩がある場合、歩の打ちはその列では不可
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      game.board[5][0] = { type: '歩', owner: 'sente', promoted: false };

      const handMoves = game.getAvailableMoves({ hand: true, owner: 'sente', pieceType: '歩' });
      // まず、col 0 への打ち駒が存在しないことをチェック
      const illegalDrops = handMoves.filter(move => move.to.col === 0);
      expect(illegalDrops.length).toBe(0);
      // 結果、全体の打ち駒候補数は先の 72 から col0（8セル分）が除かれる ⇒ 72 - 8 = 64
      expect(handMoves.length).toBe(64);
    });

    it('香車の前方に味方の駒がある場合、移動先が制限される', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // sente の香車を (6,4) に配置
      game.board[6][4] = { type: '香', owner: 'sente', promoted: false };
      // 同じ所有者の駒を、香車の前方（上方向：row が小さい方向）に配置
      game.board[4][4] = { type: 'dummy', owner: 'sente' };

      const moves = game.getAvailableMoves({ row: 6, col: 4 });
      // 移動はブロックする友軍のいるセルには入れないので、(4,4)は除外され、(5,4) のみとなる想定
      const available = moves.map(m => m.to);
      // 念のためソートして比較
      available.sort((a, b) => a.row - b.row || a.col - b.col);
      expect(available).toEqual([{ row: 5, col: 4 }]);
    });

    it('香車の前方に敵の駒がある場合、その駒までは移動可能だが、その先は移動不可', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // sente の香車を (6,4) に配置
      game.board[6][4] = { type: '香', owner: 'sente', promoted: false };
      // 敵駒（gote）を、香車の前方に配置
      game.board[4][4] = { type: 'dummy', owner: 'gote' };

      const moves = game.getAvailableMoves({ row: 6, col: 4 });
      const available = moves.map(m => m.to).sort((a, b) => a.row - b.row || a.col - b.col);
      // ※ 昇順にソートすると、{ row: 4, col: 4 } が先、その後 { row: 5, col: 4 } となる
      expect(available).toEqual([{ row: 4, col: 4 }, { row: 5, col: 4 }]);
    });

    it('飛車の経路上に味方の駒がある場合、移動先が制限される', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // sente の飛車を (4,4) に配置
      game.board[4][4] = { type: '飛', owner: 'sente', promoted: false };
      // 上方向に味方の駒を配置: (2,4)
      game.board[2][4] = { type: 'dummy', owner: 'sente' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      // 上方向の移動（col==4, row < 4）を抽出
      const upward = moves.filter(m => m.to.col === 4 && m.to.row < 4)
                           .sort((a,b) => a.to.row - b.to.row);
      // 友軍ブロックにより、(2,4) は含まれず、(3,4) のみが返る
      expect(upward.map(m => m.to)).toEqual([{ row: 3, col: 4 }]);
    });

    it('飛車の経路上に敵の駒がある場合、その駒までは移動可能だが、その先は移動不可', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // sente の飛車（非成）を (4,4) に配置
      game.board[4][4] = { type: '飛', owner: 'sente', promoted: false };
      // 上方向に敵駒を配置: (2,4)
      game.board[2][4] = { type: 'dummy', owner: 'gote' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      // 上方向の移動候補を row 昇順でソート
      const upward = moves.filter(m => m.to.col === 4 && m.to.row < 4)
                           .sort((a, b) => a.to.row - b.to.row);
      // 期待値は、昇順なら { row: 2, col: 4 } と { row: 3, col: 4 } の順となる
      expect(upward.map(m => m.to)).toEqual([{ row: 2, col: 4 }, { row: 3, col: 4 }]);
    });

    it('角の経路上に味方の駒がある場合、移動先が制限される', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // sente の角を (4,4) に配置
      game.board[4][4] = { type: '角', owner: 'sente', promoted: false };
      // 上左方向に友軍駒を配置: (2,2)
      game.board[2][2] = { type: 'dummy', owner: 'sente' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const topLeft = moves.filter(m => m.to.row < 4 && m.to.col < 4)
                            .sort((a,b) => a.to.row - b.to.row || a.to.col - b.to.col);
      // ブロックにより (2,2) は取得せず、(3,3) のみ
      expect(topLeft.map(m => m.to)).toEqual([{ row: 3, col: 3 }]);
    });

    it('角の経路上に敵の駒がある場合、その駒までは移動可能だが、その先は移動不可', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      game.board[4][4] = { type: '角', owner: 'sente', promoted: false };
      // 敵駒 (gote) を上左に配置: (2,2)
      game.board[2][2] = { type: 'dummy', owner: 'gote' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const topLeft = moves.filter(m => m.to.row < 4 && m.to.col < 4)
                            .sort((a,b) => a.to.row - b.to.row || a.to.col - b.to.col);
      // (3,3) と (2,2) が返る
      expect(topLeft.map(m => m.to)).toEqual([{ row: 2, col: 2 }, { row: 3, col: 3 }]);
    });

    it('龍（成飛）の経路上に味方の駒がある場合、移動先が制限される', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // promoted 飛（龍）を (4,4) に配置
      game.board[4][4] = { type: '飛', owner: 'sente', promoted: true };
      // 上方向に友軍駒を配置: (2,4)
      game.board[2][4] = { type: 'dummy', owner: 'sente' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const upward = moves.filter(m => m.to.col === 4 && m.to.row < 4)
                          .sort((a,b) => a.to.row - b.to.row);
      // expected: upward movesは {3,4} のみ
      expect(upward.map(m => m.to)).toEqual([{ row: 3, col: 4 }]);
    });

    it('龍（成飛）の経路上に敵の駒がある場合、その駒までは移動可能だが、その先は移動不可', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      game.board[4][4] = { type: '飛', owner: 'sente', promoted: true };
      // 敵駒を上方向に配置: (2,4)
      game.board[2][4] = { type: 'dummy', owner: 'gote' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const upward = moves.filter(m => m.to.col === 4 && m.to.row < 4)
                          .sort((a,b) => a.to.row - b.to.row);
      // expected: upward movesは {3,4} と {2,4} の2件
      expect(upward.map(m => m.to)).toEqual([{ row: 2, col: 4 }, { row: 3, col: 4 }]);
    });

    it('馬（成角）の経路上に味方の駒がある場合、移動先が制限される', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // promoted 角（馬）を (4,4) に配置
      game.board[4][4] = { type: '角', owner: 'sente', promoted: true };
      // 上左に友軍駒を配置: (2,2)
      game.board[2][2] = { type: 'dummy', owner: 'sente' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const topLeft = moves.filter(m => m.to.row < 4 && m.to.col < 4)
                            .sort((a,b) => a.to.row-b.to.row || a.to.col-b.to.col);
      // expected: only {3,3}
      expect(topLeft.map(m => m.to)).toEqual([{ row: 3, col: 3 }]);
    });

    it('馬（成角）の経路上に敵の駒がある場合、その駒までは移動可能だが、その先は移動不可', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      game.board[4][4] = { type: '角', owner: 'sente', promoted: true };
      // 敵駒を上左に配置: (2,2)
      game.board[2][2] = { type: 'dummy', owner: 'gote' };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const topLeft = moves.filter(m => m.to.row < 4 && m.to.col < 4)
                            .sort((a,b) => a.to.row-b.to.row || a.to.col-b.to.col);
      // expected: {3,3} と {2,2}
      expect(topLeft.map(m => m.to)).toEqual([{ row: 2, col: 2 }, { row: 3, col: 3 }]);
    });

    it('王の移動先が相手に取られる場所であれば移動できない', () => {
      game.board = Array.from({ length: 9 }, () => Array(9).fill(null));
      // sente の王を (4,4) に配置
      game.board[4][4] = { type: '王', owner: 'sente' };
      // 敵の飛車（gote）を (4,8) に配置し、行4全体を攻撃下とみなす
      game.board[4][8] = { type: '飛', owner: 'gote', promoted: false };

      const moves = game.getAvailableMoves({ row: 4, col: 4 });
      const available = moves.map(m => m.to);
      // 本来、王は隣接8マスのうち、行4（つまり (4,3) と (4,5)）は敵の攻撃下なら除外されるべき
      const expected = [
        { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
      ];
      const sortFn = (a, b) => a.row - b.row || a.col - b.col;
      expect(available.sort(sortFn)).toEqual(expected.sort(sortFn));
    });
  });
});