const SHOR_STEPS = [
  {
    id: 1,
    title: "輸入要分解的數字 N",
    plain: "例如 N = 15，我們想知道 15 = ? × ?",
    why: "沒有目標數字，後面的演算法無從下手。",
    desc: "欲分解的合成數，例如 N = 15",
    detail: "Shor 演算法解決「大整數質因數分解」。這直接影響 RSA 等現代加密的安全性。",
    icon: "N",
    color: "cyan",
  },
  {
    id: 2,
    title: "古典電腦先試試運氣",
    plain: "隨機選 a（如 a=7），看能不能直接用 gcd 找到因子",
    why: "有時不用量子電腦就能解，可省下量子資源。",
    desc: "檢查 N 是否為偶數、完全平方數；隨機選 a < N",
    detail: "若 gcd(a,N) > 1，已找到因子，結束。否則進入量子步驟求週期 r。",
    icon: "a",
    color: "purple",
  },
  {
    id: 3,
    title: "準備兩組量子位元",
    plain: "寄存器 1 記錄指數 x，寄存器 2 記錄 aˣ mod N 的結果",
    why: "一組負責「試哪些 x」，一組負責「算結果」，分工才能平行運算。",
    desc: "第一寄存器 |0…0⟩，第二寄存器 |1⟩",
    detail: "第一寄存器將承載所有可能的 x 的疊加；第二寄存器用來計算 aˣ mod N。",
    icon: "|0⟩",
    color: "green",
  },
  {
    id: 4,
    title: "創建疊加態（H 閘門）",
    plain: "讓所有可能的 x 同時存在，一次平行嘗試",
    why: "這是量子加速的核心：同時探索所有指數，而非逐一嘗試。",
    desc: "對第一寄存器施加 H⊗ⁿ",
    detail: "Hadamard 把 |0…0⟩ 變成所有 x 的均勻疊加 Σ|x⟩，這是量子平行性的來源。",
    icon: "H",
    color: "cyan",
  },
  {
    id: 5,
    title: "計算 aˣ mod N",
    plain: "量子電腦同時計算每個 x 對應的模冪值",
    why: "模冪結果會重複出現規律（週期 r），這是後續能找到因子的關鍵。",
    desc: "|x⟩|1⟩ → |x⟩|aˣ mod N⟩",
    detail: "這是量子算術黑盒 Uf。結果帶有週期性規律，但還看不清楚。",
    icon: "Uf",
    color: "purple",
  },
  {
    id: 6,
    title: "量子傅立葉變換 QFT",
    plain: "把隱藏的週期規律變成明顯的峰值",
    why: "週期藏在疊加態裡很難直接讀；QFT 把它轉成容易量測的頻率訊號。",
    desc: "對第一寄存器施加 QFT",
    detail: "QFT 類似古典 FFT，能把週期性訊號轉成頻率尖峰，讓週期 r 浮出水面。",
    icon: "QFT",
    color: "green",
  },
  {
    id: 7,
    title: "量測，讀出週期線索",
    plain: "量測結果近似 k/r，用連分數還原真正的 r",
    why: "量子部分到此為止；量測值是連接量子與古典計算的橋樑。",
    desc: "取得近似值 k / r 的測量結果",
    detail: "量測後量子態坍縮。古典電腦用連分數展開，從測量值推回週期 r。",
    icon: "M",
    color: "cyan",
  },
  {
    id: 8,
    title: "古典電腦算出因子",
    plain: "用 r 計算 gcd(a^(r/2)±1, N) 得到 p 和 q",
    why: "週期 r 本身不是答案；gcd 才能把數學規律變成真正的質因子。",
    desc: "若 r 為偶數且 a^(r/2) ≢ −1 (mod N)",
    detail: "這步在古典電腦上完成。若條件成立，gcd 即給出 N 的非平凡因子。",
    icon: "gcd",
    color: "pink",
  },
  {
    id: 9,
    title: "完成！N = p × q",
    plain: "15 = 3 × 5，質因數分解成功",
    why: "分解完成意味著這個數的密碼強度已被破解（在足夠大的量子電腦上）。",
    desc: "N = p × q 分解完成",
    detail: "實用上分解 2048-bit RSA 仍需數百萬邏輯量子位元（含錯誤校正），仍是長期目標。",
    icon: "✓",
    color: "green",
  },
];

