# Quantum Qubit Showcase

互動式 3D 量子電腦教學展示：Bloch 球、量子閘門、雙量子位元糾纏、量子處理器模型、Shor 演算法流程。

## 預覽

```bash
cd quantum-showcase
python3 -m http.server 8765
```

瀏覽器開啟 http://localhost:8765/

## 專案結構

```
quantum-showcase/
├── index.html          # 主頁面
├── main.js             # 場景控制器
├── shor-flow.js        # Shor 演算法互動流程
├── styles.css
├── utils/quantum-math.js
└── scenes/             # Three.js 3D 場景
```

## 需求

- 現代瀏覽器（支援 ES Modules）
- 本機 HTTP 伺服器（不可直接用 file:// 開啟）

## 用 Grok Build 繼續開發

```bash
git clone https://github.com/NEOreload2025/quantum-qubit-showcase.git
cd quantum-qubit-showcase
grok
```