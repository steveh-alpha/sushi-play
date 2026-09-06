/**
 * Sushi Stack 2048 — GRO-15 art demo (7 canon tiers).
 * Vertical same-tier merge only. No horizontal merge. No game-over.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SushiStack = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLS = 6;
  const ROWS = 8;
  const MAX_TIER = 6;

  const TIERS = [
    { id: 0, name: "Nigiri", glyph: "N" },
    { id: 1, name: "Maki", glyph: "M" },
    { id: 2, name: "Gunkan", glyph: "G" },
    { id: 3, name: "Temaki", glyph: "T" },
    { id: 4, name: "Chirashi", glyph: "C" },
    { id: 5, name: "Platter", glyph: "P" },
    { id: 6, name: "Feast", glyph: "F" },
  ];

  const MERGE_POINTS = [0, 10, 30, 80, 200, 500, 1200];
  const SPAWN_WEIGHTS = [50, 26, 12, 7, 3.5, 1.2, 0.3];

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function rng() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.slice());
  }

  function spawnTier(rng) {
    const total = SPAWN_WEIGHTS.reduce((s, w) => s + w, 0);
    let roll = rng() * total;
    for (let i = 0; i < SPAWN_WEIGHTS.length; i++) {
      roll -= SPAWN_WEIGHTS[i];
      if (roll <= 0) return i;
    }
    return 0;
  }

  function lowestEmptyRow(grid, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][col] === null) return r;
    }
    return -1;
  }

  function applyGravity(grid, col) {
    const stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][col] !== null) stack.push(grid[r][col]);
    }
    for (let r = 0; r < ROWS; r++) grid[r][col] = null;
    for (let i = 0; i < stack.length; i++) {
      grid[ROWS - 1 - i][col] = stack[i];
    }
  }

  function resolveVerticalMerges(grid, col) {
    let chain = 0;
    let score = 0;
    const merges = [];

    while (true) {
      applyGravity(grid, col);
      let found = false;
      for (let r = ROWS - 1; r > 0; r--) {
        const lower = grid[r][col];
        const upper = grid[r - 1][col];
        if (lower !== null && lower === upper && lower < MAX_TIER) {
          const result = lower + 1;
          grid[r][col] = result;
          grid[r - 1][col] = null;
          chain += 1;
          const gained = MERGE_POINTS[result] * chain;
          score += gained;
          merges.push({ row: r, col, from: lower, to: result, chain, gained });
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    return { chain, score, merges };
  }

  function createGame(options) {
    const opts = options || {};
    const seed = opts.seed != null ? opts.seed : (Date.now() ^ (Math.random() * 0x100000000));
    const rng = mulberry32(seed >>> 0);
    return {
      cols: COLS,
      rows: ROWS,
      seed: seed >>> 0,
      grid: emptyGrid(),
      score: 0,
      current: spawnTier(rng),
      next: spawnTier(rng),
      lastMerge: null,
      rng,
    };
  }

  function drop(state, col) {
    if (col < 0 || col >= COLS) return { ok: false, reason: "bad-col" };
    const row = lowestEmptyRow(state.grid, col);
    if (row < 0) return { ok: false, reason: "full" };
    state.grid[row][col] = state.current;
    const merge = resolveVerticalMerges(state.grid, col);
    state.score += merge.score;
    state.lastMerge = merge.merges.length ? merge : null;
    state.current = state.next;
    state.next = spawnTier(state.rng);
    return { ok: true, row, merge };
  }

  function columnHeight(grid, col) {
    let n = 0;
    for (let r = 0; r < ROWS; r++) if (grid[r][col] !== null) n++;
    return n;
  }

  return {
    COLS, ROWS, MAX_TIER, TIERS, MERGE_POINTS, SPAWN_WEIGHTS,
    mulberry32, emptyGrid, cloneGrid, spawnTier, lowestEmptyRow,
    applyGravity, resolveVerticalMerges, createGame, drop, columnHeight,
  };
});
