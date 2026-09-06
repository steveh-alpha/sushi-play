(function () {
  "use strict";

  const S = window.SushiStack;
  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const scoreFlashEl = document.getElementById("score-flash");
  const currentTileEl = document.getElementById("current-tile");
  const nextTileEl = document.getElementById("next-tile");
  const hintEl = document.getElementById("hint");
  const newGameBtn = document.getElementById("new-game");

  let state = S.createGame();
  let hoverCol = null;
  let pointerDown = false;
  let ignoreClick = false;

  function tileClass(tier) {
    return "tile tier-" + tier;
  }

  function renderTile(el, tier, label) {
    el.className = tileClass(tier);
    const meta = S.TIERS[tier];
    el.innerHTML =
      '<span class="glyph">' +
      meta.glyph +
      '</span><span class="name">' +
      meta.name +
      "</span>" +
      (label ? '<span class="slot">' + label + "</span>" : "");
  }

  function setHint(text) {
    hintEl.textContent = text;
  }

  function paintHover() {
    const cells = boardEl.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      cell.classList.toggle("col-hover", hoverCol !== null && cell.dataset.col === String(hoverCol));
    }
    if (hoverCol !== null) setHint("Drop in column " + (hoverCol + 1));
    else setHint("Tap or drag a column to drop");
  }

  function render() {
    boardEl.style.setProperty("--cols", String(S.COLS));
    boardEl.style.setProperty("--rows", String(S.ROWS));
    boardEl.innerHTML = "";

    for (let r = 0; r < S.ROWS; r++) {
      for (let c = 0; c < S.COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.col = String(c);
        cell.dataset.row = String(r);
        const tier = state.grid[r][c];
        if (tier !== null) {
          const tile = document.createElement("div");
          renderTile(tile, tier);
          cell.appendChild(tile);
        }
        boardEl.appendChild(cell);
      }
    }

    renderTile(currentTileEl, state.current, "NOW");
    renderTile(nextTileEl, state.next, "NEXT");
    scoreEl.textContent = String(state.score);
    paintHover();
  }

  function flashScore(gained, chain) {
    if (!gained) {
      scoreFlashEl.textContent = "";
      return;
    }
    scoreFlashEl.textContent = "+" + gained + (chain > 1 ? "  ×" + chain : "");
    scoreFlashEl.classList.remove("pop");
    void scoreFlashEl.offsetWidth;
    scoreFlashEl.classList.add("pop");
  }

  function tryDrop(col) {
    const before = state.score;
    const held = state.current;
    const result = S.drop(state, col);
    if (!result.ok) {
      if (result.reason === "full") {
        setHint("Column full — try another");
        boardEl.classList.add("shake");
        setTimeout(function () {
          boardEl.classList.remove("shake");
        }, 240);
      }
      render();
      return false;
    }
    const gained = state.score - before;
    render();
    flashScore(gained, result.merge.chain);
    return { held: held, gained: gained, chain: result.merge.chain };
  }

  function colFromEvent(event) {
    const rect = boardEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || x > rect.width || y < -8 || y > rect.height + 8) return null;
    const col = Math.floor((x / rect.width) * S.COLS);
    if (col < 0 || col >= S.COLS) return null;
    return col;
  }

  boardEl.addEventListener("pointerdown", function (event) {
    if (event.button !== undefined && event.button !== 0) return;
    pointerDown = true;
    ignoreClick = false;
    boardEl.setPointerCapture(event.pointerId);
    hoverCol = colFromEvent(event);
    paintHover();
    event.preventDefault();
  });

  boardEl.addEventListener("pointermove", function (event) {
    const col = colFromEvent(event);
    if (col === hoverCol) return;
    hoverCol = col;
    paintHover();
  });

  function endPointer(event) {
    if (!pointerDown) return;
    pointerDown = false;
    const col = colFromEvent(event);
    hoverCol = null;
    if (col !== null) {
      ignoreClick = true;
      tryDrop(col);
      return;
    }
    paintHover();
  }

  boardEl.addEventListener("pointerup", endPointer);
  boardEl.addEventListener("pointercancel", function () {
    pointerDown = false;
    hoverCol = null;
    paintHover();
  });

  boardEl.addEventListener("pointerleave", function () {
    if (pointerDown) return;
    hoverCol = null;
    paintHover();
  });

  boardEl.addEventListener("click", function (event) {
    if (ignoreClick) {
      ignoreClick = false;
      return;
    }
    const col = colFromEvent(event);
    if (col === null) return;
    hoverCol = null;
    tryDrop(col);
  });

  newGameBtn.addEventListener("click", function () {
    state = S.createGame();
    hoverCol = null;
    pointerDown = false;
    ignoreClick = false;
    scoreFlashEl.textContent = "";
    render();
  });

  window.SushiStackPlay = {
    getState: function () {
      return state;
    },
    drop: tryDrop,
    render: render,
    newGame: function (seed) {
      state = S.createGame(seed != null ? { seed: seed } : {});
      hoverCol = null;
      render();
      return state;
    },
  };

  render();
})();
