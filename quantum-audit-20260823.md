# 量子位元教學網站審查報告（2026-08-23）

> 審查：N550（nvidia/nemotron-3-ultra-550b）完整審查 89.6KB（3138 行）。
> 原 OPUS 製作。目標：找出改進空間，不弄壞現有功能。

## 結論

架構乾淨、教學內容 9 成正確，但 Three.js 生命週期管理有洩漏風險、行動 UX/a11y 有缺口、Shor 文字需精修、視覺需統一。

## P0（建議先修，3 項）

1. **OrbitControls 未 dispose**（main.js:33-36、view-manager.js:94-97）——4 個 controls 綁同 canvas，切換視圖舊 controls 事件監聽器疊加 → memory leak
2. **非啟用場景仍 tick**（main.js:78-86）——4 個 scene 同時在記憶體旋轉/渲染
3. **shor-flow 重複綁定 handler**（shor-flow.js:180-190）——initShorFlow 每次呼叫重複 addEventListener

## 教學內容正確性（N550 抓到的物理問題）

- `formatQubit` 忽略 alpha 虛部（Y|0⟩=i|1⟩ 會顯示錯）→ 教學誤導
- Bloch 球混態門檻 0.98 太寬 → 極點附近誤判混態
- 四種 Bell 態單球無法區分（正確），但 phiMinus/psiMinus 的相位差未在視覺呈現
- Shor 步驟 3/6/8 描述不精確（QFT「類似古典 FFT」易誤解、gcd 條件未說明）

## 視覺

- bloch-sphere.js:93 已註解「修 F5 標籤疊加」但漏加 `tex.needsUpdate = true`（這是真 bug，註解跟實作不符）
- 色彩四色並用缺語意、動畫節奏不一致（SPIN 62 秒一圈太慢、PULSE 0.5 秒太閃）

## 完整清單

原始 25 項清單（含 P0/P1/P2/P3 優先級表）當時存於 `/tmp/quantum-n550-output.txt`，
該暫存檔已佚失，此處僅保留結論與 P0 細節。

## 後續落地狀況（2026-09-12 補註）

- ✅ 教學內容項：`formatQubit` 補 alpha 虛部、混態門檻 0.98→0.999 → 已於 `37e290a` 修復
- ✅ 「非啟用場景仍 tick」（P0#2）→ `274bea1` "tick only active view" 已處理
- ⬜ P0#1 OrbitControls 未 dispose → 本次查核時程式碼內仍未見 `dispose`，疑似未修
- ⬜ P0#3 shor-flow 重複綁定 handler → 未查核
