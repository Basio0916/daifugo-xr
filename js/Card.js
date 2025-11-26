// =============================================
// Card.js - トランプカードクラス
// =============================================

export const SUITS = {
    SPADE: { name: 'spade', symbol: '♠', color: 'black' },
    HEART: { name: 'heart', symbol: '♥', color: 'red' },
    DIAMOND: { name: 'diamond', symbol: '♦', color: 'red' },
    CLUB: { name: 'club', symbol: '♣', color: 'black' }
};

export const SUIT_ORDER = [SUITS.SPADE, SUITS.HEART, SUITS.DIAMOND, SUITS.CLUB];

// カードの数字と表示名
export const RANKS = {
    3: { value: 3, display: '3', strength: 1 },
    4: { value: 4, display: '4', strength: 2 },
    5: { value: 5, display: '5', strength: 3 },
    6: { value: 6, display: '6', strength: 4 },
    7: { value: 7, display: '7', strength: 5 },
    8: { value: 8, display: '8', strength: 6 },
    9: { value: 9, display: '9', strength: 7 },
    10: { value: 10, display: '10', strength: 8 },
    11: { value: 11, display: 'J', strength: 9 },
    12: { value: 12, display: 'Q', strength: 10 },
    13: { value: 13, display: 'K', strength: 11 },
    1: { value: 1, display: 'A', strength: 12 },
    2: { value: 2, display: '2', strength: 13 },
    0: { value: 0, display: 'JOKER', strength: 14 } // ジョーカー
};

export class Card {
    constructor(suit, rank, isJoker = false) {
        this.suit = suit;
        this.rank = rank;
        this.isJoker = isJoker;
        this.id = isJoker ? 'joker' : `${suit.name}-${rank}`;
        this.selected = false;
    }

    // カードの強さを取得（革命状態を考慮）
    getStrength(isRevolution = false) {
        if (this.isJoker) return isRevolution ? 0 : 14;
        
        const baseStrength = RANKS[this.rank].strength;
        
        if (isRevolution) {
            // 革命時は強さを反転（3が最強、2が最弱）
            // ジョーカーは常に最強/最弱
            return 14 - baseStrength;
        }
        
        return baseStrength;
    }

    // 表示用の文字列
    getDisplay() {
        if (this.isJoker) return 'JOKER';
        return RANKS[this.rank].display;
    }

    // スート記号を取得
    getSuitSymbol() {
        if (this.isJoker) return '🃏';
        return this.suit.symbol;
    }

    // カードの色を取得
    getColor() {
        if (this.isJoker) return 'joker';
        return this.suit.color;
    }

    // DOM要素を生成
    createDOMElement() {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${this.getColor()}`;
        cardEl.dataset.cardId = this.id;
        
        if (this.isJoker) {
            cardEl.classList.add('joker');
            cardEl.innerHTML = `
                <div class="suit-rank">🃏</div>
                <div class="center-suit">JOKER</div>
            `;
        } else {
            cardEl.innerHTML = `
                <div class="suit-rank">${this.getDisplay()}${this.getSuitSymbol()}</div>
                <div class="center-suit">${this.getSuitSymbol()}</div>
                <div class="suit-rank bottom">${this.getDisplay()}${this.getSuitSymbol()}</div>
            `;
        }
        
        return cardEl;
    }

    // スペードの3かどうか
    isSpadeThree() {
        return !this.isJoker && this.suit === SUITS.SPADE && this.rank === 3;
    }

    // 8かどうか
    isEight() {
        return !this.isJoker && this.rank === 8;
    }

    // 比較用のキー
    getSortKey(isRevolution = false) {
        const strength = this.getStrength(isRevolution);
        const suitOrder = this.isJoker ? 4 : SUIT_ORDER.indexOf(this.suit);
        return strength * 10 + suitOrder;
    }

    // 同じ数字かどうか
    isSameRank(other) {
        if (this.isJoker || other.isJoker) return false;
        return this.rank === other.rank;
    }

    // 同じスートかどうか
    isSameSuit(other) {
        if (this.isJoker || other.isJoker) return false;
        return this.suit === other.suit;
    }

    // 連番かどうか（階段用）
    isConsecutive(other, isRevolution = false) {
        if (this.isJoker || other.isJoker) return false;
        
        const thisStrength = this.getStrength(isRevolution);
        const otherStrength = other.getStrength(isRevolution);
        
        return Math.abs(thisStrength - otherStrength) === 1;
    }

    // クローン
    clone() {
        const cloned = new Card(this.suit, this.rank, this.isJoker);
        cloned.selected = this.selected;
        return cloned;
    }

    // デバッグ用文字列
    toString() {
        if (this.isJoker) return 'JOKER';
        return `${this.getSuitSymbol()}${this.getDisplay()}`;
    }
}

// デッキを生成
export function createDeck(includeJokers = true) {
    const deck = [];
    
    // 通常のカード（3〜2まで）
    for (const suit of SUIT_ORDER) {
        for (let rank = 3; rank <= 13; rank++) {
            deck.push(new Card(suit, rank));
        }
        // A (1) と 2
        deck.push(new Card(suit, 1));
        deck.push(new Card(suit, 2));
    }
    
    // ジョーカー
    if (includeJokers) {
        deck.push(new Card(null, 0, true));
        deck.push(new Card(null, 0, true));
    }
    
    return deck;
}

// デッキをシャッフル
export function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// カードをソート
export function sortCards(cards, isRevolution = false) {
    return [...cards].sort((a, b) => a.getSortKey(isRevolution) - b.getSortKey(isRevolution));
}
