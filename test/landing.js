"use strict";

const assert = require("assert");
const S = require("../js/logic.js");

const g = S.createGame({ seed: 1 });
assert.strictEqual(g.grid[S.ROWS - 1][S.TEACH_COL], 0, "seed Nigiri on teach bottom");
assert.strictEqual(g.current, 0, "held piece is Nigiri");
assert.strictEqual(S.lowestEmptyRow(g.grid, S.TEACH_COL), 6, "teach landing is stack cell above seed");
assert.strictEqual(S.lowestEmptyRow(g.grid, 0), 7, "empty column lands on bottom row");

const elsewhere = S.previewDrop(g, 0);
assert.strictEqual(elsewhere.ok, true, "first drop anywhere is allowed");
assert.strictEqual(elsewhere.reason, undefined);
assert.notStrictEqual(elsewhere.reason, "teach");

const placed = S.drop(g, 0);
assert.strictEqual(placed.ok, true, "wrong-column first drop places");
assert.strictEqual(placed.row, 7, "empty column lands on bottom row");
assert.strictEqual(g.grid[S.ROWS - 1][0], 0, "Nigiri sits in the dropped column");
assert.strictEqual(g.grid[S.ROWS - 1][S.TEACH_COL], 0, "teach seed Nigiri stays");
assert.strictEqual(g.teach, false, "teach cue ends after first drop");
assert.strictEqual(g.score, 0, "no merge when dropping off the seed");

const teachGame = S.createGame({ seed: 1 });
const preview = S.previewDrop(teachGame, S.TEACH_COL);
assert.strictEqual(preview.ok, true);
assert.strictEqual(preview.row, 6);

const ok = S.drop(teachGame, S.TEACH_COL);
assert.strictEqual(ok.ok, true);
assert.strictEqual(ok.row, 6, "place on lowest empty, then merge");
assert.strictEqual(teachGame.grid[S.ROWS - 1][S.TEACH_COL], 1, "merged to Maki on bottom");
assert.strictEqual(teachGame.teach, false);
assert.strictEqual(teachGame.score, 10);

const empty = S.previewDrop(teachGame, 0);
assert.strictEqual(empty.ok, true);
assert.strictEqual(empty.row, 7, "after teach, empty column still lands on the bottom cell");

S.TIERS.forEach(function (tier) {
  assert.ok(tier.name && tier.name.length, "tier " + tier.id + " has a readable name");
});

console.log("landing.js ok");
