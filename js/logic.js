/**
 * Sushi Stack 2048 — GRO-19 classic 4×4 slide/merge.
 * Nigiri → Maki → Gunkan → Temaki → Chirashi → Platter → Feast.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SushiStack = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SIZE = 4;
  const MAX_TIER = 6;
  const DIRS = ["left", "right", "up", "down"];
  const BEST_KEY = "sushi-stack-2048-best";

  const TIERS = [
    { id: 0, name: "Nigiri", glyph: "N", file: "01_nigiri.png" },
    { id: 1, name: "Maki", glyph: "M", file: "02_maki.png" },
    { id: 2, name: "Gunkan", glyph: "G", file: "03_gunkan.png" },
    { id: 3, name: "Temaki", glyph: "T", file: "04_temaki.png" },
    { id: 4, name: "Chirashi", glyph: "C", file: "05_chirashi.png" },
    { id: 5, name: "Platter", glyph: "P", file: "06_platter.png" },
    { id: 6, name: "Feast", glyph: "F", file: "07_feast.png" },
  ];

  const MERGE_POINTS = [0, 10, 30, 80, 200, 500, 1200];
  const SPAWN_MAKI_CHANCE = 0.1;

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
    return Array.from({ length: SIZE }, function () {
      return Array(SIZE).fill(null);
    });
  }

  function cloneGrid(grid) {
    return grid.map(function (row) {
      return row.slice();
    });
  }

  function emptyCells(grid) {
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === null) cells.push({ row: r, col: c });
      }
    }
    return cells;
  }

  function spawnLowTier(rng) {
    return rng() < SPAWN_MAKI_CHANCE ? 1 : 0;
  }

  function spawnTile(state, forcedTier) {
    const cells = emptyCells(state.grid);
    if (!cells.length) return null;
    const pick = cells[Math.floor(state.rng() * cells.length)];
    const tier = forcedTier != null ? forcedTier : spawnLowTier(state.rng);
    state.grid[pick.row][pick.col] = tier;
    return { row: pick.row, col: pick.col, tier: tier };
  }

  function slideLine(cells) {
    const tiles = [];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] !== null) tiles.push(cells[i]);
    }
    const out = [];
    const merges = [];
    let score = 0;
    let i = 0;
    while (i < tiles.length) {
      if (
        i + 1 < tiles.length &&
        tiles[i] === tiles[i + 1] &&
        tiles[i] < MAX_TIER
      ) {
        const from = tiles[i];
        const to = from + 1;
        out.push(to);
        const gained = MERGE_POINTS[to];
        score += gained;
        merges.push({ from: from, to: to, gained: gained });
        i += 2;
      } else {
        out.push(tiles[i]);
        i += 1;
      }
    }
    while (out.length < SIZE) out.push(null);
    let moved = false;
    for (let j = 0; j < SIZE; j++) {
      if (cells[j] !== out[j]) {
        moved = true;
        break;
      }
    }
    return { line: out, score: score, merges: merges, moved: moved };
  }

  function readLine(grid, dir, index) {
    const line = [];
    for (let i = 0; i < SIZE; i++) {
      if (dir === "left") line.push(grid[index][i]);
      else if (dir === "right") line.push(grid[index][SIZE - 1 - i]);
      else if (dir === "up") line.push(grid[i][index]);
      else line.push(grid[SIZE - 1 - i][index]);
    }
    return line;
  }

  function writeLine(grid, dir, index, line) {
    for (let i = 0; i < SIZE; i++) {
      if (dir === "left") grid[index][i] = line[i];
      else if (dir === "right") grid[index][SIZE - 1 - i] = line[i];
      else if (dir === "up") grid[i][index] = line[i];
      else grid[SIZE - 1 - i][index] = line[i];
    }
  }

  function applyMove(grid, dir) {
    let moved = false;
    let score = 0;
    const merges = [];
    for (let index = 0; index < SIZE; index++) {
      const before = readLine(grid, dir, index);
      const result = slideLine(before);
      writeLine(grid, dir, index, result.line);
      if (result.moved) moved = true;
      score += result.score;
      for (let m = 0; m < result.merges.length; m++) {
        merges.push(result.merges[m]);
      }
    }
    return { moved: moved, score: score, merges: merges };
  }

  function canMoveDir(grid, dir) {
    return applyMove(cloneGrid(grid), dir).moved;
  }

  function hasMoves(grid) {
    if (emptyCells(grid).length) return true;
    for (let i = 0; i < DIRS.length; i++) {
      if (canMoveDir(grid, DIRS[i])) return true;
    }
    return false;
  }

  function seedOpening(state) {
    // Two Nigiri in the same row so one left/right swipe merges.
    const row = 1;
    const col = 1;
    state.grid[row][col] = 0;
    state.grid[row][col + 1] = 0;
    state.opening = [
      { row: row, col: col, tier: 0 },
      { row: row, col: col + 1, tier: 0 },
    ];
  }

  function createGame(options) {
    const opts = options || {};
    const seed =
      opts.seed != null ? opts.seed : Date.now() ^ (Math.random() * 0x100000000);
    const rng = mulberry32(seed >>> 0);
    const state = {
      size: SIZE,
      seed: seed >>> 0,
      grid: emptyGrid(),
      score: 0,
      over: false,
      lastMove: null,
      rng: rng,
    };
    if (opts.opening === false) {
      spawnTile(state, 0);
      spawnTile(state, 0);
    } else {
      seedOpening(state);
    }
    return state;
  }

  function move(state, dir) {
    if (state.over) return { ok: false, reason: "over" };
    if (DIRS.indexOf(dir) < 0) return { ok: false, reason: "bad-dir" };
    const result = applyMove(state.grid, dir);
    if (!result.moved) return { ok: false, reason: "blocked", dir: dir };
    state.score += result.score;
    const spawned = spawnTile(state);
    state.over = !hasMoves(state.grid);
    state.lastMove = {
      dir: dir,
      score: result.score,
      merges: result.merges,
      spawned: spawned,
    };
    return {
      ok: true,
      dir: dir,
      score: result.score,
      merges: result.merges,
      spawned: spawned,
      over: state.over,
    };
  }

  function loadBest(storage) {
    try {
      const raw = (storage || globalThis.localStorage).getItem(BEST_KEY);
      const n = parseInt(raw, 10);
      return n > 0 ? n : 0;
    } catch (err) {
      return 0;
    }
  }

  function saveBest(score, storage) {
    const prev = loadBest(storage);
    const best = score > prev ? score : prev;
    try {
      (storage || globalThis.localStorage).setItem(BEST_KEY, String(best));
    } catch (err) {}
    return best;
  }

  return {
    SIZE,
    COLS: SIZE,
    ROWS: SIZE,
    MAX_TIER,
    DIRS,
    BEST_KEY,
    TIERS,
    MERGE_POINTS,
    SPAWN_MAKI_CHANCE,
    mulberry32,
    emptyGrid,
    cloneGrid,
    emptyCells,
    spawnLowTier,
    spawnTile,
    slideLine,
    applyMove,
    canMoveDir,
    hasMoves,
    createGame,
    move,
    loadBest,
    saveBest,
  };
});
