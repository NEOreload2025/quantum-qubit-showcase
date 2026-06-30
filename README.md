# Quantum Qubit Showcase

互動式 3D 量子電腦教學展示：Bloch 球、量子閘門、雙量子位元糾纏、量子處理器模型、Shor 演算法流程。

## 專案結構（為何是雙層目錄？）

```
quantum-qubit-showcase/     ← Git 倉庫根目錄（專案說明與設定）
├── README.md
├── .gitignore
└── quantum-showcase/       ← 可部署的 Web 應用（HTTP 伺服器根目錄）
    ├── index.html
    ├── main.js
    ├── controllers/        # 場景控制與視圖切換
    ├── scenes/             # Three.js 3D 場景
    ├── utils/              # 量子態數學
    └── shor-flow.js
```

**這樣設計是合理的：**

- 倉庫根目錄放 `README`、`.gitignore` 等**專案級**檔案
- `quantum-showcase/` 是**可直接部署**的靜態網站，執行 `python3 -m http.server` 時只需進入此目錄
- 未來若加入測試、CI、文件等，可放在根目錄而不污染網站檔案

若未來專案只保留這一個網頁、不再擴充，也可將 `quantum-showcase/` 內容提升到根目錄（扁平化）。目前維持雙層結構較利於擴展。

## 預覽

```bash
cd quantum-showcase
python3 -m http.server 8765
```

瀏覽器開啟 http://localhost:8765/

## 需求

- 現代瀏覽器（支援 ES Modules）
- 本機 HTTP 伺服器（不可直接用 `file://` 開啟）

## 用 Grok Build 繼續開發

```bash
git clone https://github.com/NEOreload2025/quantum-qubit-showcase.git
cd quantum-qubit-showcase
grok
```