"use strict";

const assert = require("assert");
const S = require("../js/logic.js");

const g = S.createGame({ seed: 1 });
assert.strictEqual(g.grid[S.ROWS - 1][S.TEACH_COL], 0, "seed Nigiri on teach bottom");
assert.strictEqual(g.current, 0, "held piece is Nigiri");
assert.strictEqual(S.lowestEmptyRow(g.grid, S.TEACH_COL), 6, "teach landing is stack cell above seed");
assert.strictEqual(S.lowestEmptyRow(g.grid, 0), 7, "empty column lands on bottom row");

const bounce = S.drop(g, 0);
assert.strictEqual(bounce.ok, false);
assert.strictEqual(bounce.reason, "teach");
assert.strictEqual(g.teach, true, "wrong-column drop does not consume teach");
assert.strictEqual(g.grid[S.ROWS - 1][0], null, "did not place in wrong column");

const preview = S.previewDrop(g, S.TEACH_COL);
assert.strictEqual(preview.ok, true);
assert.strictEqual(preview.row, 6);

const ok = S.drop(g, S.TEACH_COL);
assert.strictEqual(ok.ok, true);
assert.strictEqual(ok.row, 6, "place on lowest empty, then merge");
assert.strictEqual(g.grid[S.ROWS - 1][S.TEACH_COL], 1, "merged to Maki on bottom");
assert.strictEqual(g.teach, false);
assert.strictEqual(g.score, 10);

const empty = S.previewDrop(g, 0);
assert.strictEqual(empty.ok, true);
assert.strictEqual(empty.row, 7, "after teach, empty column still lands on the bottom cell");

console.log("landing.js ok");
