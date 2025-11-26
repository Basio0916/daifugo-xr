// =============================================
// GameLogic.js - 大富豪ゲームロジック
// =============================================

import { Card, SUITS, sortCards } from './Card.js';

// 役の種類
export const HAND_TYPES = {
    SINGLE: 'single',      // シングル
    PAIR: 'pair',          // ペア
    TRIPLE: 'triple',      // トリプル
    QUAD: 'quad',          // クアッド（4枚）
    SEQUENCE: 'sequence',  // 階段
    PASS: 'pass'           // パス
};

// プレイヤーのランク
export const PLAYER_RANKS = {
    DAIFUGO: { name: '大富豪', order: 0 },
    FUGO: { name: '富豪', order: 1 },
    HEIMIN: { name: '平民', order: 2 },
    HINMIN: { name: '貧民', order: 3 },
    DAIHINMIN: { name: '大貧民', order: 4 }
};

export class GameLogic {
    constructor(settings = {}) {
        // ゲーム設定
        this.settings = {
            revolutionEnabled: settings.revolutionEnabled ?? true,
            eightCutEnabled: settings.eightCutEnabled ?? true,
            spade3ReturnEnabled: settings.spade3ReturnEnabled ?? true,
            stairsEnabled: settings.stairsEnabled ?? true,
            playerCount: settings.playerCount ?? 4
        };
        
        // ゲーム状態
        this.isRevolution = false;
        this.currentField = [];      // 場に出ているカード
        this.currentFieldType = null; // 場の役タイプ
        this.passCount = 0;          // 連続パス数
        this.lastPlayerId = null;    // 最後にカードを出したプレイヤー
    }

    // 役の判定
    analyzeHand(cards) {
        if (!cards || cards.length === 0) {
            return { type: HAND_TYPES.PASS, cards: [], strength: 0 };
        }

        const sortedCards = sortCards(cards, this.isRevolution);
        const length = sortedCards.length;

        // ジョーカーの数をカウント
        const jokers = sortedCards.filter(c => c.isJoker);
        const normalCards = sortedCards.filter(c => !c.isJoker);

        // シングル
        if (length === 1) {
            return {
                type: HAND_TYPES.SINGLE,
                cards: sortedCards,
                strength: sortedCards[0].getStrength(this.isRevolution),
                isJokerSingle: sortedCards[0].isJoker
            };
        }

        // 同じ数字の組み合わせかチェック
        const isSameRank = this.checkSameRank(normalCards, jokers.length);
        
        if (isSameRank) {
            // ペア
            if (length === 2) {
                return {
                    type: HAND_TYPES.PAIR,
                    cards: sortedCards,
                    strength: this.getGroupStrength(normalCards, this.isRevolution)
                };
            }
            // トリプル
            if (length === 3) {
                return {
                    type: HAND_TYPES.TRIPLE,
                    cards: sortedCards,
                    strength: this.getGroupStrength(normalCards, this.isRevolution)
                };
            }
            // クアッド以上（革命可能）
            if (length >= 4) {
                return {
                    type: HAND_TYPES.QUAD,
                    cards: sortedCards,
                    strength: this.getGroupStrength(normalCards, this.isRevolution),
                    isRevolution: true
                };
            }
        }

        // 階段チェック
        if (this.settings.stairsEnabled && length >= 3) {
            const sequenceResult = this.checkSequence(normalCards, jokers.length);
            if (sequenceResult.isSequence) {
                return {
                    type: HAND_TYPES.SEQUENCE,
                    cards: sortedCards,
                    strength: sequenceResult.highestStrength,
                    sequenceLength: length,
                    suit: sequenceResult.suit,
                    isRevolution: length >= 5 // 5枚以上の階段で革命
                };
            }
        }

        return null; // 不正な組み合わせ
    }

    // 同じ数字かチェック（ジョーカー考慮）
    checkSameRank(normalCards, jokerCount) {
        if (normalCards.length === 0) return jokerCount > 0;
        
        const firstRank = normalCards[0].rank;
        return normalCards.every(card => card.rank === firstRank);
    }

