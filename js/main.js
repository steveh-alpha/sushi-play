(function () {
  "use strict";

  const S = window.SushiStack;
  const TEACH_COPY = "← → move · ↓ drop. Match to merge.";
  const TEACH_LOCK_COPY = "Drop here first";
  const SWIPE_PX = 24;

  const boardEl = document.getElementById("board");
  const fxEl = document.getElementById("fx");
  const teachCueEl = document.getElementById("teach-cue");
  const aimRailEl = document.getElementById("aim-rail");
  const playStageEl = document.querySelector(".play-stage");
  const scoreEl = document.getElementById("score");
  const scoreFlashEl = document.getElementById("score-flash");
  const currentTileEl = document.getElementById("current-tile");
  const nextTileEl = document.getElementById("next-tile");
  const hintEl = document.getElementById("hint");
  const newGameBtn = document.getElementById("new-game");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnDrop = document.getElementById("btn-drop");

  let state = S.createGame();
  let aimCol = S.TEACH_COL;
  let dropping = false;
  let teachCopyOn = true;
  let bounceHintOn = false;
  let lastFall = null;
  let ptr = null;

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

  function clampCol(col) {
    if (col < 0) return 0;
    if (col >= S.COLS) return S.COLS - 1;
    return col;
  }

  function contentRect(el) {
    const r = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const pl = parseFloat(cs.paddingLeft) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    const pt = parseFloat(cs.paddingTop) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    return {
      left: r.left + pl,
      top: r.top + pt,
      width: Math.max(0, r.width - pl - pr),
      height: Math.max(0, r.height - pt - pb),
    };
  }

  function clearGhost() {
    const ghosts = boardEl.querySelectorAll(".tile.ghost");
    for (let i = 0; i < ghosts.length; i++) ghosts[i].remove();
  }

  function paintGhost(col) {
    clearGhost();
    if (col === null || dropping) return;
    if (state.teach && col !== state.teachCol) return;
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

  function paintTeachCue(flash) {
    const cells = boardEl.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      cell.classList.toggle("teach-col", !!(state.teach && cell.dataset.col === String(state.teachCol)));
    }
    if (!teachCueEl) return;
    if (!state.teach || dropping) {
      teachCueEl.hidden = true;
      teachCueEl.classList.remove("is-flash");
      return;
    }
    const top = cellEl(0, state.teachCol);
    if (!top) {
      teachCueEl.hidden = true;
      return;
    }
    const layerRect = fxEl.getBoundingClientRect();
    const cellRect = top.getBoundingClientRect();
    teachCueEl.hidden = false;
    teachCueEl.textContent = TEACH_LOCK_COPY;
    teachCueEl.style.left = cellRect.left - layerRect.left + "px";
    teachCueEl.style.width = cellRect.width + "px";
    teachCueEl.style.top = cellRect.top - layerRect.top + 4 + "px";
    if (flash) {
      teachCueEl.classList.remove("is-flash");
      void teachCueEl.offsetWidth;
      teachCueEl.classList.add("is-flash");
      teachCueEl.addEventListener(
        "animationend",
        function () {
          teachCueEl.classList.remove("is-flash");
        },
        { once: true }
      );
    }
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
    const layerRect = fxEl.getBoundingClientRect();
    const cellRect = top.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    wash.hidden = false;
    wash.style.left = cellRect.left - layerRect.left + "px";
    wash.style.width = cellRect.width + "px";
    wash.style.top = "0";
    wash.style.height = boardRect.bottom - layerRect.top + "px";
  }

  function positionActivePiece(snap) {
    const top = cellEl(0, aimCol);
    if (!top || !aimRailEl) return;
    const railRect = aimRailEl.getBoundingClientRect();
    const cellRect = top.getBoundingClientRect();
    const width = cellRect.width;
    const height = Math.min(aimRailEl.clientHeight || width, cellRect.height);
    if (snap) currentTileEl.style.transition = "none";
    currentTileEl.style.left = cellRect.left - railRect.left + "px";
    currentTileEl.style.width = width + "px";
    currentTileEl.style.height = height + "px";
    currentTileEl.setAttribute("data-col", String(aimCol));
    if (snap) void currentTileEl.offsetWidth;
  }

  function paintAim() {
    const cells = boardEl.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      cell.classList.toggle("col-hover", cell.dataset.col === String(aimCol));
    }
    positionActivePiece();
    paintGhost(aimCol);
    paintWash(aimCol);
    paintTeachCue();
    if (bounceHintOn) setHint(TEACH_LOCK_COPY);
    else if (teachCopyOn) setHint(TEACH_COPY);
    else {
      hintEl.textContent = "";
      hintEl.hidden = true;
    }
  }

  function setAim(col) {
    aimCol = clampCol(col);
    paintAim();
    return aimCol;
  }

  function moveAim(delta) {
    if (dropping) return aimCol;
    return setAim(aimCol + delta);
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
    currentTileEl.classList.add("active-piece");
    currentTileEl.setAttribute("role", "button");
    currentTileEl.setAttribute("tabindex", "0");
    renderTile(nextTileEl, state.next, "NEXT");
    scoreEl.textContent = String(state.score);
    paintAim();
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

  function softBounceToTeach() {
    const from = aimCol;
    const dir = from < state.teachCol ? -1 : 1;
    currentTileEl.classList.remove("soft-bounce");
    currentTileEl.style.setProperty("--bounce-dir", String(dir));
    bounceHintOn = true;
    setAim(state.teachCol);
    paintTeachCue(true);
    void currentTileEl.offsetWidth;
    currentTileEl.classList.add("soft-bounce");
    currentTileEl.addEventListener(
      "animationend",
      function () {
        currentTileEl.classList.remove("soft-bounce");
        bounceHintOn = false;
        if (teachCopyOn && state.teach) setHint(TEACH_COPY);
      },
      { once: true }
    );
  }

  function playDropTween(col, row, tier, done) {
    const endCell = cellEl(row, col);
    if (!endCell) {
      done();
      return;
    }

    positionActivePiece(true);
    const layerRect = fxEl.getBoundingClientRect();
    const startRect = currentTileEl.getBoundingClientRect();
    currentTileEl.style.transition = "";
    const dest = contentRect(endCell);
    const dx = dest.left - startRect.left;
    const dy = dest.top - startRect.top;
    const dist = Math.hypot(dx, dy);
    const duration = Math.min(560, Math.max(320, dist * 0.85));

    currentTileEl.classList.add("is-dropping");

    const fall = document.createElement("div");
    renderTile(fall, tier);
    fall.classList.add("fall-tile");
    fall.style.left = startRect.left - layerRect.left + "px";
    fall.style.top = startRect.top - layerRect.top + "px";
    fall.style.width = dest.width + "px";
    fall.style.height = dest.height + "px";
    fxEl.appendChild(fall);

    lastFall = {
      col: col,
      landingRow: row,
      fromY: startRect.top,
      toY: dest.top,
      dx: dx,
      dy: dy,
      duration: duration,
    };

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (fall.parentNode) fall.parentNode.removeChild(fall);
      currentTileEl.classList.remove("is-dropping");
      done();
    }

    const anim = fall.animate(
      [
        { transform: "translate(0px, 0px)" },
        { transform: "translate(" + dx + "px, " + dy + "px)" },
      ],
      {
        duration: duration,
        easing: "cubic-bezier(0.32, 0.08, 0.28, 1)",
        fill: "forwards",
      }
    );

    if (anim && anim.finished) {
      anim.finished.then(finish, finish);
    } else {
      fall.style.transition = "transform " + duration + "ms cubic-bezier(0.32, 0.08, 0.28, 1)";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fall.style.transform = "translate(" + dx + "px, " + dy + "px)";
        });
      });
      fall.addEventListener("transitionend", finish);
    }
    setTimeout(finish, duration + 120);
  }

  function tryDrop(col) {
    if (dropping) return false;
    if (col == null) col = aimCol;
    col = clampCol(col);
    if (col !== aimCol) setAim(col);

    const preview = S.previewDrop(state, col);
    if (!preview.ok) {
      if (preview.reason === "teach") {
        softBounceToTeach();
        return false;
      }
      if (preview.reason === "full") {
        if (!teachCopyOn) setHint("Column full — try another");
        boardEl.classList.add("shake");
        setTimeout(function () {
          boardEl.classList.remove("shake");
        }, 240);
        paintAim();
      }
      return false;
    }

    const row = preview.row;
    const before = state.score;
    const held = state.current;
    dropping = true;
    paintAim();

    playDropTween(col, row, held, function () {
      const result = S.drop(state, col);
      dropping = false;
      if (!result.ok) {
        render();
        return;
      }
      lastFall = lastFall
        ? Object.assign({}, lastFall, { placedRow: result.row, merged: !!(result.merge && result.merge.chain) })
        : lastFall;
      if (teachCopyOn) hideTeachCopy();
      const gained = state.score - before;
      render();
      flashScore(gained, result.merge.chain);
    });
    return true;
  }

  function colFromEvent(event) {
    const rect = boardEl.getBoundingClientRect();
    const railRect = aimRailEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < 0 || x > rect.width) return null;
    if (event.clientY < railRect.top - 8 || event.clientY > rect.bottom + 8) return null;
    const col = Math.floor((x / rect.width) * S.COLS);
    if (col < 0 || col >= S.COLS) return null;
    return col;
  }

  function onPieceActivate(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    tryDrop(aimCol);
  }

  playStageEl.addEventListener("pointerdown", function (event) {
    if (event.button !== undefined && event.button !== 0) return;
    ptr = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      col: aimCol,
      swiped: false,
      onPiece: event.target === currentTileEl || currentTileEl.contains(event.target),
    };
    try {
      playStageEl.setPointerCapture(event.pointerId);
    } catch (err) {}
    event.preventDefault();
  });

  playStageEl.addEventListener("pointermove", function (event) {
    if (!ptr) return;
    const dx = event.clientX - ptr.x;
    if (Math.abs(dx) < SWIPE_PX) return;
    ptr.swiped = true;
    const rect = boardEl.getBoundingClientRect();
    const colW = rect.width / S.COLS;
    const steps = Math.round(dx / Math.max(colW, 1));
    setAim(ptr.col + steps);
  });

  function endPointer(event) {
    if (!ptr) return;
    const info = ptr;
    ptr = null;
    if (info.swiped) return;
    if (info.onPiece) {
      tryDrop(aimCol);
      return;
    }
    const col = colFromEvent(event);
    if (col === null) return;
    if (col === aimCol) tryDrop(col);
    else setAim(col);
  }

  playStageEl.addEventListener("pointerup", endPointer);
  playStageEl.addEventListener("pointercancel", function () {
    ptr = null;
  });

  currentTileEl.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPieceActivate(event);
    }
  });

  btnLeft.addEventListener("click", function () {
    moveAim(-1);
  });
  btnRight.addEventListener("click", function () {
    moveAim(1);
  });
  btnDrop.addEventListener("click", function () {
    tryDrop(aimCol);
  });

  window.addEventListener("keydown", function (event) {
    const onNewGame = event.target && event.target.id === "new-game";
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveAim(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveAim(1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      tryDrop(aimCol);
    } else if ((event.key === " " || event.key === "Spacebar") && !onNewGame) {
      event.preventDefault();
      tryDrop(aimCol);
    }
  });

  window.addEventListener("resize", function () {
    positionActivePiece();
    paintWash(aimCol);
    paintTeachCue();
  });

  function resetPlay(seed) {
    state = S.createGame(seed != null ? { seed: seed } : {});
    aimCol = state.teachCol;
    ptr = null;
    dropping = false;
    teachCopyOn = true;
    bounceHintOn = false;
    lastFall = null;
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
    getAim: function () {
      return aimCol;
    },
    moveLeft: function () {
      return moveAim(-1);
    },
    moveRight: function () {
      return moveAim(1);
    },
    setAim: setAim,
    drop: tryDrop,
    render: render,
    newGame: resetPlay,
    lastFall: function () {
      return lastFall;
    },
    teachCue: function () {
      return teachCueEl;
    },
  };

  render();
})();
