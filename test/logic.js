"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const S = require("../js/logic.js");

assert.strictEqual(S.SIZE, 4);
assert.strictEqual(S.COLS, 4);
assert.strictEqual(S.ROWS, 4);

const g = S.createGame({ seed: 1 });
assert.strictEqual(g.grid.length, 4);
assert.strictEqual(g.grid[0].length, 4);
assert.strictEqual(g.grid[1][1], 0, "opening Nigiri");
assert.strictEqual(g.grid[1][2], 0, "adjacent Nigiri so one swipe merges");
assert.strictEqual(g.score, 0);

let occupied = 0;
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    if (g.grid[r][c] !== null) occupied += 1;
  }
}
assert.strictEqual(occupied, 2, "start has exactly two tiles");

assert.strictEqual(S.canMoveDir(g.grid, "left"), true);
assert.strictEqual(S.canMoveDir(g.grid, "right"), true);

const blocked = S.createGame({ seed: 1 });
assert.strictEqual(S.move(blocked, "up").ok, true, "up slides the pair");
const noSlide = S.createGame({ seed: 1 });
noSlide.grid = S.emptyGrid();
noSlide.grid[0][0] = 0;
const stuck = S.move(noSlide, "up");
assert.strictEqual(stuck.ok, false);
assert.strictEqual(stuck.reason, "blocked");
assert.strictEqual(noSlide.grid[0][0], 0, "failed move does not spawn");

const merge = S.createGame({ seed: 1 });
const left = S.move(merge, "left");
assert.strictEqual(left.ok, true);
assert.strictEqual(left.merges.length, 1);
assert.strictEqual(left.merges[0].from, 0);
assert.strictEqual(left.merges[0].to, 1);
assert.strictEqual(merge.score, 10);
assert.strictEqual(merge.grid[1][0], 1, "Nigiri pair becomes Maki on the left");
const after = S.emptyCells(merge.grid).length;
assert.strictEqual(after, 14, "merge + one spawn → 2 tiles occupy the board");
assert.ok(left.spawned, "spawn after successful move");
assert.ok(left.spawned.tier === 0 || left.spawned.tier === 1);

const once = S.slideLine([0, 0, 0, 0]);
assert.deepStrictEqual(once.line, [1, 1, null, null], "each tile merges once");
assert.strictEqual(once.merges.length, 2);

const feast = S.slideLine([6, 6, null, null]);
assert.deepStrictEqual(feast.line, [6, 6, null, null], "Feast does not merge");
assert.strictEqual(feast.moved, false);

const chain = S.slideLine([0, 0, 1, null]);
assert.deepStrictEqual(chain.line, [1, 1, null, null], "new Maki does not rematch this move");

["left", "right", "up", "down"].forEach(function (dir) {
  const game = S.createGame({ seed: 7 });
  game.grid = S.emptyGrid();
  game.grid[1][1] = 0;
  game.grid[1][2] = 0;
  game.over = false;
  const result = S.move(game, dir);
  assert.strictEqual(result.ok, true, dir + " is a legal opening swipe");
});

const full = S.createGame({ seed: 2 });
full.grid = [
  [0, 1, 0, 1],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
  [1, 0, 1, 0],
];
assert.strictEqual(S.hasMoves(full.grid), false, "no empties and no adjacent matches");
full.over = false;
const dead = S.move(full, "left");
assert.strictEqual(dead.ok, false);

const almost = S.createGame({ seed: 3 });
almost.grid = [
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [2, 3, 4, 5],
  [3, 4, 5, null],
];
assert.strictEqual(S.hasMoves(almost.grid), true);

const store = {
  data: {},
  getItem: function (k) {
    return this.data[k] || null;
  },
  setItem: function (k, v) {
    this.data[k] = String(v);
  },
};
assert.strictEqual(S.loadBest(store), 0);
assert.strictEqual(S.saveBest(40, store), 40);
assert.strictEqual(S.saveBest(10, store), 40);

S.TIERS.forEach(function (tier, i) {
  assert.ok(tier.name, "tier " + i + " named");
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "tier-" + i + ".css"), "utf8");
  assert.ok(css.indexOf("base64") < 0, "tier-" + i + " CSS is a file URL, not base64");
  assert.ok(css.indexOf("../art/" + tier.file) >= 0, "tier-" + i + " points at " + tier.file);
  assert.ok(fs.existsSync(path.join(__dirname, "..", "art", tier.file)), tier.file + " exists");
});

const dropper = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
["btn-drop", "aim-rail", "Drop here", "teach-col", "current-tile", "danger"].forEach(function (deadChrome) {
  assert.ok(dropper.indexOf(deadChrome) < 0, "killed " + deadChrome);
});

console.log("logic.js ok");
