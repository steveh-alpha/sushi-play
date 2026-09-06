"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ux = fs.readFileSync(path.join(root, "css/ux.css"), "utf8");
const main = fs.readFileSync(path.join(root, "js/main.js"), "utf8");

assert.match(html, /id="teach-cue"[^>]*>Drop here first</, "on-column teach copy");
assert.match(html, /class="danger"[^>]*\bhidden\b/, "DANGER marked hidden");
assert.doesNotMatch(html, /no rising rows/, "no eng rising-rows note");
assert.doesNotMatch(html, /class="note"/, "no player-facing eng note");

assert.match(ux, /\.tile \.name\s*\{[\s\S]*display:\s*block\s*!important/, "names forced visible");
assert.match(ux, /\.danger\s*\{[\s\S]*display:\s*none\s*!important/, "DANGER hidden in CSS");

assert.match(main, /TEACH_LOCK_COPY = "Drop here first"/, "exact lock copy");
assert.match(main, /paintTeachCue\(true\)/, "bounce flashes the teach cue");
assert.match(main, /bounceHintOn/, "bounce is not silent — hint + cue");
assert.match(main, /teach-wash/, "teach column keeps a visible wash");
assert.match(ux, /\.teach-cue/, "teach cue styled in ux.css");

console.log("feel.js ok");
