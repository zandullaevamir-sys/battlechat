:root {
  color-scheme: dark;
  --bg: #0b1020;
  --panel: #111827;
  --panel-2: #1f2937;
  --text: #ecf5ff;
  --muted: #9aa7bd;
  --primary: #7c3aed;
  --primary-2: #22c55e;
  --accent: #f59e0b;
  --danger: #ef4444;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #080d17 0%, #111827 100%);
  color: var(--text);
}

body {
  display: flex;
  justify-content: center;
}

button, input, select {
  font: inherit;
}

img {
  display: block;
  max-width: 100%;
}

.app-shell {
  width: min(100vw, 430px);
  min-height: 100vh;
  padding: 16px 14px 32px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.eyebrow {
  margin: 0 0 4px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-size: 11px;
}

h1, h2, h3, p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: 28px;
}

.guest-badge {
  border: 1px solid rgba(255,255,255,0.15);
  padding: 6px 10px;
  border-radius: 999px;
  color: var(--accent);
  background: rgba(245, 158, 11, 0.15);
  font-size: 12px;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 16px;
}

.tab {
  border: none;
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border-radius: 12px;
  padding: 10px 6px;
  font-size: 12px;
  cursor: pointer;
}

.tab.active {
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
}

.countdown {
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #b7f7c7;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
}

.battle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.blogger-card, .mini-card, .leader-group, .history-item, .panel-form {
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.2);
}

.blogger-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.card-body {
  padding: 14px;
}

.badge {
  display: inline-block;
  background: rgba(124, 58, 237, 0.2);
  color: #d9c1ff;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 10px;
  margin-bottom: 8px;
}

.card-body h3 {
  font-size: 23px;
  margin-bottom: 8px;
}

.card-body a {
  display: inline-block;
  color: var(--muted);
  text-decoration: none;
  word-break: break-all;
  margin-bottom: 12px;
}

.voting-row {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 8px;
}

.progress {
  background: rgba(255,255,255,0.07);
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
  margin-bottom: 14px;
}

.progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
}

.primary-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  padding: 12px 16px;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.empty-state {
  background: rgba(17,24,39,0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 24px 16px;
  text-align: center;
  color: var(--muted);
}

.list-block {
  display: grid;
  gap: 12px;
}

.mini-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.mini-card img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 16px;
}

.mini-card h3, .mini-card p, .mini-card small {
  margin: 0;
}

.mini-card p {
  color: var(--muted);
}

.leader-group {
  padding: 14px;
}

.leader-group h3 {
  margin-bottom: 10px;
}

.leader-item, .history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.leader-item:last-child, .history-item:last-child {
  border-bottom: none;
}

.history-item {
  padding: 12px 14px;
}

.history-item p {
  margin: 4px 0 0;
  color: var(--muted);
}

.admin-panel {
  display: grid;
  gap: 14px;
}

.panel-form {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.panel-form h3 {
  margin-bottom: 2px;
}

.panel-form input, .panel-form select {
  width: 100%;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: var(--text);
  padding: 12px 14px;
  border-radius: 12px;
}

@media (max-width: 390px) {
  .battle-grid {
    grid-template-columns: 1fr;
  }
}