    // グループの強さを取得
    getGroupStrength(normalCards, isRevolution) {
        if (normalCards.length === 0) return 14; // ジョーカーのみ
        return normalCards[0].getStrength(isRevolution);
    }

    // 階段チェック
    checkSequence(normalCards, jokerCount) {
        if (normalCards.length === 0) {
            return { isSequence: false };
        }

        // 同じスートかチェック
        const suit = normalCards[0].suit;
        if (!normalCards.every(card => card.suit === suit)) {
            return { isSequence: false };
        }

        // 強さでソート
        const strengths = normalCards.map(c => c.getStrength(this.isRevolution)).sort((a, b) => a - b);
        
        // 連番かチェック（ジョーカーで穴を埋められる）
        let gaps = 0;
        for (let i = 1; i < strengths.length; i++) {
            const diff = strengths[i] - strengths[i - 1];
            if (diff === 0) return { isSequence: false }; // 同じ強さは不可
            gaps += diff - 1;
        }

        if (gaps <= jokerCount) {
            return {
                isSequence: true,
                highestStrength: Math.max(...strengths),
                suit: suit
            };
        }

        return { isSequence: false };
    }

    // カードを出せるかチェック
    canPlayCards(cards, field = this.currentField) {
        if (!cards || cards.length === 0) return false;

        const handAnalysis = this.analyzeHand(cards);
        if (!handAnalysis) return false;

        // 場が空の場合は何でも出せる
        if (!field || field.length === 0) {
            return true;
        }

        const fieldAnalysis = this.analyzeHand(field);
        if (!fieldAnalysis) return false;

        // 同じ種類の役でないと出せない
        if (handAnalysis.type !== fieldAnalysis.type) {
            // 階段の場合は枚数も一致必要
            return false;
        }

        // 階段の場合は枚数一致が必要
        if (handAnalysis.type === HAND_TYPES.SEQUENCE) {
            if (handAnalysis.sequenceLength !== fieldAnalysis.sequenceLength) {
                return false;
            }
        }

        // スペ3返しチェック
        if (this.settings.spade3ReturnEnabled && 
            fieldAnalysis.isJokerSingle && 
            cards.length === 1 && 
            cards[0].isSpadeThree()) {
            return true;
        }

        // 強さ比較
        return handAnalysis.strength > fieldAnalysis.strength;
    }

    // カードをプレイ
    playCards(cards, playerId) {
        const result = {
            success: false,
            isRevolution: false,
            isEightCut: false,
            message: ''
        };

        if (!this.canPlayCards(cards)) {
            result.message = 'そのカードは出せません';
            return result;
        }

        const handAnalysis = this.analyzeHand(cards);

        // 場を更新
        this.currentField = cards;
        this.currentFieldType = handAnalysis.type;
        this.lastPlayerId = playerId;
        this.passCount = 0;

        result.success = true;

        // 革命チェック
        if (this.settings.revolutionEnabled && handAnalysis.isRevolution) {
            this.isRevolution = !this.isRevolution;
            result.isRevolution = true;
            result.message = '革命！';
        }

        // 8切りチェック
        if (this.settings.eightCutEnabled && cards.some(c => c.isEight())) {
            result.isEightCut = true;
            result.message = result.message ? result.message + ' 8切り！' : '8切り！';
            this.clearField();
        }

        return result;
    }

    // パス
    pass() {
        this.passCount++;
    }

    // 場をクリア
    clearField() {
        this.currentField = [];
        this.currentFieldType = null;
    }

    // 全員パスしたかチェック（最後にカードを出した人以外全員パス）
    shouldClearField(activePlayers) {
        return this.passCount >= activePlayers - 1;
    }

