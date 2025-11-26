// =============================================
// Player.js - プレイヤークラス
// =============================================

import { sortCards } from './Card.js';

export class Player {
    constructor(id, name, isHuman = false) {
        this.id = id;
        this.name = name;
        this.isHuman = isHuman;
        this.hand = [];          // 手札
        this.isActive = true;    // ゲームに参加中か
        this.rank = null;        // 順位（ゲーム終了時に設定）
        this.finishOrder = null; // 上がり順
    }

    // カードを受け取る
    receiveCards(cards) {
        this.hand.push(...cards);
        this.sortHand();
    }

    // 手札をソート
    sortHand(isRevolution = false) {
        this.hand = sortCards(this.hand, isRevolution);
    }

    // カードを出す
    playCards(cards) {
        for (const card of cards) {
            const index = this.hand.findIndex(c => c.id === card.id);
            if (index !== -1) {
                this.hand.splice(index, 1);
            }
        }
        return cards;
    }

    // 手札が空かどうか
    hasEmptyHand() {
        return this.hand.length === 0;
    }

    // 手札の枚数
    getHandCount() {
        return this.hand.length;
    }

    // 選択中のカードを取得
    getSelectedCards() {
        return this.hand.filter(card => card.selected);
    }

    // カードの選択を解除
    clearSelection() {
        for (const card of this.hand) {
            card.selected = false;
        }
    }

    // 特定のカードを持っているか
    hasCard(cardId) {
        return this.hand.some(c => c.id === cardId);
    }

    // スペード3を持っているか
    hasSpadeThree() {
        return this.hand.some(c => c.isSpadeThree && c.isSpadeThree());
    }

    // リセット
    reset() {
        this.hand = [];
        this.isActive = true;
        this.rank = null;
        this.finishOrder = null;
    }
}
