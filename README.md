# Quantum Qubit Showcase

互動式 3D 量子電腦教學展示：Bloch 球、量子閘門、雙量子位元糾纏、量子處理器模型、Shor 演算法流程。

## 專案結構

```
quantum-qubit-showcase/
├── index.html          # 入口頁
├── main.js             # 應用啟動器
├── styles.css
├── shor-flow.js
├── controllers/        # 場景控制與視圖切換
├── scenes/             # Three.js 3D 場景
├── utils/              # 量子態數學
├── .nojekyll           # GitHub Pages 略過 Jekyll 處理
├── README.md
└── .gitignore
```

## 預覽

```bash
python3 -m http.server 8765
```

瀏覽器開啟 http://localhost:8765/

## 需求

- 現代瀏覽器（支援 ES Modules）
- 本機 HTTP 伺服器（不可直接用 `file://` 開啟）

## GitHub Pages

1. 前往 repo **Settings → Pages**
2. **Source** 選 `Deploy from a branch`
3. **Branch** 選 `main`，資料夾選 `/ (root)`
4. 儲存後等待數分鐘，網址會顯示在 Pages 設定頁

## 用 Grok Build 繼續開發

```bash
git clone https://github.com/NEOreload2025/quantum-qubit-showcase.git
cd quantum-qubit-showcase
grok
```