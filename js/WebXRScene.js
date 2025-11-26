// =============================================
// WebXRScene.js - WebXR 3D シーン管理
// =============================================

export class WebXRScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.isVRMode = false;
        
        // 3Dオブジェクト
        this.table = null;
        this.cardMeshes = new Map();
        this.playerPositions = [];
        
        // アニメーション
        this.animations = [];
        
        this.init();
    }

    init() {
        // シーン作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0d1b12);

        // カメラ設定
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        // レンダラー設定
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.xr.enabled = true;

        // ライティング
        this.setupLighting();

        // テーブル作成
        this.createTable();

        // 環境
        this.createEnvironment();

        // リサイズハンドラ
        window.addEventListener('resize', () => this.onResize());

        // アニメーションループ
        this.renderer.setAnimationLoop(() => this.animate());
    }

    setupLighting() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // メインライト（スポットライト）
        const mainLight = new THREE.SpotLight(0xffd700, 1);
        mainLight.position.set(0, 10, 0);
        mainLight.angle = Math.PI / 3;
        mainLight.penumbra = 0.3;
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        // 補助ライト
        const fillLight = new THREE.DirectionalLight(0x4fc3f7, 0.3);
        fillLight.position.set(-5, 5, 5);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xff7043, 0.2);
        backLight.position.set(5, 3, -5);
        this.scene.add(backLight);
    }

    createTable() {
        // テーブル天板
        const tableGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 64);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a472a,
            roughness: 0.8,
            metalness: 0.1
        });
        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.position.y = -0.1;
        this.table.receiveShadow = true;
        this.scene.add(this.table);

        // テーブルのフェルト部分
        const feltGeometry = new THREE.CylinderGeometry(3.8, 3.8, 0.05, 64);
        const feltMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a3d,
            roughness: 0.9,
            metalness: 0
        });
        const felt = new THREE.Mesh(feltGeometry, feltMaterial);
        felt.position.y = 0.05;
        felt.receiveShadow = true;
        this.scene.add(felt);

        // テーブルの縁
        const rimGeometry = new THREE.TorusGeometry(4, 0.15, 16, 64);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2c0a,
            roughness: 0.5,
            metalness: 0.3
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0;
        this.scene.add(rim);

        // プレイヤーポジションマーカー
        this.setupPlayerPositions(4);
    }

    setupPlayerPositions(playerCount) {
        this.playerPositions = [];
        const radius = 3.2;
        
        for (let i = 0; i < playerCount; i++) {
            const angle = (i / playerCount) * Math.PI * 2 - Math.PI / 2;
            const position = {
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius,
                angle: angle + Math.PI
            };
            this.playerPositions.push(position);

            // ポジションマーカー
            const markerGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
            const markerMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xffd700 : 0x666666,
                side: THREE.DoubleSide
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.rotation.x = -Math.PI / 2;
            marker.position.set(position.x, 0.1, position.z);
            this.scene.add(marker);
        }
    }

    createEnvironment() {
        // 床
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0f0a,
            roughness: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 壁（遠景）
        const wallGeometry = new THREE.CylinderGeometry(20, 20, 15, 32, 1, true);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            side: THREE.BackSide,
            roughness: 1
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = 6;
        this.scene.add(wall);

        // 装飾用のパーティクル
        this.createAmbientParticles();
    }

    createAmbientParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 1] = Math.random() * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // カード3Dメッシュを作成
    createCardMesh(card) {
        const width = 0.6;
        const height = 0.9;
        const depth = 0.01;

        const geometry = new THREE.BoxGeometry(width, depth, height);
        
        // カードのテクスチャを生成
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 枠
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // カード情報
        if (card.isJoker) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('JOKER', canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillStyle = card.getColor() === 'red' ? '#cc0000' : '#000000';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            
            // スートと数字
            const suit = card.getSuitSymbol();
            const rank = card.getDisplay();
            
            // 左上
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(rank, 8, 25);
            ctx.fillText(suit, 8, 45);
            
            // 中央
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(suit, canvas.width / 2, canvas.height / 2 + 15);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        
        // 裏面テクスチャ
        const backCanvas = document.createElement('canvas');
        backCanvas.width = 128;
        backCanvas.height = 192;
        const backCtx = backCanvas.getContext('2d');
        
        // 裏面のデザイン
        backCtx.fillStyle = '#1a472a';
        backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
        
        // パターン
        backCtx.strokeStyle = '#ffd700';
        backCtx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            backCtx.beginPath();
            backCtx.arc(64, 96, 10 + i * 8, 0, Math.PI * 2);
            backCtx.stroke();
        }
        
        const backTexture = new THREE.CanvasTexture(backCanvas);

        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xffffff }), // 右
            new THREE.MeshStandardMaterial({ color: 0xffffff }), // 左
            new THREE.MeshStandardMaterial({ map: texture }),     // 上（表）
            new THREE.MeshStandardMaterial({ map: backTexture }), // 下（裏）
            new THREE.MeshStandardMaterial({ color: 0xffffff }), // 前
            new THREE.MeshStandardMaterial({ color: 0xffffff })  // 後
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.card = card;
        
        return mesh;
    }

    // カードを場に出すアニメーション
    animateCardToField(cardMesh, index, total) {
        const targetX = (index - (total - 1) / 2) * 0.4;
        const targetY = 0.1 + index * 0.01;
        const targetZ = 0;
        
        return new Promise(resolve => {
            if (typeof gsap !== 'undefined') {
                gsap.to(cardMesh.position, {
                    x: targetX,
                    y: targetY,
                    z: targetZ,
                    duration: 0.5,
                    ease: 'power2.out',
                    onComplete: resolve
                });
                gsap.to(cardMesh.rotation, {
                    x: -Math.PI / 2,
                    y: 0,
                    z: (Math.random() - 0.5) * 0.2,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            } else {
                cardMesh.position.set(targetX, targetY, targetZ);
                cardMesh.rotation.set(-Math.PI / 2, 0, 0);
                resolve();
            }
        });
    }

    // プレイヤーの手札位置にカードを配置
    positionHandCard(cardMesh, playerIndex, cardIndex, totalCards) {
        const pos = this.playerPositions[playerIndex];
        if (!pos) return;

        const spread = Math.min(totalCards * 0.15, 2);
        const offset = (cardIndex - (totalCards - 1) / 2) * (spread / totalCards);
        
        cardMesh.position.x = pos.x + Math.cos(pos.angle + Math.PI / 2) * offset;
        cardMesh.position.y = 0.2 + cardIndex * 0.005;
        cardMesh.position.z = pos.z + Math.sin(pos.angle + Math.PI / 2) * offset;
        cardMesh.rotation.x = -Math.PI / 2 + 0.3;
        cardMesh.rotation.y = pos.angle;
    }

    // VRモード開始
    async enterVR() {
        if (!navigator.xr) {
            console.warn('WebXR not supported');
            return false;
        }

        try {
            const session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor']
            });
            
            this.xrSession = session;
            this.isVRMode = true;
            
            this.renderer.xr.setSession(session);
            
            session.addEventListener('end', () => {
                this.isVRMode = false;
                this.xrSession = null;
            });
            
            return true;
        } catch (e) {
            console.error('Failed to enter VR:', e);
            return false;
        }
    }

    // アニメーションループ
    animate() {
        // パーティクルアニメーション
        if (this.particles) {
            this.particles.rotation.y += 0.0005;
        }

        // カスタムアニメーション
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            if (anim.update()) {
                this.animations.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // クリーンアップ
    dispose() {
        if (this.xrSession) {
            this.xrSession.end();
        }
        this.renderer.dispose();
    }
}
