// =============================================
// Game.js - ゲームメインクラス
// =============================================

import { createDeck, shuffleDeck, sortCards } from './Card.js';
import { GameLogic, HAND_TYPES } from './GameLogic.js';
import { Player } from './Player.js';
import { CPUAI } from './CPUAI.js';
import { WebXRScene } from './WebXRScene.js';
import { EffectsManager } from './EffectsManager.js';
import { SoundManager } from './SoundManager.js';

export class Game {
    constructor() {
        // マネージャー初期化
        this.effects = new EffectsManager();
        this.sound = new SoundManager();
        this.scene = null;
        
        // ゲーム状態
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameLogic = null;
        this.isGameRunning = false;
        this.finishOrder = [];
        
        // 設定
        this.settings = {
            playerCount: 4,
            cpuDifficulty: 'normal',
            revolutionEnabled: true,
            eightCutEnabled: true,
            spade3ReturnEnabled: true,
            stairsEnabled: true
        };
        
        // AI
        this.cpuAI = null;
        
        // UI要素
        this.ui = {};
        
        this.init();
    }

    async init() {
        // UI要素を取得
        this.setupUI();
        
        // サウンド初期化は最初のユーザーインタラクションで
        document.addEventListener('click', () => this.sound.init(), { once: true });
        
        // 3Dシーン初期化
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            this.scene = new WebXRScene(canvas);
        }
        
        // イベントリスナー設定
        this.setupEventListeners();
        
