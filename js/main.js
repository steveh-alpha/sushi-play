(function () {
  "use strict";

  const S = window.SushiStack;
  const TEACH_COPY = "Tap a column to drop. Match stack to merge.";

  const boardEl = document.getElementById("board");
  const fxEl = document.getElementById("fx");
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
  let dropping = false;
  let teachCopyOn = true;

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
    hintEl.hidden = false;
    hintEl.textContent = text;
  }

  function hideTeachCopy() {
    teachCopyOn = false;
    hintEl.textContent = "";
    hintEl.hidden = true;
  }

  function cellEl(row, col) {
    return boardEl.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
  }

  function targetCol() {
    if (state.teach) return state.teachCol;
    return hoverCol;
  }

  function clearGhost() {
    const ghosts = boardEl.querySelectorAll(".tile.ghost");
    for (let i = 0; i < ghosts.length; i++) ghosts[i].remove();
  }

  function paintGhost(col) {
    clearGhost();
    if (col === null || dropping) return;
    const row = S.lowestEmptyRow(state.grid, col);
    if (row < 0) return;
    const cell = cellEl(row, col);
    if (!cell) return;
    const ghost = document.createElement("div");
    renderTile(ghost, state.current);
    ghost.classList.add("ghost");
    ghost.setAttribute("aria-hidden", "true");
    cell.appendChild(ghost);
  }

  function paintWash(col) {
    let wash = fxEl.querySelector(".col-wash");
    if (!wash) {
      wash = document.createElement("div");
      wash.className = "col-wash";
      fxEl.appendChild(wash);
    }
    if (col === null || dropping) {
      wash.hidden = true;
      return;
    }
    const top = cellEl(0, col);
    if (!top) {
      wash.hidden = true;
      return;
    }
    const wrapRect = fxEl.getBoundingClientRect();
    const cellRect = top.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    wash.hidden = false;
    wash.style.left = cellRect.left - wrapRect.left + "px";
    wash.style.width = cellRect.width + "px";
    wash.style.top = boardRect.top - wrapRect.top + "px";
    wash.style.height = boardRect.height + "px";
  }

  function paintHover() {
    const col = targetCol();
    const cells = boardEl.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const isTarget = col !== null && cell.dataset.col === String(col);
      cell.classList.toggle("col-hover", isTarget);
      cell.classList.toggle("col-blocked", !!(state.teach && !isTarget));
    }
    boardEl.classList.toggle("teach-lock", !!state.teach);
    paintGhost(col);
    paintWash(col);
    if (teachCopyOn) {
      setHint(TEACH_COPY);
      return;
    }
    if (hoverCol !== null) setHint("Drop in column " + (hoverCol + 1));
    else {
      hintEl.textContent = "";
      hintEl.hidden = true;
    }
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

  function playDropTween(col, row, tier, done) {
    const startCell = cellEl(0, col);
    const endCell = cellEl(row, col);
    if (!startCell || !endCell) {
      done();
      return;
    }

    const wrapRect = fxEl.getBoundingClientRect();
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const dy = endRect.top - startRect.top;
    const duration = Math.min(420, Math.max(240, Math.abs(dy) * 1.15));

    const fall = document.createElement("div");
    renderTile(fall, tier);
    fall.classList.add("fall-tile");
    fall.style.left = startRect.left - wrapRect.left + "px";
    fall.style.top = startRect.top - wrapRect.top + "px";
    fall.style.width = startRect.width + "px";
    fall.style.height = startRect.height + "px";
    fxEl.appendChild(fall);

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (fall.parentNode) fall.parentNode.removeChild(fall);
      done();
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        fall.style.transition = "transform " + duration + "ms cubic-bezier(0.32, 0.08, 0.28, 1)";
        fall.style.transform = "translateY(" + dy + "px)";
      });
    });

    fall.addEventListener("transitionend", finish);
    setTimeout(finish, duration + 80);
  }

  function tryDrop(col) {
    if (dropping) return false;
    if (state.teach) col = state.teachCol;
    const row = S.lowestEmptyRow(state.grid, col);
    if (row < 0) {
      if (!teachCopyOn) setHint("Column full — try another");
      boardEl.classList.add("shake");
      setTimeout(function () {
        boardEl.classList.remove("shake");
      }, 240);
      render();
      return false;
    }

    const before = state.score;
    const held = state.current;
    dropping = true;
    paintHover();

    playDropTween(col, row, held, function () {
      const result = S.drop(state, col);
      dropping = false;
      if (!result.ok) {
        render();
        return;
      }
      if (teachCopyOn) hideTeachCopy();
      const gained = state.score - before;
      render();
      flashScore(gained, result.merge.chain);
    });
    return true;
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

  function resetPlay(seed) {
    state = S.createGame(seed != null ? { seed: seed } : {});
    hoverCol = null;
    pointerDown = false;
    ignoreClick = false;
    dropping = false;
    teachCopyOn = true;
    scoreFlashEl.textContent = "";
    fxEl.innerHTML = "";
    hintEl.hidden = false;
    render();
    return state;
  }

  newGameBtn.addEventListener("click", function () {
    resetPlay();
  });

  window.SushiStackPlay = {
    getState: function () {
      return state;
    },
    drop: tryDrop,
    render: render,
    newGame: resetPlay,
  };

  render();
})();
