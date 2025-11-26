// =============================================
// EffectsManager.js - エフェクト管理
// =============================================

export class EffectsManager {
    constructor() {
        this.container = document.getElementById('effects-container');
        this.activeEffects = [];
    }

    // カード出しエフェクト
    playCardEffect(x, y) {
        // 光の粒子
        for (let i = 0; i < 15; i++) {
            this.createParticle(x, y, {
                color: `hsl(${45 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`,
                size: 5 + Math.random() * 10,
                duration: 500 + Math.random() * 300,
                angle: (i / 15) * Math.PI * 2,
                distance: 50 + Math.random() * 50
            });
        }

        // 中心の光
        this.createFlash(x, y, {
            color: 'rgba(255, 215, 0, 0.5)',
            size: 100,
            duration: 300
        });
    }

    // 革命エフェクト
    revolutionEffect() {
        // 画面全体のフラッシュ
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,0,0,0.5) 0%, transparent 70%);
            pointer-events: none;
            z-index: 500;
            animation: revolutionFlash 0.5s ease-out forwards;
        `;
        this.container.appendChild(flash);

        // 「革命」テキスト
        const text = document.createElement('div');
        text.className = 'revolution-effect';
        text.textContent = '革命！';
        this.container.appendChild(text);

        // 渦巻きパーティクル
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const angle = (i / 50) * Math.PI * 4;
                const radius = 100 + i * 3;
                const x = window.innerWidth / 2 + Math.cos(angle) * radius;
                const y = window.innerHeight / 2 + Math.sin(angle) * radius;
                
                this.createParticle(x, y, {
                    color: i % 2 === 0 ? '#ff0000' : '#ffd700',
                    size: 10,
                    duration: 1500,
                    angle: angle + Math.PI,
                    distance: radius,
                    spin: true
                });
            }, i * 20);
        }

        // クリーンアップ
        setTimeout(() => {
            flash.remove();
            text.remove();
        }, 2000);

        // スタイル追加
        if (!document.getElementById('revolution-flash-style')) {
            const style = document.createElement('style');
            style.id = 'revolution-flash-style';
            style.textContent = `
                @keyframes revolutionFlash {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 8切りエフェクト
    eightCutEffect() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // 斬撃エフェクト
        const slash = document.createElement('div');
        slash.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 300px;
            height: 4px;
            background: linear-gradient(90deg, transparent, #00ffff, #ffffff, #00ffff, transparent);
            transform: translate(-50%, -50%) rotate(-45deg) scaleX(0);
            pointer-events: none;
            z-index: 500;
            animation: slashAnim 0.3s ease-out forwards;
        `;
        this.container.appendChild(slash);

        // 氷の破片パーティクル
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                this.createParticle(centerX + (Math.random() - 0.5) * 100, centerY + (Math.random() - 0.5) * 100, {
                    color: `hsl(${180 + Math.random() * 30}, 100%, ${70 + Math.random() * 30}%)`,
                    size: 5 + Math.random() * 15,
                    duration: 800 + Math.random() * 400,
                    angle: Math.random() * Math.PI * 2,
                    distance: 100 + Math.random() * 100,
                    shape: 'diamond'
                });
            }, Math.random() * 200);
        }

        // スタイル追加
        if (!document.getElementById('slash-style')) {
            const style = document.createElement('style');
            style.id = 'slash-style';
            style.textContent = `
                @keyframes slashAnim {
                    0% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(0); opacity: 1; }
                    50% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) rotate(-45deg) scaleX(1); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => slash.remove(), 500);
    }

    // 勝利エフェクト
    victoryEffect(playerName, isPlayer = false) {
        // 紙吹雪
        this.createConfetti(100);

        // 勝利テキスト
        const text = document.createElement('div');
        text.className = 'win-effect';
        text.innerHTML = isPlayer 
            ? `🎉 あなたの勝利！ 🎉`
            : `${playerName} 上がり！`;
        this.container.appendChild(text);

        // 光の輪
        if (isPlayer) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.createRing(window.innerWidth / 2, window.innerHeight / 2, {
                        color: '#ffd700',
                        size: 100 + i * 100,
                        duration: 1000
                    });
                }, i * 200);
            }
        }

        setTimeout(() => text.remove(), 3000);
    }

    // パス効果
    passEffect(x, y) {
        const text = document.createElement('div');
        text.textContent = 'PASS';
        text.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: 2rem;
            font-weight: bold;
            color: #ff6b6b;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 500;
            animation: passFloat 1s ease-out forwards;
        `;
        this.container.appendChild(text);

        if (!document.getElementById('pass-style')) {
            const style = document.createElement('style');
            style.id = 'pass-style';
            style.textContent = `
                @keyframes passFloat {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-50px) scale(1.5); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => text.remove(), 1000);
    }

    // 場流しエフェクト
    fieldClearEffect() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // 散らばる効果
        for (let i = 0; i < 20; i++) {
            this.createParticle(centerX, centerY, {
                color: '#888888',
                size: 20 + Math.random() * 20,
                duration: 600 + Math.random() * 200,
                angle: Math.random() * Math.PI * 2,
                distance: 150 + Math.random() * 100,
                opacity: 0.7
            });
        }

        // 風のエフェクト
        const wind = document.createElement('div');
        wind.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            z-index: 500;
            animation: windExpand 0.5s ease-out forwards;
        `;
        this.container.appendChild(wind);

        if (!document.getElementById('wind-style')) {
            const style = document.createElement('style');
            style.id = 'wind-style';
            style.textContent = `
                @keyframes windExpand {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => wind.remove(), 500);
    }

    // ターン開始エフェクト
    turnStartEffect(isPlayerTurn) {
        if (isPlayerTurn) {
            // プレイヤーターンは強調
            const glow = document.createElement('div');
            glow.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 200px;
                background: linear-gradient(transparent, rgba(255, 215, 0, 0.2));
                pointer-events: none;
                z-index: 400;
                animation: turnGlow 0.5s ease-out forwards;
            `;
            this.container.appendChild(glow);

            if (!document.getElementById('turn-glow-style')) {
                const style = document.createElement('style');
                style.id = 'turn-glow-style';
                style.textContent = `
                    @keyframes turnGlow {
                        0% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0.3; }
                    }
                `;
                document.head.appendChild(style);
            }

            setTimeout(() => glow.remove(), 2000);
        }
    }

    // パーティクル生成
    createParticle(x, y, options = {}) {
        const particle = document.createElement('div');
        const size = options.size || 10;
        
        particle.className = 'particle';
        particle.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${options.color || '#ffd700'};
            border-radius: ${options.shape === 'diamond' ? '0' : '50%'};
            transform: ${options.shape === 'diamond' ? 'rotate(45deg)' : 'none'};
            opacity: ${options.opacity || 1};
        `;
        
        this.container.appendChild(particle);

        // アニメーション
        const angle = options.angle || Math.random() * Math.PI * 2;
        const distance = options.distance || 100;
        const duration = options.duration || 500;
        
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        if (typeof gsap !== 'undefined') {
            gsap.to(particle, {
                left: targetX,
                top: targetY,
                opacity: 0,
                scale: 0,
                rotation: options.spin ? 720 : 0,
                duration: duration / 1000,
                ease: 'power2.out',
                onComplete: () => particle.remove()
            });
        } else {
            setTimeout(() => particle.remove(), duration);
        }
    }

    // フラッシュ生成
    createFlash(x, y, options = {}) {
        const flash = document.createElement('div');
        const size = options.size || 100;
        
        flash.style.cssText = `
            position: fixed;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, ${options.color || 'rgba(255,255,255,0.8)'} 0%, transparent 70%);
            pointer-events: none;
            z-index: 500;
            animation: flashFade ${options.duration || 300}ms ease-out forwards;
        `;
        
        this.container.appendChild(flash);

        if (!document.getElementById('flash-style')) {
            const style = document.createElement('style');
            style.id = 'flash-style';
            style.textContent = `
                @keyframes flashFade {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => flash.remove(), options.duration || 300);
    }

    // 光の輪生成
    createRing(x, y, options = {}) {
        const ring = document.createElement('div');
        const size = options.size || 100;
        
        ring.style.cssText = `
            position: fixed;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
            width: ${size}px;
            height: ${size}px;
            border: 3px solid ${options.color || '#ffd700'};
            border-radius: 50%;
            pointer-events: none;
            z-index: 500;
            animation: ringExpand ${options.duration || 1000}ms ease-out forwards;
        `;
        
        this.container.appendChild(ring);

        if (!document.getElementById('ring-style')) {
            const style = document.createElement('style');
            style.id = 'ring-style';
            style.textContent = `
                @keyframes ringExpand {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(3); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => ring.remove(), options.duration || 1000);
    }

    // 紙吹雪生成
    createConfetti(count = 50) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff6b6b'];
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    left: ${Math.random() * window.innerWidth}px;
                    top: -20px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    animation-duration: ${2 + Math.random() * 3}s;
                    transform: rotate(${Math.random() * 360}deg);
                `;
                
                this.container.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 5000);
            }, i * 30);
        }
    }

    // スペード3返しエフェクト
    spadeThreeReturnEffect() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // スペードマーク
        const spade = document.createElement('div');
        spade.textContent = '♠';
        spade.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            font-size: 8rem;
            color: #000;
            text-shadow: 0 0 30px #00ff00, 0 0 60px #00ff00;
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            z-index: 600;
            animation: spadeAppear 1s ease-out forwards;
        `;
        this.container.appendChild(spade);

        // 緑のパーティクル
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                this.createParticle(centerX, centerY, {
                    color: `hsl(${120 + Math.random() * 30}, 100%, 50%)`,
                    size: 10 + Math.random() * 15,
                    duration: 800,
                    angle: Math.random() * Math.PI * 2,
                    distance: 150
                });
            }, i * 20);
        }

        if (!document.getElementById('spade-style')) {
            const style = document.createElement('style');
            style.id = 'spade-style';
            style.textContent = `
                @keyframes spadeAppear {
                    0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 1; }
                    50% { transform: translate(-50%, -50%) scale(1.5) rotate(0deg); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => spade.remove(), 1000);
    }

    // 全エフェクトクリア
    clearAll() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }
}
