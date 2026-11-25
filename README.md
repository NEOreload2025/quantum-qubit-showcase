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

## 線上版

- Cloudflare Pages：https://quantum-qubit-showcase.pages.dev/
- GitHub Pages（尚未關閉）：https://neoreload2025.github.io/quantum-qubit-showcase/

本站為純靜態檔，相對路徑可在網站根路徑（`/`）運作。Cloudflare Pages 目前以 Direct Upload 發布；合併本 PR 並不會自動部署。GitHub Pages 設定先維持原樣，是否關閉或改轉址由倉庫擁有者決定。

## GitHub Pages

若仍要從 GitHub 發布：Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main`，資料夾選 `/ (root)`。

## 用 Grok Build 繼續開發

```bash
git clone https://github.com/NEOreload2025/quantum-qubit-showcase.git
cd quantum-qubit-showcase
grok
```