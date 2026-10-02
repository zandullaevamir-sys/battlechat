body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background:
        radial-gradient(circle at top, rgba(191, 149, 63, 0.18), transparent 30%),
        linear-gradient(180deg, #0a0a0d 0%, #0c0d10 100%);
    color: #f3f4f6;
}

* {
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

button {
    -webkit-tap-highlight-color: transparent;
}

img {
    user-select: none;
    -webkit-user-drag: none;
}

.gold-gradient {
    background: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);
}

.gold-text {
    background: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
}

.vip-card {
    background: linear-gradient(145deg, #16161a 0%, #0f0f12 100%);
    border: 1px solid rgba(191, 149, 63, 0.25);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.nav-btn {
    transition: all 0.2s ease;
}

.nav-btn:hover {
    transform: translateY(-1px);
}

#verify-modal {
    animation: fadeIn 0.2s ease;
}

#toast {
    position: fixed;
    left: 50%;
    bottom: 92px;
    transform: translateX(-50%);
    background: rgba(17, 24, 39, 0.96);
    color: #f8fafc;
    border: 1px solid rgba(251, 191, 36, 0.5);
    padding: 10px 16px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
    z-index: 70;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.96);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes pulseGlow {
    0%, 100% {
        box-shadow: 0 0 0 rgba(251, 191, 36, 0.15);
    }
    50% {
        box-shadow: 0 0 20px rgba(251, 191, 36, 0.28);
    }
}

.animate-pulse {
    animation: pulseGlow 2s infinite ease-in-out;
}

@media (min-width: 640px) {
    body {
        background-size: cover;
    }
}

@media (max-width: 360px) {
    .text-[10px] {
        font-size: 9px;
    }
}
