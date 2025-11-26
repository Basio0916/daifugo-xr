// =============================================
// SoundManager.js - 効果音管理（Web Audio API）
// =============================================

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.7;
        
        this.isInitialized = false;
        this.currentBGM = null;
    }

    // 初期化（ユーザーインタラクション後に呼ぶ必要がある）
    async init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // マスターゲイン
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // BGMゲイン
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = this.bgmVolume;
            this.bgmGain.connect(this.masterGain);
            
            // SFXゲイン
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            this.isInitialized = true;
            console.log('Sound system initialized');
        } catch (e) {
            console.error('Failed to initialize audio:', e);
        }
    }

    // コンテキストを再開（必要に応じて）
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // BGM音量設定
    setBGMVolume(value) {
        this.bgmVolume = value;
        if (this.bgmGain) {
            this.bgmGain.gain.value = value;
        }
    }

    // 効果音音量設定
    setSFXVolume(value) {
        this.sfxVolume = value;
        if (this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    }

    // カード出し音
    playCardPlay() {
        this.playSound({
            type: 'card',
            frequency: 800,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09
        });
        
        // 追加の「パシッ」という音
        setTimeout(() => {
            this.playNoise({
                duration: 0.05,
                filter: { type: 'highpass', frequency: 2000 }
            });
        }, 20);
    }

    // カード選択音
    playCardSelect() {
        this.playSound({
            type: 'select',
            frequency: 1200,
            duration: 0.08,
            attack: 0.01,
            decay: 0.07,
            volume: 0.3
        });
    }

    // パス音
    playPass() {
        this.playSound({
            type: 'pass',
            frequency: 300,
            duration: 0.3,
            attack: 0.01,
            decay: 0.29,
            volume: 0.4,
            waveform: 'triangle'
        });
    }

    // 革命音
    playRevolution() {
        // ドラマチックな上昇音
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playSound({
                    type: 'revolution',
                    frequency: 200 + i * 100,
                    duration: 0.15,
                    attack: 0.01,
                    decay: 0.14,
                    volume: 0.3 + i * 0.05,
                    waveform: 'sawtooth'
                });
            }, i * 50);
        }

        // 最後のクラッシュ音
        setTimeout(() => {
            this.playNoise({
                duration: 0.5,
                filter: { type: 'lowpass', frequency: 1000 },
                volume: 0.6
            });
            
            this.playSound({
                type: 'crash',
                frequency: 150,
                duration: 0.8,
                attack: 0.01,
                decay: 0.79,
                volume: 0.5,
                waveform: 'sawtooth'
            });
        }, 400);
    }

    // 8切り音
    playEightCut() {
        // 斬撃音
        this.playNoise({
            duration: 0.2,
            filter: { type: 'highpass', frequency: 3000 },
            volume: 0.5
        });

        // シューッという音
        this.playSound({
            frequency: 2000,
            endFrequency: 500,
            duration: 0.3,
            attack: 0.01,
            decay: 0.29,
            volume: 0.3,
            waveform: 'sawtooth'
        });
    }

    // 勝利音
    playVictory() {
        // ファンファーレ
        const notes = [
            { freq: 523.25, time: 0 },      // C5
            { freq: 659.25, time: 0.15 },   // E5
            { freq: 783.99, time: 0.3 },    // G5
            { freq: 1046.50, time: 0.45 },  // C6
        ];

        notes.forEach(note => {
            setTimeout(() => {
                this.playSound({
                    frequency: note.freq,
                    duration: 0.3,
                    attack: 0.01,
                    decay: 0.29,
                    volume: 0.4,
                    waveform: 'triangle'
                });
            }, note.time * 1000);
        });

        // 最後のキラキラ
        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    this.playSound({
                        frequency: 1000 + Math.random() * 2000,
                        duration: 0.1,
                        attack: 0.01,
                        decay: 0.09,
                        volume: 0.15
                    });
                }, i * 50);
            }
        }, 600);
    }

    // ゲームオーバー音
    playGameOver() {
        // 下降音
        const notes = [
            { freq: 400, time: 0 },
            { freq: 350, time: 0.2 },
            { freq: 300, time: 0.4 },
            { freq: 200, time: 0.6 },
        ];

        notes.forEach(note => {
            setTimeout(() => {
                this.playSound({
                    frequency: note.freq,
                    duration: 0.4,
                    attack: 0.01,
                    decay: 0.39,
                    volume: 0.4,
                    waveform: 'sine'
                });
            }, note.time * 1000);
        });
    }

    // ターン開始音
    playTurnStart(isPlayerTurn) {
        if (isPlayerTurn) {
            // プレイヤーターン：明るい音
            this.playSound({
                frequency: 880,
                duration: 0.15,
                attack: 0.01,
                decay: 0.14,
                volume: 0.3,
                waveform: 'triangle'
            });
            setTimeout(() => {
                this.playSound({
                    frequency: 1100,
                    duration: 0.15,
                    attack: 0.01,
                    decay: 0.14,
                    volume: 0.3,
                    waveform: 'triangle'
                });
            }, 100);
        } else {
            // CPUターン：控えめな音
            this.playSound({
                frequency: 600,
                duration: 0.1,
                attack: 0.01,
                decay: 0.09,
                volume: 0.15,
                waveform: 'sine'
            });
        }
    }

    // 場流し音
    playFieldClear() {
        // 風のような音
        this.playNoise({
            duration: 0.4,
            filter: { type: 'bandpass', frequency: 800 },
            volume: 0.3
        });

        // シュワーッという音
        this.playSound({
            frequency: 400,
            endFrequency: 100,
            duration: 0.4,
            attack: 0.01,
            decay: 0.39,
            volume: 0.2,
            waveform: 'sawtooth'
        });
    }

    // スペ3返し音
    playSpadeThreeReturn() {
        // 特別な効果音
        this.playSound({
            frequency: 440,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09,
            volume: 0.4,
            waveform: 'square'
        });
        
        setTimeout(() => {
            this.playSound({
                frequency: 880,
                duration: 0.2,
                attack: 0.01,
                decay: 0.19,
                volume: 0.4,
                waveform: 'square'
            });
        }, 100);

        setTimeout(() => {
            this.playSound({
                frequency: 1760,
                duration: 0.3,
                attack: 0.01,
                decay: 0.29,
                volume: 0.4,
                waveform: 'triangle'
            });
        }, 200);
    }

    // ボタンクリック音
    playButtonClick() {
        this.playSound({
            frequency: 800,
            duration: 0.05,
            attack: 0.005,
            decay: 0.045,
            volume: 0.2,
            waveform: 'sine'
        });
    }

    // エラー音
    playError() {
        this.playSound({
            frequency: 200,
            duration: 0.2,
            attack: 0.01,
            decay: 0.19,
            volume: 0.3,
            waveform: 'sawtooth'
        });
    }

    // カード配り音
    playDealCard() {
        this.playNoise({
            duration: 0.04,
            filter: { type: 'highpass', frequency: 4000 },
            volume: 0.2
        });
    }

    // シャッフル音
    playShuffle() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.playDealCard();
            }, i * 50 + Math.random() * 30);
        }
    }

    // 基本サウンド生成
    playSound(options) {
        if (!this.isInitialized || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = options.waveform || 'sine';
        oscillator.frequency.setValueAtTime(options.frequency, this.audioContext.currentTime);

        // 周波数の変化（オプション）
        if (options.endFrequency) {
            oscillator.frequency.exponentialRampToValueAtTime(
                options.endFrequency,
                this.audioContext.currentTime + options.duration
            );
        }

        const volume = (options.volume || 0.5) * this.sfxVolume;
        
        // エンベロープ
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + options.attack);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + options.attack + options.decay);

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + options.duration);
    }

    // ノイズ生成
    playNoise(options) {
        if (!this.isInitialized || !this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * options.duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const volume = (options.volume || 0.5) * this.sfxVolume;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + options.duration);

        // フィルター（オプション）
        if (options.filter) {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = options.filter.type;
            filter.frequency.value = options.filter.frequency;
            
            source.connect(filter);
            filter.connect(gainNode);
        } else {
            source.connect(gainNode);
        }

        gainNode.connect(this.sfxGain);
        source.start(this.audioContext.currentTime);
    }

    // BGM再生（シンプルなループ）
    async playBGM() {
        if (!this.isInitialized) return;

        // 簡易BGMジェネレーター
        this.stopBGM();
        
        this.currentBGM = {
            isPlaying: true,
            intervalId: null
        };

        const playChord = (notes, time) => {
            if (!this.currentBGM?.isPlaying) return;
            
            notes.forEach(freq => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.05 * this.bgmVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
                
                osc.connect(gain);
                gain.connect(this.bgmGain);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 2);
            });
        };

        // コード進行
        const chords = [
            [130.81, 164.81, 196.00], // C
            [146.83, 174.61, 220.00], // Dm
            [164.81, 196.00, 246.94], // Em
            [174.61, 220.00, 261.63], // F
        ];

        let chordIndex = 0;
        
        playChord(chords[chordIndex], 0);
        
        this.currentBGM.intervalId = setInterval(() => {
            if (!this.currentBGM?.isPlaying) return;
            chordIndex = (chordIndex + 1) % chords.length;
            playChord(chords[chordIndex], 0);
        }, 2000);
    }

    // BGM停止
    stopBGM() {
        if (this.currentBGM) {
            this.currentBGM.isPlaying = false;
            if (this.currentBGM.intervalId) {
                clearInterval(this.currentBGM.intervalId);
            }
            this.currentBGM = null;
        }
    }

    // クリーンアップ
    dispose() {
        this.stopBGM();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