        // ローディング完了
        setTimeout(() => {
            this.hideLoading();
            this.showScreen('title');
        }, 1500);
    }

    setupUI() {
        this.ui = {
            screens: {
                loading: document.getElementById('loading-screen'),
                title: document.getElementById('title-screen'),
                settings: document.getElementById('settings-screen'),
                rules: document.getElementById('rules-screen'),
                game: document.getElementById('game-screen')
            },
            game: {
                turnIndicator: document.getElementById('current-player-name'),
                fieldCards: document.getElementById('field-cards'),
                fieldTurnRing: document.getElementById('field-turn-ring'),
                playerHand: document.getElementById('player-hand'),
                handArea: document.getElementById('hand-area'),
                playBtn: document.getElementById('play-btn'),
                passBtn: document.getElementById('pass-btn'),
                playersInfo: document.querySelectorAll('.player-info'),
                cpuPlayers: document.querySelectorAll('.cpu-player'),
                revolutionIndicator: document.getElementById('revolution-indicator'),
                messageDisplay: document.getElementById('message-display'),
                resultOverlay: document.getElementById('result-overlay'),
                resultTitle: document.getElementById('result-title'),
                resultRankings: document.getElementById('result-rankings')
            }
        };
    }

    setupEventListeners() {
        // タイトル画面
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.startNewGame();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.showScreen('settings');
        });

        document.getElementById('rules-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.showScreen('rules');
        });

        document.getElementById('enter-vr-btn')?.addEventListener('click', async () => {
            this.sound.playButtonClick();
            if (this.scene) {
                const success = await this.scene.enterVR();
                if (success) {
                    this.startNewGame();
                }
            }
        });

        // 設定画面
        document.getElementById('settings-back-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.saveSettings();
            this.showScreen('title');
        });

        document.getElementById('rules-back-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.showScreen('title');
        });

        // プレイヤー数選択
        document.getElementById('player-count')?.addEventListener('change', (e) => {
            this.settings.playerCount = parseInt(e.target.value);
        });

        // 難易度選択
        document.getElementById('cpu-difficulty')?.addEventListener('change', (e) => {
            this.settings.cpuDifficulty = e.target.value;
        });

        // 設定チェックボックス
        document.getElementById('revolution-enabled')?.addEventListener('change', (e) => {
            this.settings.revolutionEnabled = e.target.checked;
        });
        document.getElementById('eight-cut-enabled')?.addEventListener('change', (e) => {
            this.settings.eightCutEnabled = e.target.checked;
        });
        document.getElementById('spade3-return-enabled')?.addEventListener('change', (e) => {
            this.settings.spade3ReturnEnabled = e.target.checked;
        });
        document.getElementById('stairs-enabled')?.addEventListener('change', (e) => {
            this.settings.stairsEnabled = e.target.checked;
        });

        // 音量設定
        document.getElementById('bgm-volume')?.addEventListener('input', (e) => {
            this.sound.setBGMVolume(e.target.value / 100);
        });
        document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
            this.sound.setSFXVolume(e.target.value / 100);
        });

        // ゲームアクション
        this.ui.game.playBtn?.addEventListener('click', () => this.playSelectedCards());
        this.ui.game.passBtn?.addEventListener('click', () => this.pass());

        // 結果画面
        document.getElementById('rematch-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.hideResult();
            this.startNewGame();
        });

        document.getElementById('back-to-title-btn')?.addEventListener('click', () => {
            this.sound.playButtonClick();
            this.hideResult();
            this.showScreen('title');
        });
    }

    saveSettings() {
        // 設定を保存（LocalStorageなど）
        localStorage.setItem('daifugo-settings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('daifugo-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }

    hideLoading() {
        this.ui.screens.loading?.classList.add('fade-out');
        setTimeout(() => {
            this.ui.screens.loading?.classList.add('hidden');
        }, 500);
    }

    showScreen(screenName) {
        Object.values(this.ui.screens).forEach(screen => {
            screen?.classList.add('hidden');
        });
        this.ui.screens[screenName]?.classList.remove('hidden');
    }

    // ゲーム開始
    async startNewGame() {
        await this.sound.init();
        await this.sound.resume();
        
        this.showScreen('game');
        
        // プレイヤー初期化
        this.players = [];
        this.players.push(new Player(0, 'あなた', true));
        
        const cpuNames = ['太郎', '花子', '次郎', '美咲'];
        for (let i = 1; i < this.settings.playerCount; i++) {
            this.players.push(new Player(i, cpuNames[i - 1] || `CPU ${i}`, false));
        }
        
        // AI初期化
        this.cpuAI = new CPUAI(this.settings.cpuDifficulty);
        
        // ゲームロジック初期化
        this.gameLogic = new GameLogic(this.settings);
        
        // 状態リセット
        this.finishOrder = [];
        this.currentPlayerIndex = 0;
        this.isGameRunning = true;
        
        // プレイヤー情報UI更新
        this.updatePlayersInfoUI();
        
        // カード配り
        await this.dealCards();
        
        // BGM開始
        this.sound.playBGM();
        
        // 最初のプレイヤーを決定（ダイヤの3を持っているプレイヤー）
        this.determineFirstPlayer();
        
        // ターン開始
        this.startTurn();
    }

    updatePlayersInfoUI() {
        // CPUプレイヤーのUI更新
        const cpuFaces = ['😎', '😄', '😊'];
        const cpuPositions = ['right', 'top', 'left']; // プレイヤー1,2,3の位置
        
        this.ui.game.cpuPlayers.forEach((el, index) => {
            const position = el.classList.contains('right') ? 'right' : 
                            el.classList.contains('top') ? 'top' : 'left';
            const posIndex = cpuPositions.indexOf(position);
            const playerIndex = posIndex + 1; // CPU1, CPU2, CPU3
            
            if (playerIndex < this.players.length) {
                el.classList.remove('hidden');
                el.dataset.player = playerIndex;
                el.querySelector('.cpu-name').textContent = this.players[playerIndex].name;
                el.querySelector('.cpu-face').textContent = cpuFaces[posIndex];
            } else {
                el.classList.add('hidden');
            }
        });
        
        // 3人プレイの場合、左のCPUを非表示
        if (this.settings.playerCount === 3) {
            const leftCpu = document.querySelector('.cpu-player.left');
            if (leftCpu) leftCpu.classList.add('hidden');
        }
    }

    async dealCards() {
        // デッキ作成とシャッフル
        const deck = shuffleDeck(createDeck(true));
        
        this.sound.playShuffle();
        
        // カード配布
        const cardsPerPlayer = Math.floor(deck.length / this.settings.playerCount);
        
        for (let i = 0; i < this.settings.playerCount; i++) {
            const startIdx = i * cardsPerPlayer;
            const endIdx = startIdx + cardsPerPlayer;
            const playerCards = deck.slice(startIdx, endIdx);
            
            this.players[i].receiveCards(playerCards);
            
            // 配りアニメーション
            for (let j = 0; j < playerCards.length; j++) {
                await this.delay(30);
                this.sound.playDealCard();
            }
        }
        
        // 余りカードを最初のプレイヤーに
        const remainder = deck.slice(this.settings.playerCount * cardsPerPlayer);
        if (remainder.length > 0) {
            this.players[0].receiveCards(remainder);
        }
        
        // 手札を革命状態に応じてソート
        this.players.forEach(p => p.sortHand(this.gameLogic.isRevolution));
        
        // プレイヤーの手札を表示
        this.renderPlayerHand();
        this.updateCardCounts();
    }

    determineFirstPlayer() {
        // ダイヤの3を持っているプレイヤーが最初
        for (let i = 0; i < this.players.length; i++) {
            const hasDiamond3 = this.players[i].hand.some(
                c => !c.isJoker && c.suit.name === 'diamond' && c.rank === 3
            );
            if (hasDiamond3) {
                this.currentPlayerIndex = i;
                return;
            }
        }
        // 見つからなければランダム
        this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
    }

    // ターン処理
    startTurn() {
        if (!this.isGameRunning) return;

        const player = this.players[this.currentPlayerIndex];
        
        // 既に上がっている場合はスキップ
        if (!player.isActive) {
            this.nextPlayer();
            return;
        }

        // ターン表示更新
        this.updateTurnIndicator();
        
        // プレイヤー情報のハイライト
        this.highlightCurrentPlayer();
        
        // エフェクト
        this.effects.turnStartEffect(player.isHuman);
        this.sound.playTurnStart(player.isHuman);

        if (player.isHuman) {
            // 人間のターン
            this.enablePlayerActions();
        } else {
            // CPUのターン
            this.disablePlayerActions();
            this.processCPUTurn(player);
        }
    }

    updateTurnIndicator() {
        const player = this.players[this.currentPlayerIndex];
        this.ui.game.turnIndicator.textContent = 
            player.isHuman ? 'あなたのターン' : `${player.name}のターン`;
    }

    highlightCurrentPlayer() {
        // CPUプレイヤーのハイライト解除
        this.ui.game.cpuPlayers.forEach(el => {
            el.classList.remove('active');
        });
        
        // 旧UIのハイライト
        this.ui.game.playersInfo.forEach((el, index) => {
            el.classList.remove('active');
            if (index === this.currentPlayerIndex) {
                el.classList.add('active');
            }
        });
        
        // 場のターンリング更新
        const turnRing = this.ui.game.fieldTurnRing;
        if (turnRing) {
            turnRing.className = `turn-player-${this.currentPlayerIndex}`;
        }
        
        // プレイヤーの手札エリアのハイライト
        if (this.currentPlayerIndex === 0) {
            this.ui.game.handArea?.classList.add('active');
        } else {
            this.ui.game.handArea?.classList.remove('active');
            
            // CPUプレイヤーをハイライト
            this.ui.game.cpuPlayers.forEach(el => {
                const playerIdx = parseInt(el.dataset.player);
                if (playerIdx === this.currentPlayerIndex) {
                    el.classList.add('active');
                }
            });
        }
    }

    enablePlayerActions() {
        this.ui.game.passBtn.disabled = false;
        this.updatePlayButton();
    }

    disablePlayerActions() {
        this.ui.game.playBtn.disabled = true;
        this.ui.game.passBtn.disabled = true;
    }

    updatePlayButton() {
        const selectedCards = this.players[0].getSelectedCards();
        const canPlay = this.gameLogic.canPlayCards(selectedCards);
        this.ui.game.playBtn.disabled = !canPlay;
    }

    // 手札レンダリング
    renderPlayerHand() {
        const hand = this.ui.game.playerHand;
        hand.innerHTML = '';

        const player = this.players[0];
        const cards = player.hand;

        cards.forEach((card, index) => {
            const cardEl = card.createDOMElement();
            cardEl.style.animationDelay = `${index * 0.05}s`;
            
            if (card.selected) {
                cardEl.classList.add('selected');
            }

            // クリックイベント
            cardEl.addEventListener('click', () => this.onCardClick(card, cardEl));
            
            hand.appendChild(cardEl);
        });
    }

    onCardClick(card, element) {
        if (this.currentPlayerIndex !== 0 || !this.isGameRunning) return;
        if (!this.players[0].isActive) return;

        card.selected = !card.selected;
        element.classList.toggle('selected');
        
        this.sound.playCardSelect();
        this.updatePlayButton();
    }

    // カードを出す
    async playSelectedCards() {
        const player = this.players[0];
        const selectedCards = player.getSelectedCards();

        if (selectedCards.length === 0) return;
        if (!this.gameLogic.canPlayCards(selectedCards)) {
            this.sound.playError();
            this.showMessage('その組み合わせは出せません');
            return;
        }

        await this.executePlay(player, selectedCards);
    }

    async executePlay(player, cards) {
        // カードをプレイ
        const result = this.gameLogic.playCards(cards, player.id);
        
        if (!result.success) {
            this.sound.playError();
            return;
        }

        // 手札から削除
        player.playCards(cards);
        player.clearSelection();

        // エフェクトと効果音
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.effects.playCardEffect(centerX, centerY);
        this.sound.playCardPlay();

        // CPUの場合、カードが飛んでくるようなアニメーション
        if (!player.isHuman) {
            await this.animateCPUCardPlay(player.id, cards.length);
        }

        // 場にカード表示
        this.renderFieldCards(cards);

        // 特殊効果
        if (result.isRevolution) {
            await this.handleRevolution();
        }

        if (result.isEightCut) {
            await this.handleEightCut();
        }

        // スペ3返しチェック
        if (this.gameLogic.currentField.length === 1 && 
            cards[0].isSpadeThree && 
            cards[0].isSpadeThree()) {
            this.effects.spadeThreeReturnEffect();
            this.sound.playSpadeThreeReturn();
        }

        // 手札表示更新
        this.renderPlayerHand();
        this.updateCardCounts();

        // 上がりチェック
        if (player.hasEmptyHand()) {
            await this.handlePlayerFinish(player);
        }

        // 次のプレイヤーへ
        await this.delay(500);
        this.nextPlayer();
    }

    // CPUがカードを出す時のアニメーション
    async animateCPUCardPlay(playerId, cardCount) {
        const cpuEl = document.querySelector(`.cpu-player[data-player="${playerId}"]`);
        if (!cpuEl) return;
        
        const cpuCards = cpuEl.querySelectorAll('.cpu-card-back');
        const cardsToAnimate = Array.from(cpuCards).slice(0, cardCount);
        
        // カードにアニメーションを追加
        cardsToAnimate.forEach((card, index) => {
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'scale(1.2)';
            card.style.opacity = '0.5';
            
            setTimeout(() => {
                card.style.transform = 'scale(0)';
                card.style.opacity = '0';
            }, 100 + index * 50);
        });
        
        await this.delay(300);
    }

    // パス
    async pass() {
        const player = this.players[this.currentPlayerIndex];
        
        this.gameLogic.pass();
        player.clearSelection();
        
        // エフェクト
        const playerInfo = this.ui.game.playersInfo[this.currentPlayerIndex];
        const rect = playerInfo?.getBoundingClientRect();
        if (rect) {
            this.effects.passEffect(rect.left + rect.width / 2, rect.top);
        }
        this.sound.playPass();

        this.renderPlayerHand();

        // 場流しチェック
        const activePlayers = this.players.filter(p => p.isActive).length;
        if (this.gameLogic.shouldClearField(activePlayers)) {
            await this.handleFieldClear();
        } else {
            await this.delay(300);
            this.nextPlayer();
        }
    }

    // CPU ターン処理
    async processCPUTurn(player) {
        // 思考中表示
        this.showMessage(`${player.name}が考え中...`);
        
        // 思考中の顔に変更
        this.setCPUFace(player.id, '🤔');
        
        const move = await this.cpuAI.selectMove(player, this.gameLogic, {
            players: this.players,
            currentPlayer: this.currentPlayerIndex
        });

        // メッセージを消す
        this.ui.game.messageDisplay.classList.add('hidden');

        if (move.type === 'play') {
            // カードを出す顔
            this.setCPUFace(player.id, '😤');
            await this.delay(200);
            await this.executePlay(player, move.cards);
            // 元の顔に戻す
            this.resetCPUFace(player.id);
        } else {
            // パスの顔
            this.setCPUFace(player.id, '😅');
            await this.pass();
            // 元の顔に戻す
            setTimeout(() => this.resetCPUFace(player.id), 500);
        }
    }
    
    // CPUの表情を変更
    setCPUFace(playerId, emoji) {
        const cpuEl = document.querySelector(`.cpu-player[data-player="${playerId}"]`);
        if (cpuEl) {
            const faceEl = cpuEl.querySelector('.cpu-face');
            if (faceEl) {
                faceEl.textContent = emoji;
            }
        }
    }
    
    // CPUの表情を元に戻す
    resetCPUFace(playerId) {
        const cpuEl = document.querySelector(`.cpu-player[data-player="${playerId}"]`);
        if (cpuEl) {
            const faceEl = cpuEl.querySelector('.cpu-face');
            if (faceEl) {
                // 位置に応じた顔を設定
                if (cpuEl.classList.contains('right')) {
                    faceEl.textContent = '😎';
                } else if (cpuEl.classList.contains('top')) {
                    faceEl.textContent = '😄';
                } else {
                    faceEl.textContent = '😊';
                }
            }
        }
    }

    // 場にカード表示
    renderFieldCards(cards) {
        const field = this.ui.game.fieldCards;
        field.innerHTML = '';

        cards.forEach((card, index) => {
            const cardEl = card.createDOMElement();
            cardEl.classList.add('field-card');
            cardEl.style.transform = `rotate(${(Math.random() - 0.5) * 10}deg)`;
            cardEl.style.animation = `cardPlayToField 0.4s ease forwards`;
            cardEl.style.animationDelay = `${index * 0.05}s`;
            field.appendChild(cardEl);
        });

        // アニメーション用のスタイルを動的追加
        if (!document.getElementById('card-play-animation')) {
            const style = document.createElement('style');
            style.id = 'card-play-animation';
            style.textContent = `
                @keyframes cardPlayToField {
                    0% {
                        opacity: 0;
                        transform: translateY(100px) scale(0.5) rotate(0deg);
                    }
                    60% {
                        opacity: 1;
                        transform: translateY(-10px) scale(1.1) rotate(var(--rotation, 0deg));
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1) rotate(var(--rotation, 0deg));
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 革命処理
    async handleRevolution() {
        this.effects.revolutionEffect();
        this.sound.playRevolution();
        
        // 全CPUが驚いた顔に
        this.players.forEach(p => {
            if (!p.isHuman) {
                this.setCPUFace(p.id, '😱');
            }
        });
        
        // 革命表示更新
        this.ui.game.revolutionIndicator.classList.toggle('hidden', !this.gameLogic.isRevolution);
        
        // 手札再ソート
        this.players.forEach(p => p.sortHand(this.gameLogic.isRevolution));
        this.renderPlayerHand();
        
        await this.delay(2000);
        
        // 顔を元に戻す
        this.players.forEach(p => {
            if (!p.isHuman) {
                this.resetCPUFace(p.id);
            }
        });
    }

    // 8切り処理
    async handleEightCut() {
        this.effects.eightCutEffect();
        this.sound.playEightCut();
        
        this.showMessage('8切り！');
        
        await this.delay(1000);
        
        // 場をクリア
        this.clearFieldDisplay();
    }

    // 場流し処理
    async handleFieldClear() {
        this.effects.fieldClearEffect();
        this.sound.playFieldClear();
        
        await this.delay(500);
        
        this.gameLogic.clearField();
        this.gameLogic.passCount = 0;
        this.clearFieldDisplay();

        // 最後にカードを出した人のターン
        if (this.gameLogic.lastPlayerId !== null) {
            this.currentPlayerIndex = this.gameLogic.lastPlayerId;
            // そのプレイヤーが上がっていたら次へ
            while (!this.players[this.currentPlayerIndex].isActive) {
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            }
        }
        
        this.startTurn();
    }

    clearFieldDisplay() {
        this.ui.game.fieldCards.innerHTML = '';
    }

    // プレイヤー上がり処理
    async handlePlayerFinish(player) {
        player.isActive = false;
        this.finishOrder.push(player);

        const rank = this.gameLogic.getRankForPosition(this.finishOrder.length - 1, this.settings.playerCount);
        player.rank = rank;

        // エフェクト
        this.effects.victoryEffect(player.name, player.isHuman);
        this.sound.playVictory();
        
        // CPUの場合、勝利の表情
        if (!player.isHuman) {
            this.setCPUFace(player.id, '🎉');
            
            // 他のCPUは残念な表情
            this.players.forEach(p => {
                if (!p.isHuman && p.id !== player.id && p.isActive) {
                    this.setCPUFace(p.id, '😢');
                }
            });
            
            // 少し後で表情を戻す
            setTimeout(() => {
                this.players.forEach(p => {
                    if (!p.isHuman && p.id !== player.id && p.isActive) {
                        this.resetCPUFace(p.id);
                    }
                });
            }, 2000);
        } else {
            // プレイヤーが上がった場合、CPUは残念な表情
            this.players.forEach(p => {
                if (!p.isHuman && p.isActive) {
                    this.setCPUFace(p.id, '😢');
                }
            });
            setTimeout(() => {
                this.players.forEach(p => {
                    if (!p.isHuman && p.isActive) {
                        this.resetCPUFace(p.id);
                    }
                });
            }, 2000);
        }

        // プレイヤー情報更新（旧UI）
        const playerInfo = this.ui.game.playersInfo[player.id];
        playerInfo?.classList.add('finished');
        
        // CPUプレイヤーの表示更新
        this.updateCPUHandsDisplay();

        // ゲーム終了チェック
        const activePlayers = this.players.filter(p => p.isActive);
        if (activePlayers.length <= 1) {
            // 残り1人も順位付け
            if (activePlayers.length === 1) {
                const lastPlayer = activePlayers[0];
                lastPlayer.isActive = false;
                this.finishOrder.push(lastPlayer);
                lastPlayer.rank = this.gameLogic.getRankForPosition(
                    this.finishOrder.length - 1, 
                    this.settings.playerCount
                );
            }
            
            await this.endGame();
            return;
        }

        this.showMessage(`${player.name} 上がり！ ${rank.name}`);
        await this.delay(2000);
    }

    // 次のプレイヤー
    nextPlayer() {
        if (!this.isGameRunning) return;

        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (!this.players[this.currentPlayerIndex].isActive);

        this.startTurn();
    }

    // カード枚数更新
    updateCardCounts() {
        // 旧UI更新
        this.ui.game.playersInfo.forEach((el, index) => {
            if (index < this.players.length) {
                el.querySelector('.card-count').textContent = 
                    `${this.players[index].getHandCount()}枚`;
            }
        });
        
        // CPUプレイヤーの手札表示更新
        this.updateCPUHandsDisplay();
    }
    
    // CPUの手札表示を更新
    updateCPUHandsDisplay() {
        this.ui.game.cpuPlayers.forEach(el => {
            const playerIdx = parseInt(el.dataset.player);
            if (playerIdx >= this.players.length) return;
            
            const player = this.players[playerIdx];
            const cardCount = player.getHandCount();
            
            // カード枚数表示
            const countEl = el.querySelector('.cpu-card-count');
            if (countEl) {
                countEl.textContent = `${cardCount}枚`;
            }
            
            // カード裏面表示を更新
            const cardsContainer = el.querySelector('.cpu-cards');
            if (cardsContainer) {
                cardsContainer.innerHTML = '';
                
                // 表示するカード数を制限（最大7枚程度）
                const displayCount = Math.min(cardCount, 7);
                
                for (let i = 0; i < displayCount; i++) {
                    const cardBack = document.createElement('div');
                    cardBack.className = 'cpu-card-back';
                    // 少しランダムな角度をつける
                    const rotation = (i - displayCount / 2) * 3;
                    
                    if (el.classList.contains('top')) {
                        cardBack.style.transform = `rotate(${rotation}deg)`;
                    }
                    
                    cardsContainer.appendChild(cardBack);
                }
            }
            
            // 終了したプレイヤーの表示
            if (!player.isActive) {
                el.classList.add('finished');
            } else {
                el.classList.remove('finished');
            }
        });
    }

    // メッセージ表示
    showMessage(text) {
        this.ui.game.messageDisplay.textContent = text;
        this.ui.game.messageDisplay.classList.remove('hidden');
        
        setTimeout(() => {
            this.ui.game.messageDisplay.classList.add('hidden');
        }, 2000);
    }

    // ゲーム終了
    async endGame() {
        this.isGameRunning = false;
        this.sound.stopBGM();

        await this.delay(1000);

        // 結果表示
        const isPlayerWin = this.finishOrder[0]?.isHuman;
        
        if (isPlayerWin) {
            this.sound.playVictory();
        } else {
            this.sound.playGameOver();
        }

        this.showResult();
    }

    showResult() {
        this.ui.game.resultOverlay.classList.remove('hidden');
        
        const isPlayerWin = this.finishOrder[0]?.isHuman;
        this.ui.game.resultTitle.textContent = isPlayerWin ? '🎉 勝利！ 🎉' : 'ゲーム終了';
        
        // ランキング表示
        this.ui.game.resultRankings.innerHTML = '';
        
        this.finishOrder.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item' + (player.isHuman ? ' player' : '');
            item.innerHTML = `
                <span class="ranking-position">${index + 1}位 - ${player.rank?.name || ''}</span>
                <span class="ranking-name">${player.name}</span>
            `;
            this.ui.game.resultRankings.appendChild(item);
        });

        if (isPlayerWin) {
            this.effects.createConfetti(150);
        }
    }

    hideResult() {
        this.ui.game.resultOverlay.classList.add('hidden');
    }

    // ユーティリティ
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
