// =============================================
// CPUAI.js - CPU人工知能
// =============================================

export class CPUAI {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
        
        // 難易度別の設定
        this.settings = {
            easy: {
                thinkTime: { min: 1000, max: 2000 },
                mistakeRate: 0.3,      // ミスする確率
                passRate: 0.2,         // 不必要にパスする確率
                revolutionThreshold: 5 // 革命を起こす手札枚数閾値
            },
            normal: {
                thinkTime: { min: 800, max: 1500 },
                mistakeRate: 0.1,
                passRate: 0.05,
                revolutionThreshold: 8
            },
            hard: {
                thinkTime: { min: 500, max: 1000 },
                mistakeRate: 0,
                passRate: 0,
                revolutionThreshold: 10
            }
        };
    }

    // 思考時間を取得
    getThinkTime() {
        const { min, max } = this.settings[this.difficulty].thinkTime;
        return min + Math.random() * (max - min);
    }

    // 手を選択
    async selectMove(player, gameLogic, gameState) {
        // 思考時間をシミュレート
        await this.delay(this.getThinkTime());

        const playableHands = gameLogic.getPlayableHands(player.hand);
        
        // 出せる手がない場合はパス
        if (playableHands.length === 0) {
            return { type: 'pass' };
        }

        const config = this.settings[this.difficulty];

        // 簡単モードでミスする可能性
        if (this.difficulty === 'easy' && Math.random() < config.mistakeRate) {
            // ランダムに手を選ぶか、パスする
            if (Math.random() < config.passRate) {
                return { type: 'pass' };
            }
            const randomHand = playableHands[Math.floor(Math.random() * playableHands.length)];
            return { type: 'play', cards: randomHand.cards };
        }

        // 戦略的な手の選択
        const selectedHand = this.selectStrategicMove(playableHands, player, gameLogic, gameState);

        if (selectedHand) {
            return { type: 'play', cards: selectedHand.cards };
        }

        return { type: 'pass' };
    }

    // 戦略的な手を選択
    selectStrategicMove(playableHands, player, gameLogic, gameState) {
        const config = this.settings[this.difficulty];
        const handCount = player.getHandCount();
        const isFieldEmpty = gameLogic.currentField.length === 0;

        // 革命の判断
        const revolutionHands = playableHands.filter(h => h.type === 'quad');
        if (revolutionHands.length > 0) {
            const shouldRevolution = this.shouldRevolution(player, gameLogic, gameState, config);
            if (shouldRevolution) {
                return revolutionHands[0];
            }
        }

        // 上がりそうな場合は強いカードを出す
        if (handCount <= 3) {
            return this.selectForFinishing(playableHands, gameLogic);
        }

        // 場が空の場合
        if (isFieldEmpty) {
            return this.selectForEmptyField(playableHands, player, gameLogic);
        }

        // 場にカードがある場合
        return this.selectToCounter(playableHands, gameLogic);
    }

    // 革命すべきか判断
    shouldRevolution(player, gameLogic, gameState, config) {
        const handCount = player.getHandCount();
        
        // 手札が少ない時は革命しない（上がり優先）
        if (handCount <= 4) return false;

        // 難易度による閾値チェック
        if (handCount > config.revolutionThreshold) {
            // 弱いカードが多い場合は革命する
            const weakCards = player.hand.filter(c => {
                const strength = c.getStrength(gameLogic.isRevolution);
                return gameLogic.isRevolution ? strength > 7 : strength < 7;
            });
            
            return weakCards.length >= handCount * 0.6;
        }

        return false;
    }

    // 上がり用の手を選択
    selectForFinishing(playableHands, gameLogic) {
        // 最も強いカードを出す
        const sorted = [...playableHands].sort((a, b) => b.strength - a.strength);
        return sorted[0];
    }

    // 場が空の時の手を選択
    selectForEmptyField(playableHands, player, gameLogic) {
        // 手札が少ない場合は強いカードから
        if (player.getHandCount() <= 5) {
            const sorted = [...playableHands].sort((a, b) => b.strength - a.strength);
            return sorted[0];
        }

        // 弱いカードから出していく戦略
        // ペアやトリプルを優先（手札を効率よく減らす）
        const pairs = playableHands.filter(h => h.type === 'pair');
        const triples = playableHands.filter(h => h.type === 'triple');
        
        if (triples.length > 0) {
            // 弱いトリプルから
            triples.sort((a, b) => a.strength - b.strength);
            return triples[0];
        }
        
        if (pairs.length > 0) {
            // 弱いペアから
            pairs.sort((a, b) => a.strength - b.strength);
            return pairs[0];
        }

        // シングルは弱いものから
        const singles = playableHands.filter(h => h.type === 'single');
        if (singles.length > 0) {
            singles.sort((a, b) => a.strength - b.strength);
            return singles[0];
        }

        return playableHands[0];
    }

    // カウンター手を選択
    selectToCounter(playableHands, gameLogic) {
        // 出せる手の中で最も弱い手を選ぶ（カードを節約）
        const sorted = [...playableHands].sort((a, b) => a.strength - b.strength);
        
        // 8切りできる手があれば優先
        const eightCuts = playableHands.filter(h => 
            h.cards.some(c => c.isEight && c.isEight())
        );
        
        if (eightCuts.length > 0) {
            // 他にも弱いカードが含まれている8切りを優先
            eightCuts.sort((a, b) => a.strength - b.strength);
            return eightCuts[0];
        }

        return sorted[0];
    }

    // 遅延
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