export function initShorFlow(container, { onStepChange } = {}) {
  container.innerHTML = `
    <div class="shor-wrap">
      <div class="shor-intro card-inline">
        <strong>白話一句話：</strong>Shor 用「量子平行 + 找週期」把大數分解變快。
        下方 9 步依序點選，或按自動播放。每步都標註「為什麼重要」。
      </div>
      <div class="shor-header">
        <h2>Shor 演算法流程</h2>
        <p>質因數分解的量子加速路徑</p>
      </div>
      <div class="shor-controls">
        <button type="button" class="shor-btn primary" data-action="play">▶ 自動播放</button>
        <button type="button" class="shor-btn" data-action="reset">↺ 重設</button>
        <button type="button" class="shor-btn" data-action="prev">← 上一步</button>
        <button type="button" class="shor-btn" data-action="next">下一步 →</button>
      </div>
      <div class="shor-status" id="shor-status" aria-live="polite">
        <span class="shor-status-step">尚未選擇步驟</span>
        <span class="shor-progress" id="shor-progress">0 / ${SHOR_STEPS.length}</span>
      </div>
      <div class="shor-flow" id="shor-flow"></div>
      <div class="shor-detail-panel" id="shor-detail">
        <h3>👆 點選上方任一步驟</h3>
        <p class="shor-detail-plain">Shor 演算法把「找質因子」這個難題，轉成「找函數週期」。</p>
        <p class="shor-detail-sub">量子部分負責找週期，古典部分負責算 gcd 得出因子。</p>
      </div>
      <div class="shor-example">
        <h4>具體範例：分解 N = 15</h4>
        <div class="shor-example-flow">
          <div class="ex-step"><span>選 a=7</span></div>
          <div class="ex-arrow">→</div>
          <div class="ex-step highlight"><span>量子找到 r=4</span></div>
          <div class="ex-arrow">→</div>
          <div class="ex-step"><span>7²≡1(mod15)</span></div>
          <div class="ex-arrow">→</div>
          <div class="ex-step highlight"><span>gcd(6,15)=3</span></div>
          <div class="ex-arrow">→</div>
          <div class="ex-step"><span>15=3×5 ✓</span></div>
        </div>
      </div>
    </div>
  `;

  const flowEl = container.querySelector("#shor-flow");
  const detailEl = container.querySelector("#shor-detail");
  const progressEl = container.querySelector("#shor-progress");
  const statusEl = container.querySelector(".shor-status-step");
  const playBtn = container.querySelector('[data-action="play"]');
  const resetBtn = container.querySelector('[data-action="reset"]');
  const prevBtn = container.querySelector('[data-action="prev"]');
  const nextBtn = container.querySelector('[data-action="next"]');

  const nodeEls = [];

  SHOR_STEPS.forEach((step, i) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `shor-node color-${step.color}`;
    node.dataset.step = String(i);
    node.innerHTML = `
      <span class="shor-node-icon">${step.icon}</span>
      <span class="shor-node-id">${step.id}</span>
      <span class="shor-node-title">${step.title}</span>
      <span class="shor-node-desc">${step.plain}</span>
      <span class="shor-node-why">💡 ${step.why}</span>
    `;
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      selectStep(i, false);
    });
    flowEl.appendChild(node);
    nodeEls.push(node);

    if (i < SHOR_STEPS.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "shor-arrow";
      arrow.textContent = "↓";
      flowEl.appendChild(arrow);
    }
  });

  let activeStep = -1;
  let playing = false;
  let playTimer = null;

  function renderDetail(step, idx) {
    detailEl.innerHTML = `
      <div class="shor-detail-badge">步驟 ${step.id} / ${SHOR_STEPS.length}</div>
      <h3>${step.title}</h3>
      <p class="shor-detail-plain">${step.plain}</p>
      <p class="shor-detail-why"><strong>為什麼重要：</strong>${step.why}</p>
      <p class="shor-detail-main">${step.desc}</p>
      <p class="shor-detail-sub">${step.detail}</p>
    `;
    progressEl.textContent = `${idx + 1} / ${SHOR_STEPS.length}`;
    statusEl.textContent = `目前：步驟 ${step.id} — ${step.title}`;
    statusEl.classList.add("flash");
    setTimeout(() => statusEl.classList.remove("flash"), 600);
    onStepChange?.(step, idx);
  }

  function selectStep(idx, fromPlay = false) {
    if (idx < 0 || idx >= SHOR_STEPS.length) return;
    activeStep = idx;

    const arrows = flowEl.querySelectorAll(".shor-arrow");
    nodeEls.forEach((n, i) => {
      n.classList.toggle("active", i === idx);
      n.classList.toggle("done", i < idx);
    });
    arrows.forEach((a, i) => a.classList.toggle("active", i < idx));

    renderDetail(SHOR_STEPS[idx], idx);
    nodeEls[idx].scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (!fromPlay) stopPlay();
  }

  function stopPlay() {
    playing = false;
    playBtn.textContent = "▶ 自動播放";
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  function startPlay() {
    if (playing) {
      stopPlay();
      return;
    }
    playing = true;
    playBtn.textContent = "⏸ 暫停";
    let idx = activeStep < 0 ? 0 : activeStep;
    selectStep(idx, true);

    playTimer = setInterval(() => {
      idx += 1;
      if (idx >= SHOR_STEPS.length) {
        stopPlay();
        return;
      }
      selectStep(idx, true);
    }, 2500);
  }

  function reset() {
    stopPlay();
    activeStep = -1;
    nodeEls.forEach((n) => n.classList.remove("active", "done"));
    flowEl.querySelectorAll(".shor-arrow").forEach((a) => a.classList.remove("active"));
    detailEl.innerHTML = `
      <h3>👆 點選上方任一步驟</h3>
      <p class="shor-detail-plain">Shor 演算法把「找質因子」轉成「找函數週期」。</p>
      <p class="shor-detail-sub">量子部分負責找週期，古典部分負責算 gcd 得出因子。</p>
    `;
    progressEl.textContent = `0 / ${SHOR_STEPS.length}`;
    statusEl.textContent = "尚未選擇步驟";
  }

  playBtn.addEventListener("click", (e) => { e.stopPropagation(); startPlay(); });
  resetBtn.addEventListener("click", (e) => { e.stopPropagation(); reset(); });
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectStep(activeStep <= 0 ? 0 : activeStep - 1);
  });
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectStep(activeStep < 0 ? 0 : Math.min(activeStep + 1, SHOR_STEPS.length - 1));
  });

  return {
    stopPlay,
    play: startPlay,
    reset,
    selectStep,
    getActiveStep: () => activeStep,
  };
}