    // 出せるカードの組み合わせを取得（AI用）
    getPlayableHands(handCards) {
        const playable = [];
        const cards = [...handCards];

        // シングル
        for (const card of cards) {
            if (this.canPlayCards([card])) {
                playable.push({
                    cards: [card],
                    type: HAND_TYPES.SINGLE,
                    strength: card.getStrength(this.isRevolution)
                });
            }
        }

        // ペア、トリプル、クアッド
        const rankGroups = this.groupByRank(cards);
        for (const [rank, group] of Object.entries(rankGroups)) {
            // ペア
            if (group.length >= 2) {
                const pairs = this.getCombinations(group, 2);
                for (const pair of pairs) {
                    if (this.canPlayCards(pair)) {
                        playable.push({
                            cards: pair,
                            type: HAND_TYPES.PAIR,
                            strength: pair[0].getStrength(this.isRevolution)
                        });
                    }
                }
            }
            // トリプル
            if (group.length >= 3) {
                const triples = this.getCombinations(group, 3);
                for (const triple of triples) {
                    if (this.canPlayCards(triple)) {
                        playable.push({
                            cards: triple,
                            type: HAND_TYPES.TRIPLE,
                            strength: triple[0].getStrength(this.isRevolution)
                        });
                    }
                }
            }
            // クアッド
            if (group.length >= 4) {
                if (this.canPlayCards(group)) {
                    playable.push({
                        cards: group,
                        type: HAND_TYPES.QUAD,
                        strength: group[0].getStrength(this.isRevolution)
                    });
                }
            }
        }

        // 階段
        if (this.settings.stairsEnabled) {
            const sequences = this.findSequences(cards);
            for (const seq of sequences) {
                if (this.canPlayCards(seq)) {
                    playable.push({
                        cards: seq,
                        type: HAND_TYPES.SEQUENCE,
                        strength: Math.max(...seq.map(c => c.getStrength(this.isRevolution)))
                    });
                }
            }
        }

        return playable;
    }

    // ランク別にグループ化
    groupByRank(cards) {
        const groups = {};
        for (const card of cards) {
            if (card.isJoker) continue;
            const rank = card.rank;
            if (!groups[rank]) groups[rank] = [];
            groups[rank].push(card);
        }
        return groups;
    }

    // 組み合わせを取得
    getCombinations(array, size) {
        const results = [];
        
        function combine(start, combo) {
            if (combo.length === size) {
                results.push([...combo]);
                return;
            }
            for (let i = start; i < array.length; i++) {
                combo.push(array[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        }
        
        combine(0, []);
        return results;
    }

    // 階段を探す
    findSequences(cards) {
        const sequences = [];
        const suitGroups = {};

        // スート別にグループ化
        for (const card of cards) {
            if (card.isJoker) continue;
            const suitName = card.suit.name;
            if (!suitGroups[suitName]) suitGroups[suitName] = [];
            suitGroups[suitName].push(card);
        }

        // 各スートで階段を探す
        for (const [suit, suitCards] of Object.entries(suitGroups)) {
            if (suitCards.length < 3) continue;

            // 強さでソート
            const sorted = sortCards(suitCards, this.isRevolution);
            
            // 連続した部分列を探す
            for (let start = 0; start < sorted.length - 2; start++) {
                let sequence = [sorted[start]];
                let currentStrength = sorted[start].getStrength(this.isRevolution);

                for (let i = start + 1; i < sorted.length; i++) {
                    const nextStrength = sorted[i].getStrength(this.isRevolution);
                    if (nextStrength === currentStrength + 1) {
                        sequence.push(sorted[i]);
                        currentStrength = nextStrength;
                        
                        if (sequence.length >= 3) {
                            sequences.push([...sequence]);
                        }
                    } else if (nextStrength !== currentStrength) {
                        break;
                    }
                }
            }
        }

        return sequences;
    }

    // ランキングを決定
    getRankForPosition(position, totalPlayers) {
        if (totalPlayers === 4) {
            switch (position) {
                case 0: return PLAYER_RANKS.DAIFUGO;
                case 1: return PLAYER_RANKS.FUGO;
                case 2: return PLAYER_RANKS.HINMIN;
                case 3: return PLAYER_RANKS.DAIHINMIN;
            }
        } else if (totalPlayers === 3) {
            switch (position) {
                case 0: return PLAYER_RANKS.DAIFUGO;
                case 1: return PLAYER_RANKS.HEIMIN;
                case 2: return PLAYER_RANKS.DAIHINMIN;
            }
        }
        return PLAYER_RANKS.HEIMIN;
    }

    // ゲームリセット
    reset() {
        this.isRevolution = false;
        this.currentField = [];
        this.currentFieldType = null;
        this.passCount = 0;
        this.lastPlayerId = null;
    }
}
