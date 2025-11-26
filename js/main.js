// =============================================
// main.js - エントリーポイント
// =============================================

import { Game } from './Game.js';

// DOMContentLoaded で初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('大富豪 VR - Initializing...');
    
    // ゲームインスタンス作成
    window.game = new Game();
    
    // デバッグ用
    if (window.location.search.includes('debug')) {
        window.DEBUG = true;
        console.log('Debug mode enabled');
    }
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('Game Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
});

// VR対応チェック
if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
            console.log('WebXR VR supported');
            document.getElementById('enter-vr-btn')?.classList.remove('hidden');
        } else {
            console.log('WebXR VR not supported');
            const vrBtn = document.getElementById('enter-vr-btn');
            if (vrBtn) {
                vrBtn.textContent = 'VR非対応';
                vrBtn.disabled = true;
                vrBtn.style.opacity = '0.5';
            }
        }
    });
} else {
    console.log('WebXR not available');
    const vrBtn = document.getElementById('enter-vr-btn');
    if (vrBtn) {
        vrBtn.textContent = 'VR非対応';
        vrBtn.disabled = true;
        vrBtn.style.opacity = '0.5';
    }
}

// Service Worker 登録（オフライン対応、オプション）
if ('serviceWorker' in navigator) {
    // navigator.serviceWorker.register('/sw.js').catch(() => {});
}
