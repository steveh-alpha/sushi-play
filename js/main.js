(function () {
  "use strict";

  const S = window.SushiStack;
  const HINT = "Swipe or arrows to merge sushi.";
  const SWIPE_PX = 28;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const scoreFlashEl = document.getElementById("score-flash");
  const hintEl = document.getElementById("hint");
  const newGameBtn = document.getElementById("new-game");
  const overlayEl = document.getElementById("overlay");
  const overlayNewBtn = document.getElementById("overlay-new");

  let state = S.createGame();
  let best = S.loadBest();
  let hintOn = true;
  let busy = false;
  let ptr = null;

  function tileClass(tier, extra) {
    return "tile tier-" + tier + (extra ? " " + extra : "");
  }

  function renderTile(el, tier, extra) {
    const meta = S.TIERS[tier];
    el.className = tileClass(tier, extra);
    el.setAttribute("data-name", meta.name);
    el.innerHTML =
      '<span class="glyph">' +
      meta.glyph +
      '</span><span class="name">' +
      meta.name +
      "</span>";
  }

  function showHint() {
    hintEl.hidden = false;
    hintEl.textContent = HINT;
  }

  function hideHint() {
    hintOn = false;
    hintEl.textContent = "";
    hintEl.hidden = true;
  }

  function paintScores() {
    scoreEl.textContent = String(state.score);
    bestEl.textContent = String(best);
  }

  function paintOverlay() {
    overlayEl.hidden = !state.over;
  }

  function render(opts) {
    const options = opts || {};
    boardEl.style.setProperty("--cols", String(S.SIZE));
    boardEl.style.setProperty("--rows", String(S.SIZE));
    boardEl.innerHTML = "";

    const spawned = options.spawned;
    const mergedTiers = options.mergedTiers || [];

    for (let r = 0; r < S.SIZE; r++) {
      for (let c = 0; c < S.SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        const tier = state.grid[r][c];
        if (tier !== null) {
          const tile = document.createElement("div");
          let extra = "";
          if (spawned && spawned.row === r && spawned.col === c) extra = "new";
          else if (mergedTiers.indexOf(tier) >= 0) extra = "merged";
          renderTile(tile, tier, extra);
          cell.appendChild(tile);
        }
        boardEl.appendChild(cell);
      }
    }

    paintScores();
    paintOverlay();
    if (hintOn) showHint();
    else hideHint();
  }

  function flashScore(gained) {
    if (!gained) {
      scoreFlashEl.textContent = "";
      return;
    }
    scoreFlashEl.textContent = "+" + gained;
    scoreFlashEl.classList.remove("pop");
    void scoreFlashEl.offsetWidth;
    scoreFlashEl.classList.add("pop");
  }

  function playMove(dir) {
    if (busy || state.over) return false;
    const result = S.move(state, dir);
    if (!result.ok) return false;
    if (hintOn && result.merges && result.merges.length) hideHint();
    best = S.saveBest(state.score);
    const mergedTiers = result.merges.map(function (m) {
      return m.to;
    });
    render({ spawned: result.spawned, mergedTiers: mergedTiers });
    flashScore(result.score);
    return true;
  }

  function resetPlay(seed) {
    state = S.createGame(seed != null ? { seed: seed } : {});
    hintOn = true;
    busy = false;
    ptr = null;
    scoreFlashEl.textContent = "";
    overlayEl.hidden = true;
    render();
    return state;
  }

  function dirFromKey(key) {
    if (key === "ArrowLeft") return "left";
    if (key === "ArrowRight") return "right";
    if (key === "ArrowUp") return "up";
    if (key === "ArrowDown") return "down";
    return null;
  }

  function dirFromSwipe(dx, dy) {
    if (Math.abs(dx) < SWIPE_PX && Math.abs(dy) < SWIPE_PX) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  window.addEventListener("keydown", function (event) {
    const dir = dirFromKey(event.key);
    if (!dir) return;
    event.preventDefault();
    playMove(dir);
  });

  boardEl.addEventListener("pointerdown", function (event) {
    if (event.button !== undefined && event.button !== 0) return;
    ptr = { x: event.clientX, y: event.clientY };
    try {
      boardEl.setPointerCapture(event.pointerId);
    } catch (err) {}
    event.preventDefault();
  });

  function endPointer(event) {
    if (!ptr) return;
    const dx = event.clientX - ptr.x;
    const dy = event.clientY - ptr.y;
    ptr = null;
    const dir = dirFromSwipe(dx, dy);
    if (dir) playMove(dir);
  }

  boardEl.addEventListener("pointerup", endPointer);
  boardEl.addEventListener("pointercancel", function () {
    ptr = null;
  });

  newGameBtn.addEventListener("click", function () {
    resetPlay();
  });
  overlayNewBtn.addEventListener("click", function () {
    resetPlay();
  });

  window.SushiStackPlay = {
    getState: function () {
      return state;
    },
    move: playMove,
    render: render,
    newGame: resetPlay,
    hintOn: function () {
      return hintOn;
    },
  };

  render();
})();
