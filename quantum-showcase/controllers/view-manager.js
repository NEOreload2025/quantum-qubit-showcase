export const VIEW_META = {
  bloch: {
    tag: "Bloch 球",
    desc: "單量子位元態空間 — 拖曳旋轉、套用閘門",
    showCanvas: true,
  },
  gates: {
    tag: "量子閘門",
    desc: "H 與 CNOT 電路逐步演示",
    showCanvas: true,
  },
  entangle: {
    tag: "量子糾纏",
    desc: "雙 Bloch 球 — Bell 態與量測坍縮",
    showCanvas: true,
  },
  processor: {
    tag: "量子處理器",
    desc: "超導量子位元陣列示意",
    showCanvas: true,
  },
  shor: {
    tag: "Shor 演算法",
    desc: "質因數分解的量子加速流程",
    showCanvas: false,
  },
};

const FADE_MS = 160;

export function createViewManager(deps) {
  const {
    tabs,
    canvas,
    canvasWrap,
    canvasLabel,
    shorPanel,
    controlPanels,
    blochLegend,
    gateLegend,
    entangleLegend,
    orbits,
    ensureShorController,
    shorControllerRef,
  } = deps;

  let activeView = "bloch";
  let transitioning = false;

  function applyViewState(view) {
    const meta = VIEW_META[view];
    const isShor = view === "shor";

    tabs.forEach((t) => {
      const on = t.dataset.view === view;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
    });

    Object.entries(controlPanels).forEach(([key, el]) => {
      if (el) el.hidden = key !== view;
    });

    blochLegend.hidden = view !== "bloch";
    gateLegend.hidden = view !== "gates";
    entangleLegend.hidden = view !== "entangle";

    canvasLabel.innerHTML = `<span class="overlay-tag">${meta.tag}</span><span class="overlay-desc">${meta.desc}</span>`;

    canvas.hidden = !meta.showCanvas;
    canvas.style.display = isShor ? "none" : "block";
    canvas.style.pointerEvents = isShor ? "none" : "auto";
    canvasLabel.style.display = isShor ? "none" : "";
    blochLegend.style.display = view === "bloch" ? "" : "none";
    gateLegend.style.display = view === "gates" ? "" : "none";
    entangleLegend.style.display = view === "entangle" ? "" : "none";

    if (isShor) {
      canvasWrap.classList.add("shor-mode");
      shorPanel.hidden = false;
      shorPanel.setAttribute("aria-hidden", "false");
      const ctrl = ensureShorController();
      if (ctrl.getActiveStep() < 0) ctrl.selectStep(0);
    } else {
      canvasWrap.classList.remove("shor-mode");
      shorPanel.hidden = true;
      shorPanel.setAttribute("aria-hidden", "true");
      shorControllerRef.current?.stopPlay?.();
    }

    orbits.bloch.enabled = view === "bloch";
    orbits.gates.enabled = view === "gates";
    orbits.entangle.enabled = view === "entangle";
    orbits.processor.enabled = view === "processor";

    activeView = view;
  }

  async function switchView(view) {
    if (view === activeView || transitioning || !VIEW_META[view]) return;

    const fromCanvas = VIEW_META[activeView].showCanvas;
    const toCanvas = VIEW_META[view].showCanvas;
    const needsFade = fromCanvas || toCanvas;

    transitioning = true;
    if (needsFade) {
      canvasWrap.classList.add("view-fade");
      await new Promise((r) => setTimeout(r, FADE_MS));
    }

    applyViewState(view);

    if (needsFade) {
      requestAnimationFrame(() => {
        canvasWrap.classList.remove("view-fade");
        transitioning = false;
      });
    } else {
      transitioning = false;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });

  function bindOrbitDragFeedback(orbit, name) {
    orbit.addEventListener("start", () => {
      canvasWrap.classList.add("is-dragging");
      canvasWrap.dataset.dragScene = name;
    });
    orbit.addEventListener("end", () => {
      canvasWrap.classList.remove("is-dragging");
      delete canvasWrap.dataset.dragScene;
    });
  }

  return {
    getActiveView: () => activeView,
    switchView,
    bindOrbitDragFeedback,
    applyViewState,
  };
}